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
import android.util.SparseArray;
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
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VoiceAssistantActivity extends Activity implements RecognitionListener {

    private static final String TAG = "VoiceAssistant";

    private SmartBoard smartBoard;
    private TextToSpeech tts;
    private SoundPool soundPool;
    private int soundStartId;

    private static Model model;
    private SpeechService speechService;
    private boolean isListening = false;

    private TextView tvStatus, tvResult;
    private ImageView ivMic, glowEffect;
    private LinearLayout listWrapper;
    private RecyclerView rvSwitches;
    private AnimatorSet pulseAnimator;

    private final Map<String, Integer> keywordToIdMap = new HashMap<>();
    private final SparseArray<String> idToLabelMap = new SparseArray<>();
    private String grammarJsonString = "[]";
    private final List<SwitchItem> cachedListItems = new ArrayList<>();

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
        tvStatus.setText("Initializing...");

        parseConfigAndBuildGrammar();

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

        if (model == null) {
            loadVoskModelAsync();
        } else {
            new Handler(Looper.getMainLooper()).postDelayed(this::startListening, 500);
        }
    }

    private void parseConfigAndBuildGrammar() {
        keywordToIdMap.clear();
        idToLabelMap.clear();
        cachedListItems.clear();

        List<String> actions = Arrays.asList(
                "on", "off",
                "start", "stop",
                "enable", "disable",
                "activate", "deactivate",
                "turn", "switch", "power",
                "turn on", "turn off",
                "switch on", "switch off",
                "power on", "power off");

        List<String> numbers = Arrays.asList(
                "one", "1", "first",
                "two", "2", "second",
                "three", "3", "third",
                "four", "4", "fourth");

        List<String> fillers = Arrays.asList(
                "the", "my", "this", "that", "please", "now");

        StringBuilder g = new StringBuilder("[");
        for (String a : actions)
            g.append("\"").append(a).append("\",");
        for (String n : numbers)
            g.append("\"").append(n).append("\",");
        for (String f : fillers)
            g.append("\"").append(f).append("\",");

        try {
            SmartBoard.Config config = smartBoard.getConfig();
            if (config != null && config.switches != null) {
                String jsonStr = config.switches.trim();
                JSONArray arr = null;

                if (jsonStr.startsWith("{")) {
                    JSONObject root = new JSONObject(jsonStr);
                    arr = root.optJSONArray("switches");
                } else if (jsonStr.startsWith("[")) {
                    arr = new JSONArray(jsonStr);
                }

                if (arr != null) {
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject o = arr.getJSONObject(i);
                        int id = o.optInt("id");
                        String label = o.optString("label", "Switch " + id);

                        String clean = label.toLowerCase().replaceAll("[^a-z0-9 ]", "").trim();

                        keywordToIdMap.put(clean, id);
                        idToLabelMap.put(id, label);
                        cachedListItems.add(new SwitchItem(id, label, false));

                        for (String word : clean.split("\\s+")) {
                            if (!word.isEmpty())
                                g.append("\"").append(word).append("\",");
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Config Parse Error", e);
        }

        g.append("\"[unk]\"]");
        grammarJsonString = g.toString();
    }

    private void setupSoundPool() {
        AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        soundPool = new SoundPool.Builder().setMaxStreams(1).setAudioAttributes(attributes).build();
        soundStartId = soundPool.load(this, R.raw.listening_start, 1);
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
                StorageService.unpack(this, "vosk-en-in", "model",
                        (m) -> {
                            model = m;
                            runOnUiThread(this::startListening);
                        },
                        (e) -> Log.e(TAG, "Vosk Error", e));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void startListening() {
        if (model == null)
            return;
        if (isListening)
            return;

        try {
            if (soundStartId != 0)
                soundPool.play(soundStartId, 1f, 1f, 1, 0, 1f);

            Recognizer recognizer = new Recognizer(model, 16000.0f, grammarJsonString);

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
            String finalText = new JSONObject(hypothesis).optString("text", "");
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
        if (command == null)
            return;
        String raw = command.trim();
        String lower = raw.toLowerCase();
        tvResult.setText(raw);

        Set<String> tokens = new HashSet<>(Arrays.asList(lower.split("\\s+")));

        String[] onWords = { "on", "start", "enable", "activate", "turn on", "switch on", "power on" };
        String[] offWords = { "off", "stop", "disable", "deactivate", "turn off", "switch off", "power off" };

        double onScore = scoreIntent(lower, tokens, onWords);
        double offScore = scoreIntent(lower, tokens, offWords);

        String state = null;
        if (onScore > 0.4 || onScore > offScore)
            state = "ON";
        else if (offScore > 0.4)
            state = "OFF";

        if (state == null) {
            speak("I didn't understand the action");
            showFallbackList();
            return;
        }

        SparseArray<String> labels = idToLabelMap;
        double bestScore = 0;
        int bestId = -1;

        Map<Integer, List<String>> numberMap = new HashMap<>();
        numberMap.put(1, Arrays.asList("one", "1", "first"));
        numberMap.put(2, Arrays.asList("two", "2", "second"));
        numberMap.put(3, Arrays.asList("three", "3", "third"));
        numberMap.put(4, Arrays.asList("four", "4", "fourth"));

        for (Map.Entry<Integer, List<String>> e : numberMap.entrySet()) {
            double s = scoreDevice(lower, tokens, e.getValue());
            if (s > bestScore) {
                bestScore = s;
                bestId = e.getKey();
            }
        }

        for (int i = 0; i < labels.size(); i++) {
            int key = labels.keyAt(i);
            String label = labels.valueAt(i).toLowerCase();
            List<String> parts = Arrays.asList(label.split(" "));
            double s = scoreDevice(lower, tokens, parts);
            if (s > bestScore) {
                bestScore = s;
                bestId = key;
            }
        }

        if (bestId == -1 || bestScore < 0.35) {
            speak("I couldn't find that device");
            showFallbackList();
            return;
        }

        String device = labels.get(bestId);
        sendAction(bestId, state);
        speak("Turned " + state.toLowerCase() + " " + device);
        new Handler(Looper.getMainLooper()).postDelayed(this::finish, 1500);
    }

    private double scoreIntent(String raw, Set<String> tokens, String[] list) {
        double s = 0;
        for (String w : list) {
            if (w.contains(" ")) {
                if (raw.contains(w))
                    s += 0.9;
            } else {
                if (tokens.contains(w))
                    s += 0.7;
            }
            for (String t : tokens) {
                if (fuzzy(t, w))
                    s += 0.3;
            }
        }
        return Math.min(1, s);
    }

    private double scoreDevice(String raw, Set<String> tokens, List<String> words) {
        double s = 0;
        for (String w : words) {
            if (raw.contains(w))
                s += 0.7;
            if (tokens.contains(w))
                s += 0.7;
            for (String t : tokens) {
                if (fuzzy(t, w))
                    s += 0.3;
            }
        }
        return Math.min(1, s);
    }

    private boolean fuzzy(String a, String b) {
        int d = dist(a, b);
        if (b.length() <= 3)
            return d <= 1;
        if (b.length() <= 6)
            return d <= 2;
        return d <= 3;
    }

    private int dist(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++)
            dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++)
            dp[0][j] = j;

        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1))
                    dp[i][j] = dp[i - 1][j - 1];
                else
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
        return dp[a.length()][b.length()];
    }

    private void showFallbackList() {
        tvStatus.setText("Tap an option below");
        rvSwitches.setLayoutManager(new LinearLayoutManager(this));
        rvSwitches.setAdapter(new SwitchAdapter(cachedListItems));
        listWrapper.setVisibility(View.VISIBLE);
    }

    private void sendAction(int id, String state) {
        String payload = "{\"type\":\"toggle\",\"id\":" + id + ",\"state\":\"" + state + "\"}";
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

    private void unlockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null)
                km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopListening();
        if (tts != null)
            tts.shutdown();
        if (soundPool != null)
            soundPool.release();
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
                new Handler(Looper.getMainLooper()).postDelayed(() -> finish(), 500);
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
}