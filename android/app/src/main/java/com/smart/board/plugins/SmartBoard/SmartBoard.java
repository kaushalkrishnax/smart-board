package com.smart.board.plugins.smartboard;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.os.Handler;
import android.os.Looper;

import com.smart.board.services.AutomationService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class SmartBoard {

    private static final String PREF_NAME = "SmartBoardPrefs";

    private static final String KEY_URL = "ws_url";
    private static final String KEY_TOKEN = "ws_token";
    private static final String KEY_SWITCHES = "switches";
    private static final String AUTOMATION_RULES = "automation_rules";
    private static final String KEY_PICOVOICE_ACCESS_KEY = "picovoice_access_key";
    private static final String KEY_PICOVOICE_MODEL = "picovoice_model";

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
        if (!config.url.isEmpty() && !wsManager.isConnected())
            wsManager.connect(config.url, config.token);
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
                if (wsManager.isConnected())
                    wsManager.sendMessage(jsonPayload);
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

    public void setConfig(String url, String token, String switches, String accessKey, String model ) {
        SharedPreferences.Editor editor = getPrefs().edit();

        if (url != null)
            editor.putString(KEY_URL, url);
        if (token != null)
            editor.putString(KEY_TOKEN, token);
        if (switches != null)
            editor.putString(KEY_SWITCHES, switches);

        if (accessKey != null)
            editor.putString(KEY_PICOVOICE_ACCESS_KEY, accessKey);
        if (model != null)
            editor.putString(KEY_PICOVOICE_MODEL, model);

        editor.apply();

        Intent intent = new Intent(context, AutomationService.class);
        intent.setAction("ACTION_RELOAD_VOICE");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public Config getConfig() {
        SharedPreferences prefs = getPrefs();
        return new Config(
                prefs.getString(KEY_URL, ""),
                prefs.getString(KEY_TOKEN, ""),
                prefs.getString(KEY_SWITCHES, "[]"),
                prefs.getString(KEY_PICOVOICE_ACCESS_KEY, ""),
                prefs.getString(KEY_PICOVOICE_MODEL, "Jarvis"));
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

    public List<String> getPicovoiceModels() {
        List<String> models = new ArrayList<>();
        AssetManager assets = context.getAssets();
        try {
            String[] files = assets.list("picovoice_models");
            if (files != null) {
                for (String file : files) {
                    if (file.endsWith(".ppn")) {
                        String model = file.replace("_android.ppn", "").replace("_", " ");
                        if (model.length() > 0)
                            model = model.substring(0, 1).toUpperCase(Locale.ROOT) + model.substring(1);
                        models.add(model);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return models;
    }

    public static class Config {
        public final String url;
        public final String token;
        public final String switches;
        public final String picovoiceAccessKey;
        public final String picovoiceModel;

        public Config(String url, String token, String switches, String picovoiceAccessKey, String picovoiceModel) {
            this.url = url;
            this.token = token;
            this.switches = switches;
            this.picovoiceAccessKey = picovoiceAccessKey;
            this.picovoiceModel = picovoiceModel;
        }
    }
}