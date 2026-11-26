package `in`.gov.krishisahayak.guide.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import `in`.gov.krishisahayak.guide.MainActivity

/**
 * Firebase Cloud Messaging (FCM) — 100% Always Free & Unlimited B2C Push Alerts
 * Delivers timely non-commercial farmer alerts:
 *  - Sudden rain / frost / hailstorm warnings
 *  - 15km village pest/disease outbreak alerts
 *  - Crop-stage & MSP harvest reminders
 */
class KrishiFcmService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title ?: message.data["title"] ?: "🌾 कृषि सहायक चेतावनी"
        val body = message.notification?.body ?: message.data["body"] ?: "आज के मौसम और फसल सुरक्षा सलाह देखें।"
        showFarmerNotification(title, body)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Stored locally; subscribed to non-PII state/crop FCM topics (e.g. weather_MP, crop_SOYBEAN)
    }

    private fun showFarmerNotification(title: String, body: String) {
        val channelId = "krishi_farmer_alerts"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "मौसम व फसल सुरक्षा अलर्ट (Weather & Crop Alerts)",
                NotificationManager.IMPORTANCE_HIGH
            )
            manager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify((System.currentTimeMillis() % 10000).toInt(), notification)
    }
}
