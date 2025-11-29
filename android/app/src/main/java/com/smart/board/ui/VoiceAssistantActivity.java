package com.smart.board.ui;

import android.Manifest;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.SoundPool;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.smart.board.R;
import com.smart.board.plugins.smartboard.SmartBoard;

import org.json.JSONArray;
import org.json.JSONObject;
import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;
import org.vosk.android.StorageService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VoiceAssistantActivity extends Activity implements RecognitionListener {

    private static final String TAG = "VoiceAssistant";

    private SmartBoard smartBoard;
    private TextToSpeech tts;
    private SoundPool soundPool;
    private int soundStartId;

    private Model model;
    private SpeechService speechService;
    private boolean isModelLoaded = false;
    private boolean isListening = false;

    private TextView tvStatus, tvResult;
    private ImageView ivMic, glowEffect;
    private LinearLayout listWrapper;
    private RecyclerView rvSwitches;
    private AnimatorSet pulseAnimator;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        unlockScreen();
        setContentView(R.layout.activity_voice_assistant);

        tvStatus = findViewById(R.id.tvStatus);
        tvResult = findViewById(R.id.tvResult);
        ivMic = findViewById(R.id.ivMic);
        glowEffect = findViewById(R.id.glowEffect);
        listWrapper = findViewById(R.id.listWrapper);
        rvSwitches = findViewById(R.id.rvSwitches);

        smartBoard = new SmartBoard(this);
        tvStatus.setText("Just a moment...");

        findViewById(R.id.rootLayout).setOnClickListener(v -> finish());
        findViewById(R.id.bottomSheetContainer).setOnClickListener(v -> {
        });

        ivMic.setOnClickListener(v -> {
            if (!isListening)
                startListening();
            else
                stopListening();
        });

        setupSoundPool();
        initTTS();
        loadVoskModelAsync();
    }

    private void setupSoundPool() {
        AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        soundPool = new SoundPool.Builder().setMaxStreams(1).setAudioAttributes(attributes).build();

        try {
            soundStartId = soundPool.load(this, R.raw.listening_start, 1);
        } catch (Exception e) {
            Log.e(TAG, "Sound file missing");
        }
    }

    private void initTTS() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS)
                tts.setLanguage(Locale.US);
        });
    }

    private void loadVoskModelAsync() {
        if (ContextCompat.checkSelfPermission(this,
                Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            tvStatus.setText("Need Mic Permission");
            return;
        }

        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                LibVosk.setLogLevel(LogLevel.INFO);
                StorageService.unpack(this, "vosk-en-us", "model",
                        (model) -> {
                            this.model = model;
                            this.isModelLoaded = true;
                            runOnUiThread(this::startListening);
                        },
                        (e) -> Log.e(TAG, "Vosk Error", e));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void startListening() {
        if (!isModelLoaded || model == null)
            return;
        if (isListening)
            return;

        try {
            if (soundStartId != 0)
                soundPool.play(soundStartId, 1f, 1f, 1, 0, 1f);

            Recognizer recognizer = new Recognizer(model, 16000.0f);
            speechService = new SpeechService(recognizer, 16000.0f);
            speechService.startListening(this);
            isListening = true;

            tvStatus.setText("Listening...");
            tvResult.setText("");
            listWrapper.setVisibility(View.GONE);
            startCyanPulse();

        } catch (IOException e) {
            tvStatus.setText("Mic Error");
        }
    }

    private void stopListening() {
        if (speechService != null) {
            speechService.stop();
            speechService = null;
        }
        isListening = false;
        stopCyanPulse();
    }

    @Override
    public void onPartialResult(String hypothesis) {
        try {
            JSONObject json = new JSONObject(hypothesis);
            String partialText = json.optString("partial", "");
            if (!partialText.isEmpty())
                tvResult.setText(partialText);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onResult(String hypothesis) {
        try {
            JSONObject json = new JSONObject(hypothesis);
            String finalText = json.optString("text", "");
            if (!finalText.isEmpty()) {
                stopListening();
                processCommand(finalText);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onFinalResult(String h) {
    }

    @Override
    public void onError(Exception e) {
        stopListening();
        handleFailure();
    }

    @Override
    public void onTimeout() {
        stopListening();
        handleFailure();
    }

    private void processCommand(String command) {
        String lowerCmd = command.toLowerCase().trim();
        tvResult.setText(command);

        String state = null;
        if (lowerCmd.contains("on") || lowerCmd.contains("start"))
            state = "ON";
        else if (lowerCmd.contains("off") || lowerCmd.contains("stop"))
            state = "OFF";

        if (state == null) {
            speak("I didn't understand that.");
            showFallbackList();
            return;
        }

        int switchId = findIdByLabel(lowerCmd);
        if (switchId != -1) {
            String switchName = getSwitchName(switchId);
            sendAction(switchId, state);
            speak("Turned " + state.toLowerCase() + " " + switchName);
            new Handler(Looper.getMainLooper()).postDelayed(this::finish, 2000);
        } else {
            speak("I couldn't find that device.");
            showFallbackList();
        }
    }

    private void showFallbackList() {
        tvStatus.setText("Tap an option above");
        setupSwitchList();
        listWrapper.setVisibility(View.VISIBLE);
    }

    private void setupSwitchList() {
        rvSwitches.setLayoutManager(new LinearLayoutManager(this));
        List<SwitchItem> items = new ArrayList<>();

        try {
            SmartBoard.Config config = smartBoard.getConfig();

            if (config != null && config.switches != null) {
                String jsonStr = config.switches.trim();
                JSONArray array = null;

                if (jsonStr.startsWith("{")) {
                    JSONObject root = new JSONObject(jsonStr);
                    if (root.has("switches")) {
                        array = root.getJSONArray("switches");
                    }
                } else if (jsonStr.startsWith("[")) {
                    array = new JSONArray(jsonStr);
                }

                if (array != null) {
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.getJSONObject(i);
                        items.add(new SwitchItem(
                                obj.optInt("id"),
                                obj.optString("label", "Switch " + obj.optInt("id")),
                                false // <--- FORCED OFF (Static)
                        ));
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "List Error", e);
        }

        rvSwitches.setAdapter(new SwitchAdapter(items));
    }

    private String getSwitchName(int id) {
        try {
            JSONArray switches = new JSONArray(smartBoard.getConfig().switches);
            for (int i = 0; i < switches.length(); i++) {
                if (switches.getJSONObject(i).optInt("id") == id)
                    return switches.getJSONObject(i).optString("label", "switch");
            }
        } catch (Exception e) {
        }
        return "the device";
    }

    private int findIdByLabel(String command) {
        if (command.contains("one") || command.contains(" 1"))
            return 1;
        if (command.contains("two") || command.contains(" 2"))
            return 2;
        if (command.contains("three") || command.contains(" 3"))
            return 3;
        if (command.contains("four") || command.contains(" 4"))
            return 4;

        try {
            JSONArray switches = new JSONArray(smartBoard.getConfig().switches);
            for (int i = 0; i < switches.length(); i++) {
                String label = switches.getJSONObject(i).optString("label", "").toLowerCase();
                if (!label.isEmpty() && command.contains(label))
                    return switches.getJSONObject(i).optInt("id", -1);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error finding switch", e);
        }
        return -1;
    }

    private void sendAction(int id, String state) {
        String payload = String.format("{\"type\":\"toggle\",\"id\":%d,\"state\":\"%s\"}", id, state);
        smartBoard.sendAction(payload);
    }

    private void speak(String text) {
        if (tts != null)
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, null);
    }

    private void handleFailure() {
        speak("I didn't hear you.");
        showFallbackList();
    }

    private void startCyanPulse() {
        glowEffect.setVisibility(View.VISIBLE);
        ObjectAnimator scaleX = ObjectAnimator.ofFloat(glowEffect, "scaleX", 1.0f, 1.5f);
        ObjectAnimator scaleY = ObjectAnimator.ofFloat(glowEffect, "scaleY", 1.0f, 1.5f);
        ObjectAnimator alpha = ObjectAnimator.ofFloat(glowEffect, "alpha", 0.8f, 0.0f);

        pulseAnimator = new AnimatorSet();
        pulseAnimator.playTogether(scaleX, scaleY, alpha);
        pulseAnimator.setDuration(1500);
        pulseAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        pulseAnimator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                if (isListening)
                    pulseAnimator.start();
            }
        });
        pulseAnimator.start();
    }

    private void stopCyanPulse() {
        if (pulseAnimator != null)
            pulseAnimator.cancel();
        glowEffect.setVisibility(View.INVISIBLE);
        glowEffect.setScaleX(1.0f);
        glowEffect.setScaleY(1.0f);
    }

    private static class SwitchItem {
        int id;
        String label;
        boolean isOn;

        SwitchItem(int id, String label, boolean isOn) {
            this.id = id;
            this.label = label;
            this.isOn = isOn;
        }
    }

    private class SwitchAdapter extends RecyclerView.Adapter<SwitchAdapter.ViewHolder> {
        List<SwitchItem> items;

        SwitchAdapter(List<SwitchItem> items) {
            this.items = items;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup p, int t) {
            return new ViewHolder(LayoutInflater.from(p.getContext()).inflate(R.layout.item_switch, p, false));
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder h, int pos) {
            SwitchItem item = items.get(pos);
            h.label.setText(item.label);
            h.toggle.setOnCheckedChangeListener(null);
            h.toggle.setChecked(item.isOn);
            h.toggle.setOnCheckedChangeListener((b, c) -> {
                sendAction(item.id, c ? "ON" : "OFF");
                stopListening();
            });
        }

        @Override
        public int getItemCount() {
            return items.size();
        }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView label;
            Switch toggle;

            ViewHolder(View v) {
                super(v);
                label = v.findViewById(R.id.tvSwitchLabel);
                toggle = v.findViewById(R.id.swToggle);
            }
        }
    }

    private void unlockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null)
                km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopListening();
        if (model != null)
            model.close();
        if (tts != null)
            tts.shutdown();
        if (soundPool != null)
            soundPool.release();
    }
}