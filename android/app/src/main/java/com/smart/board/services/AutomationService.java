package com.smart.board.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import android.content.pm.ServiceInfo;
import androidx.core.app.NotificationCompat;

import com.smart.board.R;
import com.smart.board.plugins.smartboard.SmartBoard;
import com.smart.board.ui.VoiceAssistantActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import ai.picovoice.porcupine.PorcupineException;
import ai.picovoice.porcupine.PorcupineManager;
import ai.picovoice.porcupine.PorcupineManagerCallback;

public class AutomationService extends Service implements SensorEventListener {

    private static final String TAG = "AutomationService";
    private static final String CHANNEL_ID = "SmartBoard_Automation_Channel";
    private static final int NOTIFICATION_ID = 1337;

    private static final String PREFS_NAME = "SmartBoardPrefs";
    private static final String KEY_PICOVOICE_ACCESS_KEY = "picovoice_access_key";
    private static final String KEY_PICOVOICE_MODEL = "picovoice_model";

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private Sensor proximitySensor;
    private PowerManager.WakeLock wakeLock;
    private SmartBoard smartBoard;

    private PorcupineManager porcupineManager;

    private final List<AutomationRule> cachedRules = new ArrayList<>();
    private long lastShakeTime = 0;
    private int mShakeCount = 0;
    private boolean isFaceUpActive = false;
    private boolean isFaceDownActive = false;
    private boolean isCovered = false;

    private static final float SHAKE_THRESHOLD = 2.7F;
    private static final int SHAKE_SLOP_TIME_MS = 500;
    private static final int SHAKE_RESET_TIME_MS = 3000;

    @Override
    public void onCreate() {
        super.onCreate();

        smartBoard = new SmartBoard(this);

        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {

            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmartBoard::CoreLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire();
        }

        initSensors();

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_TIME_TICK);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        registerReceiver(systemEventReceiver, filter);

        initPicovoice();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        startForegroundNotification();

        if (intent != null) {

            if ("ACTION_RELOAD_VOICE".equals(intent.getAction())) {
                initPicovoice();
            }

            else if (intent.hasExtra("automation_rules")) {
                parseRules(intent.getStringExtra("automation_rules"));
            }
        }

        if (cachedRules.isEmpty() && smartBoard != null) {
            parseRules(smartBoard.getAutomations());
        }

        if (smartBoard != null) {
            smartBoard.startWebSocket();
        }

