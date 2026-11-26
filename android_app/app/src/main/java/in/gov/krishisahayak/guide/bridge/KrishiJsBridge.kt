package `in`.gov.krishisahayak.guide.bridge

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import com.google.firebase.FirebaseApp
import com.google.firebase.analytics.FirebaseAnalytics
import `in`.gov.krishisahayak.guide.mlkit.OnDeviceTranslatorManager
import org.json.JSONObject
import java.util.Locale

/**
 * Native Android <-> PWA Bridge (`window.AndroidBridge`)
 * Upgrades the B2C web layer with zero-cost hardware capabilities:
 *  - Google ML Kit On-Device Offline Translation
 *  - Android Native Offline Indian Regional Text-to-Speech
 *  - WhatsApp / System Share Sheet for farmer-to-farmer viral sharing
 *  - Direct Toll-Free Kisan Call Centre (1800-180-1551) dialer
 */
class KrishiJsBridge(
    private val context: Context,
    private val translatorManager: OnDeviceTranslatorManager
) {
    private var tts: TextToSpeech? = null
    private var ttsReady = false

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            ttsReady = (status == TextToSpeech.SUCCESS)
        }
    }

    @JavascriptInterface
    fun translateOnDevice(text: String, sourceIso: String, targetIso: String): String {
        return translatorManager.translateBlocking(text, sourceIso, targetIso)
    }

    @JavascriptInterface
    fun speak(text: String, bcp47Tag: String) {
        if (!ttsReady || text.isBlank()) return
        val locale = Locale.forLanguageTag(bcp47Tag.ifBlank { "hi-IN" })
        tts?.language = locale
        tts?.setSpeechRate(0.92f)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "krishi-utterance")
    }

    @JavascriptInterface
    fun stopSpeaking() {
        tts?.stop()
    }

    @JavascriptInterface
    fun shareText(message: String) {
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, message)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val chooser = Intent.createChooser(sendIntent, "किसान मित्र को साझा करें / Share").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    }

    @JavascriptInterface
    fun dialFreeHelpline(phoneNumber: String) {
        val clean = phoneNumber.replace(Regex("[^0-9+]"), "")
        val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$clean")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(dialIntent)
    }

    @JavascriptInterface
    fun logAnalyticsEvent(eventName: String, paramsJson: String) {
        try {
            if (FirebaseApp.getApps(context).isEmpty()) return
            val bundle = Bundle()
            val obj = JSONObject(paramsJson)
            val keys = obj.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                bundle.putString(k, obj.optString(k, ""))
            }
            FirebaseAnalytics.getInstance(context.applicationContext)
                .logEvent(eventName.take(40), bundle)
        } catch (_: Exception) {
            // Safe no-op offline or before google-services.json is attached
        }
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        translatorManager.closeAll()
    }
}
