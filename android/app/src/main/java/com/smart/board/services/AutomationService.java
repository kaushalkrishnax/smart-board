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
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.smart.board.plugins.smartboard.SmartBoard;

public class AutomationService extends Service implements SensorEventListener {

    private static final String CHANNEL_ID = "AutomationChannel";

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private SmartBoard smartBoard;
    private PowerManager.WakeLock wakeLock;

    private List<AutomationRule> cachedRules = new ArrayList<>();

    private long lastShakeTime = 0;

    private boolean isFaceUpActive = false;
    private boolean isFaceDownActive = false;

    private float mAccel;
    private float mAccelCurrent;
    private float mAccelLast;

    @Override
    public void onCreate() {
        super.onCreate();

        smartBoard = new SmartBoard(this);

        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmartBoard::AutomationLock");
            wakeLock.acquire();
        }

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);

            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        }

        mAccel = 0.00f;
        mAccelCurrent = SensorManager.GRAVITY_EARTH;
        mAccelLast = SensorManager.GRAVITY_EARTH;

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_TIME_TICK);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        registerReceiver(systemEventReceiver, filter);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent != null && intent.hasExtra("automation_rules")) {
            parseRules(intent.getStringExtra("automation_rules"));
        } else if (smartBoard != null) {
            parseRules(smartBoard.getAutomations());
        }

        if (smartBoard != null) {
            smartBoard.startWebSocket();
        }

        startForegroundNotification();

        return START_STICKY;
    }

    private void parseRules(String jsonString) {
        cachedRules.clear();
        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject obj = jsonArray.optJSONObject(i);
                if (obj != null && obj.optBoolean("enabled", true)) {
                    AutomationRule rule = new AutomationRule();
                    rule.trigger = obj.optString("trigger");
                    rule.actions = obj.optJSONArray("actions");
                    cachedRules.add(rule);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private final BroadcastReceiver systemEventReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();

            if (Intent.ACTION_TIME_TICK.equals(action)) {
                String currentTime = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
                processTrigger(currentTime);
            } else if (Intent.ACTION_USER_PRESENT.equals(action)) {
                processTrigger("unlock");
            }
        }
    };

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            handleShakeDetection(x, y, z);
            handleOrientationDetection(z);
        }
    }

    private static final float SHAKE_THRESHOLD_GRAVITY = 2.7F;
    private static final int SHAKE_SLOP_TIME_MS = 500;
    private static final int SHAKE_COUNT_RESET_TIME_MS = 3000;

    private long mShakeTimestamp;
    private int mShakeCount;

    private void handleShakeDetection(float x, float y, float z) {

        float gX = x / SensorManager.GRAVITY_EARTH;
        float gY = y / SensorManager.GRAVITY_EARTH;
        float gZ = z / SensorManager.GRAVITY_EARTH;

        float gForce = (float) Math.sqrt(gX * gX + gY * gY + gZ * gZ);

        if (gForce > SHAKE_THRESHOLD_GRAVITY) {

            final long now = SystemClock.elapsedRealtime();

            if (mShakeTimestamp + SHAKE_SLOP_TIME_MS > now) {
                return;
            }

            if (mShakeTimestamp + SHAKE_COUNT_RESET_TIME_MS < now) {
                mShakeCount = 0;
            }

            mShakeTimestamp = now;
            mShakeCount++;

            processTrigger("shake");
        }
    }

    private void handleOrientationDetection(float z) {

        boolean currentlyFaceUp = z > 9.0;
        boolean currentlyFaceDown = z < -9.0;

        boolean isNeutral = z > -5.0 && z < 5.0;

        if (currentlyFaceUp && !isFaceUpActive) {
            processTrigger("face_up");
            isFaceUpActive = true;
            isFaceDownActive = false;
        } else if (currentlyFaceDown && !isFaceDownActive) {
            processTrigger("face_down");
            isFaceDownActive = true;
            isFaceUpActive = false;
        } else if (isNeutral) {
            isFaceUpActive = false;
            isFaceDownActive = false;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private void processTrigger(String triggerName) {
        for (AutomationRule rule : cachedRules) {
            if (rule.trigger.equalsIgnoreCase(triggerName)) {
                executeActions(rule.actions);
            }
        }
    }

    private void executeActions(JSONArray actions) {
        if (actions == null || actions.length() == 0)
            return;

        if (smartBoard != null) {
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
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(systemEventReceiver);

            if (sensorManager != null) {
                sensorManager.unregisterListener(this);
            }

            if (smartBoard != null) {
                smartBoard.cleanup();
            }

            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startForegroundNotification() {
        createNotificationChannel();

        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SmartBoard Active")
                .setContentText("Monitoring Sensors & Time...")
                .setSmallIcon(android.R.drawable.ic_popup_sync)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        startForeground(1, notification);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Automation Service",
                    NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private static class AutomationRule {
        String trigger;
        JSONArray actions;
    }
}