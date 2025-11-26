package com.smart.board.plugins.smartboard;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.os.Handler;
import android.os.Looper;

import com.smart.board.services.AutomationService;

public class SmartBoard {

    private static final String PREF_NAME = "SmartBoardPrefs";
    private static final String KEY_URL = "ws_url";
    private static final String KEY_TOKEN = "ws_token";
    private static final String KEY_SWITCHES = "switches";
    private static final String AUTOMATION_RULES = "automation_rules";

    private final Context context;
    private final WebSocketManager wsManager;
    private EventListener listener;

    public interface EventListener {
        void onEvent(String name, String data);
    }

    public SmartBoard(Context context) {
        this.context = context.getApplicationContext();

        this.wsManager = new WebSocketManager(json -> {
            if (listener != null)
                listener.onEvent("esp_event", json);
        });
    }

    public void setEventCallback(EventListener listener) {
        this.listener = listener;
    }

    public void startWebSocket() {
        Config config = getConfig();
        if (!config.url.isEmpty() && !wsManager.isConnected()) {
            wsManager.connect(config.url, config.token);
        }
    }

    public void stopWebSocket() {
        wsManager.disconnect();
    }

    public boolean isConnected() {
        return wsManager.isConnected();
    }

    public void sendAction(String jsonPayload) {
        if (wsManager.isConnected()) {
            wsManager.sendMessage(jsonPayload);
        } else {
            startWebSocket();

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (wsManager.isConnected()) {
                    wsManager.sendMessage(jsonPayload);
                }
            }, 2000);
        }
    }

    public void cleanup() {
        stopWebSocket();
    }

    public void startAutomationService(String jsonRules) {
        updateAutomations(jsonRules);

        Intent serviceIntent = new Intent(context, AutomationService.class);
        serviceIntent.putExtra("automation_rules", jsonRules);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    public void stopAutomationService() {
        Intent serviceIntent = new Intent(context, AutomationService.class);
        context.stopService(serviceIntent);
    }

    public void setConfig(String url, String token, String switches) {
        getPrefs().edit()
                .putString(KEY_URL, url)
                .putString(KEY_TOKEN, token)
                .putString(KEY_SWITCHES, switches)
                .apply();
    }

    public Config getConfig() {
        SharedPreferences prefs = getPrefs();
        return new Config(
                prefs.getString(KEY_URL, ""),
                prefs.getString(KEY_TOKEN, ""),
                prefs.getString(KEY_SWITCHES, "[]"));
    }

    public String getAutomations() {
        return getPrefs().getString(AUTOMATION_RULES, "[]");
    }

    public void updateAutomations(String jsonRules) {
        getPrefs().edit().putString(AUTOMATION_RULES, jsonRules).apply();
    }

    private SharedPreferences getPrefs() {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void requestBatteryOpt(Activity activity) {
        if (activity == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M)
            return;
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        String pkg = context.getPackageName();
        if (pm != null && !pm.isIgnoringBatteryOptimizations(pkg)) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + pkg));
            activity.startActivity(intent);
        }
    }

    public static class Config {
        public final String url;
        public final String token;
        public final String switches;

        public Config(String url, String token, String switches) {
            this.url = url;
            this.token = token;
            this.switches = switches;
        }
    }
}