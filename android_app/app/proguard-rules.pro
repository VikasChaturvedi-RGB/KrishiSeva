# Preserve @JavascriptInterface methods exposed to the Krishi Sahayak PWA
-keepclassmembers class in.gov.krishisahayak.guide.bridge.KrishiJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
