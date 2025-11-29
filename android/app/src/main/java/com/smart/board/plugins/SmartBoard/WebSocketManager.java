package com.smart.board.plugins.smartboard;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class WebSocketManager {

    private static final String TAG = "WSManager";

    public interface SocketCallback {
        void onMessage(String json);
    }

    private final SocketCallback callback;
    private final OkHttpClient client;
    private final Handler uiHandler = new Handler(Looper.getMainLooper());
    private WebSocket socket;
    private boolean isConnected = false;

    private final Map<Integer, Boolean> switchStates = new ConcurrentHashMap<>();
    private final Map<Integer, String> switchLabels = new ConcurrentHashMap<>();

    public WebSocketManager(SocketCallback callback) {
        this.callback = callback;
        this.client = new OkHttpClient.Builder().build();
    }

    public void connect(String url, String token) {
        disconnect();

        if (url == null || url.isEmpty())
            return;

        Request request;
        try {
            request = new Request.Builder().url(url).build();
        } catch (IllegalArgumentException e) {
            notifyUI("{\"type\":\"error\",\"message\":\"Invalid URL\"}");
            return;
        }

        socket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                isConnected = true;
                try {
                    JSONObject auth = new JSONObject();
                    auth.put("type", "auth");
                    auth.put("token", token);
                    webSocket.send(auth.toString());
                } catch (Exception ignored) {
                }
                notifyUI("{\"type\":\"connected\"}");
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                notifyUI(text);
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                isConnected = false;
                notifyUI("{\"type\":\"closed\"}");
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                isConnected = false;
                notifyUI("{\"type\":\"error\",\"message\":\"" + t.getMessage() + "\"}");
            }
        });
    }

    public void sendMessage(String json) {
        if (socket != null && isConnected) {
            try {
                socket.send(json);
            } catch (Exception e) {
                Log.e(TAG, "Send failed", e);
            }
        }
    }

    public void disconnect() {
        isConnected = false;
        if (socket != null) {
            try {
                socket.close(1000, "Manual Close");
            } catch (Exception ignored) {
            }
            socket = null;
        }
        uiHandler.removeCallbacksAndMessages(null);
    }

    public boolean isConnected() {
        return socket != null && isConnected;
    }

    private void notifyUI(String message) {
        if (callback != null) {
            uiHandler.post(() -> callback.onMessage(message));
        }
    }
}