package com.heywork.salam;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = this.bridge.getWebView();
    WebSettings settings = webView.getSettings();

    // 🔓 BYPASS MIXED CONTENT (DEV ONLY)
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  }
}