        return START_STICKY;
    }

    private void initPicovoice() {

        stopPicovoice();

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String picovoiceAccessKey = prefs.getString(KEY_PICOVOICE_ACCESS_KEY, "").trim();
        String picovoiceWakeWord = prefs.getString(KEY_PICOVOICE_MODEL, "Jarvis");

        if (picovoiceAccessKey.isEmpty()) {
            return;
        }

        try {
            String keywordPath = getPicovoiceKeywordPath(picovoiceWakeWord);

            porcupineManager = new PorcupineManager.Builder()
                    .setAccessKey(picovoiceAccessKey)
                    .setKeywordPath(keywordPath)
                    .setSensitivity(0.7f)
                    .build(getApplicationContext(), keywordIndex -> {

                        processTrigger("picovoice_wake");

                        launchVoiceAssistantUI();
                    });

            porcupineManager.start();

        } catch (PorcupineException e) {
            Log.e(TAG, "Picovoice Engine Failed: " + e.getMessage());
        }
    }

    private void stopPicovoice() {
        if (porcupineManager != null) {
            try {
                porcupineManager.stop();
                porcupineManager.delete();
            } catch (Exception e) {

            }
            porcupineManager = null;
        }
    }

    private String getPicovoiceKeywordPath(String picovoiceWakeWord) {
        String fileName = picovoiceWakeWord.toLowerCase(Locale.ROOT).trim() + "_android.ppn";
        String assetPath = "picovoice_models/" + fileName;

        try {
            String[] files = getAssets().list("picovoice_models");
            if (files != null && Arrays.asList(files).contains(fileName)) {
                return assetPath;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "picovoice_models/jarvis_android.ppn";
    }

    private void launchVoiceAssistantUI() {

        Intent intent = new Intent(this, VoiceAssistantActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !android.provider.Settings.canDrawOverlays(this)) {
            new Handler(Looper.getMainLooper()).post(() -> android.widget.Toast.makeText(this,
                    "Permission Required: Please allow 'Display over other apps'",
                    android.widget.Toast.LENGTH_LONG).show());
            return;
        }

        try {
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch Voice UI: " + e.getMessage());
        }
    }

    private void initSensors() {
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager == null)
            return;

        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        }

        proximitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
        if (proximitySensor != null) {
            sensorManager.registerListener(this, proximitySensor, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            processAccelerometer(event.values);
        } else if (event.sensor.getType() == Sensor.TYPE_PROXIMITY) {
            processProximity(event.values[0]);
        }
    }

    private void processAccelerometer(float[] values) {
        float x = values[0];
        float y = values[1];
        float z = values[2];

        float gX = x / SensorManager.GRAVITY_EARTH;
        float gY = y / SensorManager.GRAVITY_EARTH;
        float gZ = z / SensorManager.GRAVITY_EARTH;
        float gForce = (float) Math.sqrt(gX * gX + gY * gY + gZ * gZ);

        if (gForce > SHAKE_THRESHOLD) {
            long now = SystemClock.elapsedRealtime();
            if (lastShakeTime + SHAKE_SLOP_TIME_MS > now)
                return;
            if (lastShakeTime + SHAKE_RESET_TIME_MS < now)
                mShakeCount = 0;

            lastShakeTime = now;
            mShakeCount++;
            processTrigger("shake");
        }

        boolean currentlyFaceUp = z > 9.0;
        boolean currentlyFaceDown = z < -9.0;
        boolean isNeutral = z > -5.0 && z < 5.0;

        if (currentlyFaceUp && !isFaceUpActive) {
            isFaceUpActive = true;
            isFaceDownActive = false;
            processTrigger("face_up");
        } else if (currentlyFaceDown && !isFaceDownActive) {
            isFaceDownActive = true;
            isFaceUpActive = false;
            processTrigger("face_down");
        } else if (isNeutral) {
            isFaceUpActive = false;
            isFaceDownActive = false;
        }
    }

    private void processProximity(float distance) {
        final float NEAR_THRESHOLD = 1.0f;
        boolean currentlyCovered = distance < NEAR_THRESHOLD;

        if (currentlyCovered && !isCovered) {
            isCovered = true;
            processTrigger("proximity_near");
        } else if (!currentlyCovered && isCovered) {
            isCovered = false;
            processTrigger("proximity_far");
        }
    }

    private final BroadcastReceiver systemEventReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_TIME_TICK.equals(intent.getAction())) {
                String time = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
                processTrigger(time);
            } else if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                processTrigger("unlock");
            }
        }
    };

    @Override
    public void onDestroy() {
        stopPicovoice();

        try {
            unregisterReceiver(systemEventReceiver);
        } catch (Exception ignored) {
        }
        if (sensorManager != null)
            sensorManager.unregisterListener(this);
        if (smartBoard != null)
            smartBoard.cleanup();
        if (wakeLock != null && wakeLock.isHeld())
            wakeLock.release();

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void parseRules(String jsonString) {
        if (jsonString == null)
            return;
        cachedRules.clear();
        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject obj = jsonArray.optJSONObject(i);
                if (obj != null && obj.optBoolean("enabled", true)) {
                    cachedRules.add(new AutomationRule(
                            obj.optString("trigger"),
                            obj.optJSONArray("actions")));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Rule Parse Error: " + e.getMessage());
        }
    }

    private void processTrigger(String triggerName) {

        for (AutomationRule rule : cachedRules) {
            if (rule.trigger.equalsIgnoreCase(triggerName)) {
                executeActions(rule.actions);
            }
        }
    }

    private void executeActions(JSONArray actions) {
        if (actions == null || smartBoard == null)
            return;
        for (int i = 0; i < actions.length(); i++) {
            JSONObject action = actions.optJSONObject(i);
            if (action != null) {

                int id = action.optInt("id");
                String state = action.optString("state");
                String payload = String.format("{\"type\":\"toggle\",\"id\":%d,\"state\":\"%s\"}", id, state);
                smartBoard.sendAction(payload);
            }
        }
    }

    private void startForegroundNotification() {
        createNotificationChannel();

        Intent notificationIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SmartBoard Active")
                .setContentText("Listening for "
                        + getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(KEY_PICOVOICE_MODEL, "Voice")
                        + " & Sensors")
                .setSmallIcon(android.R.drawable.ic_popup_sync)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Automation Service",
                    NotificationManager.IMPORTANCE_LOW);
            serviceChannel.setDescription("Keeps the automation engine running in the background");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private static class AutomationRule {
        String trigger;
        JSONArray actions;

        AutomationRule(String t, JSONArray a) {
            this.trigger = t;
            this.actions = a;
        }
    }
}