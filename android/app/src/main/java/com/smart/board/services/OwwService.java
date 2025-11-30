package com.smart.board.services;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Process;
import android.util.Log;
import androidx.core.content.ContextCompat;
import org.tensorflow.lite.Interpreter;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;

public class OwwService {

  private static final String TAG = "OwwService";
  private static final float GAIN = 100.0f;
  private static final int NEW_AUDIO_SIZE = 1280;
  private static final int RAW_BUFFER_SIZE = 1760;
  private static final int RAW_OVERLAP = 480;
  private static final int MEL_FRAMES = 76;
  private static final int MEL_CHANNELS = 32;
  private static final int EMB_WINDOW = 16;
  private static final int EMB_FEATURES = 96;
  private static final float THRESHOLD = 0.5f;

  private final Context ctx;
  private final WakeWordListener listener;

  private Interpreter melTflite;
  private Interpreter embTflite;
  private Interpreter wakeTflite;

  private final float[] rawDataBuffer = new float[RAW_BUFFER_SIZE];
  private final float[][][][] melspecBuffer = new float[1][MEL_FRAMES][MEL_CHANNELS][1];
  private final float[][][] embeddingBuffer = new float[1][EMB_WINDOW][EMB_FEATURES];

  private final float[][] rawInputWrapper = new float[1][RAW_BUFFER_SIZE];
  private final float[][][][] melOutputContainer = new float[1][1][8][32];
  private final float[][][][] embOutputContainer = new float[1][1][1][96];
  private final float[][] wakeOutputContainer = new float[1][1];

  private AudioRecord rec;
  private final AtomicBoolean running = new AtomicBoolean(false);
  private Thread loop;

  public interface WakeWordListener {
    void onWakeWordDetected();

    void onError(String e);
  }

  public OwwService(Context ctx, String model, WakeWordListener listener) {
    this.ctx = ctx.getApplicationContext();
    this.listener = listener;
    try {
      init(model);
    } catch (Exception e) {
      if (listener != null)
        listener.onError(e.getMessage());
    }
  }

  private void init(String model) throws Exception {
    if (model == null || model.isEmpty())
      model = "alexa";
    Interpreter.Options opts = new Interpreter.Options();
    opts.setUseXNNPACK(true);
    opts.setNumThreads(1);

    melTflite = new Interpreter(loadAsset("oww/melspectrogram.tflite"), opts);
    embTflite = new Interpreter(loadAsset("oww/embedding_model.tflite"), opts);
    wakeTflite = new Interpreter(loadAsset("oww/models/" + model + ".tflite"), opts);
  }

  public void startListening() {
    if (running.get())
      return;
    if (ContextCompat.checkSelfPermission(ctx,
        Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      if (listener != null)
        listener.onError("Permission required");
      return;
    }
    running.set(true);
    loop = new Thread(this::audioLoop, "OWW_Loop");
    loop.start();
  }

  public void stopListening() {
    running.set(false);
    stopRec();
  }

  public void close() {
    stopListening();
    try {
      if (melTflite != null)
        melTflite.close();
      if (embTflite != null)
        embTflite.close();
      if (wakeTflite != null)
        wakeTflite.close();
    } catch (Exception e) {
      Log.e(TAG, "Error closing resources", e);
    }
  }

  @SuppressLint("MissingPermission")
  private void audioLoop() {
    Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO);
    int minBuf = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
    int bufSize = Math.max(minBuf, NEW_AUDIO_SIZE * 4);

    rec = new AudioRecord(MediaRecorder.AudioSource.MIC, 16000, AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT, bufSize);
    rec.startRecording();

    short[] rawShorts = new short[NEW_AUDIO_SIZE];
    float[] newFloats = new float[NEW_AUDIO_SIZE];

    while (running.get()) {
      int read = rec.read(rawShorts, 0, NEW_AUDIO_SIZE);
      if (read == NEW_AUDIO_SIZE) {
        for (int i = 0; i < NEW_AUDIO_SIZE; i++) {
          newFloats[i] = (rawShorts[i] / 32768f) * GAIN;
        }
        processPipeline(newFloats);
      }
    }
    stopRec();
  }

  private synchronized void processPipeline(float[] newAudio) {
    try {
      System.arraycopy(rawDataBuffer, NEW_AUDIO_SIZE, rawDataBuffer, 0, RAW_OVERLAP);
      System.arraycopy(newAudio, 0, rawDataBuffer, RAW_OVERLAP, NEW_AUDIO_SIZE);
      System.arraycopy(rawDataBuffer, 0, rawInputWrapper[0], 0, RAW_BUFFER_SIZE);

      melTflite.run(rawInputWrapper, melOutputContainer);
      float[][] newMels = melOutputContainer[0][0];

      for (int i = 0; i < MEL_FRAMES - 8; i++) {
        for (int j = 0; j < MEL_CHANNELS; j++) {
          melspecBuffer[0][i][j][0] = melspecBuffer[0][i + 8][j][0];
        }
      }
      for (int i = 0; i < 8; i++) {
        for (int j = 0; j < MEL_CHANNELS; j++) {
          melspecBuffer[0][MEL_FRAMES - 8 + i][j][0] = 2.0f + (newMels[i][j] / 10.0f);
        }
      }

      embTflite.run(melspecBuffer, embOutputContainer);
      float[] newEmb = embOutputContainer[0][0][0];

      for (int i = 0; i < EMB_WINDOW - 1; i++) {
        System.arraycopy(embeddingBuffer[0][i + 1], 0, embeddingBuffer[0][i], 0, EMB_FEATURES);
      }
      System.arraycopy(newEmb, 0, embeddingBuffer[0][EMB_WINDOW - 1], 0, EMB_FEATURES);

      wakeTflite.run(embeddingBuffer, wakeOutputContainer);
      if (wakeOutputContainer[0][0] > THRESHOLD) {
        if (listener != null) {
          Log.i(TAG, "Wake Word Detected Score: " + wakeOutputContainer[0][0]);
          listener.onWakeWordDetected();
        }
        for (float[] row : embeddingBuffer[0])
          Arrays.fill(row, 0f);
      }
    } catch (Exception e) {
      Log.e(TAG, "Pipeline Error", e);
    }
  }

  private void stopRec() {
    if (rec != null) {
      try {
        rec.stop();
        rec.release();
      } catch (Exception ignored) {
      }
      rec = null;
    }
  }

  private MappedByteBuffer loadAsset(String path) throws IOException {
    AssetFileDescriptor fd = ctx.getAssets().openFd(path);
    FileInputStream is = new FileInputStream(fd.getFileDescriptor());
    FileChannel fc = is.getChannel();
    return fc.map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
  }
}