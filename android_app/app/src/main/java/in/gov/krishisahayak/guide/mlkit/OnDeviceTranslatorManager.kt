package `in`.gov.krishisahayak.guide.mlkit

import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Google ML Kit On-Device Translation Manager
 * Runs 100% locally on the farmer's smartphone CPU/NPU — $0.00 Google Cloud cost & works offline!
 * Supports Indian languages natively: Hindi (hi), Marathi (mr), Bengali (bn), Gujarati (gu),
 * Kannada (kn), Tamil (ta), Telugu (te), Urdu (ur), and English (en).
 */
class OnDeviceTranslatorManager {

    private val translators = ConcurrentHashMap<String, Translator>()

    private val supportedMlKitMap = mapOf(
        "hi" to TranslateLanguage.HINDI,
        "en" to TranslateLanguage.ENGLISH,
        "mr" to TranslateLanguage.MARATHI,
        "bn" to TranslateLanguage.BENGALI,
        "gu" to TranslateLanguage.GUJARATI,
        "kn" to TranslateLanguage.KANNADA,
        "ta" to TranslateLanguage.TAMIL,
        "te" to TranslateLanguage.TELUGU,
        "ur" to TranslateLanguage.URDU
    )

    fun translateBlocking(text: String, sourceCode: String, targetCode: String): String {
        if (text.isBlank()) return text
        val normalizedTarget = supportedMlKitMap[targetCode.lowercase()] ?: return text
        val inferredSource = if (sourceCode == "auto") {
            // Detect Devanagari script vs Latin
            if (text.any { it in '\u0900'..'\u097F' }) TranslateLanguage.HINDI else TranslateLanguage.ENGLISH
        } else {
            supportedMlKitMap[sourceCode.lowercase()] ?: TranslateLanguage.HINDI
        }

        if (inferredSource == normalizedTarget) return text

        val key = "$inferredSource->$normalizedTarget"
        val translator = translators.getOrPut(key) {
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(inferredSource)
                .setTargetLanguage(normalizedTarget)
                .build()
            Translation.getClient(options)
        }

        return try {
            val conditions = DownloadConditions.Builder().build()
            Tasks.await(translator.downloadModelIfNeeded(conditions), 8, TimeUnit.SECONDS)
            Tasks.await(translator.translate(text), 3, TimeUnit.SECONDS)
        } catch (_: Exception) {
            text
        }
    }

    fun closeAll() {
        translators.values.forEach { it.close() }
        translators.clear()
    }
}
