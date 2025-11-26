package com.smart.board;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static final int REQ_CODE_POST_NOTIFICATIONS = 1001;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(com.smart.board.plugins.smartboard.SmartBoardPlugin.class);

    super.onCreate(savedInstanceState);

    try {
      WebSettings webSettings = getBridge().getWebView().getSettings();
      webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

      requestNotificationPermissionIfNeeded();
    } catch (Exception ignored) {
      Log.e("MainActivity", "Error in onCreate", ignored);
    }
  }

  private void requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(
              this,
              Manifest.permission.POST_NOTIFICATIONS
          ) != PackageManager.PERMISSION_GRANTED) {

        ActivityCompat.requestPermissions(
            this,
            new String[]{ Manifest.permission.POST_NOTIFICATIONS },
            REQ_CODE_POST_NOTIFICATIONS
        );
      }
    }
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode,
      String[] permissions,
      int[] grantResults
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }
}
