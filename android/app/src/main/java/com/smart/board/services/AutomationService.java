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
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import android.provider.Settings;
import android.widget.Toast;
import android.net.Uri;

import com.smart.board.plugins.smartboard.SmartBoard;
import com.smart.board.ui.VoiceAssistantActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class AutomationService extends Service implements SensorEventListener {

    private static final String TAG = "AutomationService";
    private static final String CHANNEL_ID = "SmartBoard_Automation_Channel";
    private static final int NOTIFICATION_ID = 1337;
    private static final float SHAKE_THRESHOLD = 2.7F;
    private static final int SHAKE_SLOP_TIME_MS = 500;
    private static final int SHAKE_RESET_TIME_MS = 3000;
    private static final long WAKE_UI_COOLDOWN = 2500;

    private SmartBoard smartBoard;
    private OwwService owwService;
    private SensorManager sensorManager;
    private HandlerThread sensorThread;
    private Handler sensorHandler;
    private PowerManager.WakeLock wakeLock;

    private final List<AutomationRule> cachedRules = new ArrayList<>();

    private long lastShakeTime = 0;
    private int mShakeCount = 0;
    private boolean isFaceUpActive = false;
    private boolean isFaceDownActive = false;
    private boolean isCovered = false;
    private long lastWakeTrigger = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        smartBoard = new SmartBoard(this);
        sensorThread = new HandlerThread("SensorThread", Thread.MAX_PRIORITY);
        sensorThread.start();
        sensorHandler = new Handler(sensorThread.getLooper());

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmartBoard::CoreLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(10 * 60 * 1000L);
        }

        initSensors();
        initBroadcastReceivers();
        initVoiceDetection();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForegroundNotification();
        if (intent != null) {
            if ("ACTION_RELOAD_VOICE".equals(intent.getAction())) {
                initVoiceDetection();
            } else if (intent.hasExtra("automation_rules")) {
                parseRules(intent.getStringExtra("automation_rules"));
            }
        }
        if (cachedRules.isEmpty()) {
            parseRules(smartBoard.getAutomations());
        }
        smartBoard.startWebSocket();
        return START_STICKY;
    }

    private void initVoiceDetection() {
        if (owwService != null) {
            owwService.close();
            owwService = null;
        }
        try {
            String owwModel = smartBoard.getConfig().owwModel;
            owwService = new OwwService(this, owwModel, new OwwService.WakeWordListener() {
                @Override
                public void onWakeWordDetected() {
                    new Handler(Looper.getMainLooper()).post(() -> handleWakeWord());
                }

                @Override
                public void onError(String error) {
                    Log.e(TAG, "OWW Error: " + error);
                }
            });
            owwService.startListening();
        } catch (Exception e) {
            Log.e(TAG, "Failed to init voice detection", e);
        }
    }

    private void handleWakeWord() {
        long now = System.currentTimeMillis();
        if (now - lastWakeTrigger < WAKE_UI_COOLDOWN)
            return;
        lastWakeTrigger = now;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Enable 'Display over other apps' to use the assistant", Toast.LENGTH_LONG).show();

            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);

            return;
        }

        Intent intent = new Intent(this, VoiceAssistantActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
    }

    private void openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {

            Toast.makeText(getApplicationContext(),
                    "Enable 'Draw over other apps' permission",
                    Toast.LENGTH_LONG).show();

            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));

            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            getApplicationContext().startActivity(i);
        }
    }

    private void initSensors() {
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager == null)
            return;

        Sensor accel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        Sensor prox = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);

        if (accel != null)
            sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_GAME, sensorHandler);
        if (prox != null)
            sensorManager.registerListener(this, prox, SensorManager.SENSOR_DELAY_NORMAL, sensorHandler);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0] / SensorManager.GRAVITY_EARTH;
            float y = event.values[1] / SensorManager.GRAVITY_EARTH;
            float z = event.values[2] / SensorManager.GRAVITY_EARTH;
            float gForce = (float) Math.sqrt(x * x + y * y + z * z);

            if (gForce > SHAKE_THRESHOLD) {
                long now = SystemClock.elapsedRealtime();
                if (now - lastShakeTime > SHAKE_SLOP_TIME_MS) {
                    if (now - lastShakeTime > SHAKE_RESET_TIME_MS)
                        mShakeCount = 0;
                    lastShakeTime = now;
                    mShakeCount++;
                    runOnMain(() -> processTrigger("shake"));
                }
            }

            boolean faceUp = event.values[2] > 9.0;
            boolean faceDown = event.values[2] < -9.0;
            boolean neutral = event.values[2] > -5 && event.values[2] < 5;

            if (faceUp && !isFaceUpActive) {
                isFaceUpActive = true;
                isFaceDownActive = false;
                runOnMain(() -> processTrigger("face_up"));
            } else if (faceDown && !isFaceDownActive) {
                isFaceDownActive = true;
                isFaceUpActive = false;
                runOnMain(() -> processTrigger("face_down"));
            } else if (neutral) {
                isFaceUpActive = false;
                isFaceDownActive = false;
            }
        } else if (event.sensor.getType() == Sensor.TYPE_PROXIMITY) {
            boolean covered = event.values[0] < 1.0f;
            if (covered && !isCovered) {
                isCovered = true;
                runOnMain(() -> processTrigger("proximity_near"));
            } else if (!covered && isCovered) {
                isCovered = false;
                runOnMain(() -> processTrigger("proximity_far"));
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private void initBroadcastReceivers() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_TIME_TICK);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        registerReceiver(systemEventReceiver, filter);
    }

    private final BroadcastReceiver systemEventReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_TIME_TICK.equals(intent.getAction())) {
                processTrigger(new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date()));
            } else if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                processTrigger("unlock");
            }
        }
    };

    private void parseRules(String jsonString) {
        if (jsonString == null)
            return;
        cachedRules.clear();
        try {
            JSONArray arr = new JSONArray(jsonString);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj != null && obj.optBoolean("enabled", true)) {
                    cachedRules.add(new AutomationRule(obj.optString("trigger"), obj.optJSONArray("actions")));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing rules", e);
        }
    }

    private void processTrigger(String triggerName) {
        for (AutomationRule rule : cachedRules) {
            if (rule.trigger.equalsIgnoreCase(triggerName))
                executeActions(rule.actions);
        }
    }

    private void executeActions(JSONArray actions) {
        if (actions == null || smartBoard == null)
            return;
        for (int i = 0; i < actions.length(); i++) {
            JSONObject action = actions.optJSONObject(i);
            if (action != null) {
                smartBoard.sendAction(
                        "{\"type\":\"toggle\",\"id\":" + action.optInt("id") + ",\"state\":\""
                                + action.optString("state") + "\"}");
            }
        }
    }

    private void runOnMain(Runnable r) {
        new Handler(Looper.getMainLooper()).post(r);
    }

    @Override
    public void onDestroy() {
        if (owwService != null)
            owwService.close();
        try {
            unregisterReceiver(systemEventReceiver);
        } catch (Exception ignored) {
        }
        if (sensorManager != null)
            sensorManager.unregisterListener(this);
        if (sensorThread != null)
            sensorThread.quitSafely();
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

    private void startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Automation Service",
                    NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Keeps the automation engine running");
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0,
                getPackageManager().getLaunchIntentForPackage(getPackageName()),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SmartBoard Active")
                .setContentText("Listening for Automation Triggers")
                .setSmallIcon(android.R.drawable.ic_popup_sync)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private static class AutomationRule {
        final String trigger;
        final JSONArray actions;

        AutomationRule(String t, JSONArray a) {
            this.trigger = t;
            this.actions = a;
        }
    }
}