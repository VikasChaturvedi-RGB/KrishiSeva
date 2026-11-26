# Preserve @JavascriptInterface methods exposed to the Krishi Sahayak PWA
-keepclassmembers class in.gov.krishisahayak.guide.bridge.KrishiJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class in.gov.krishisahayak.guide.bridge.KrishiJsBridge { *; }
-keepattributes JavascriptInterface
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Google ML Kit On-Device Translation & Vision Safe Shrink Rules
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.odml.**
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn com.google.errorprone.annotations.**
