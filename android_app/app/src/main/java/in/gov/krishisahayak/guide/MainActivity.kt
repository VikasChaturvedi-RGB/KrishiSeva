package `in`.gov.krishisahayak.guide

import android.Manifest
import android.annotation.SuppressLint
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.google.androidbrowserhelper.trusted.TwaLauncher
import `in`.gov.krishisahayak.guide.bridge.KrishiJsBridge
import `in`.gov.krishisahayak.guide.mlkit.OnDeviceTranslatorManager

private val KrishiColorScheme = lightColorScheme(
    primary = Color(0xFF14532D),
    onPrimary = Color.White,
    secondary = Color(0xFF15803D),
    background = Color(0xFFF0FDF4),
    surface = Color(0xFFF8FAFC)
)

class MainActivity : ComponentActivity() {

    private lateinit var translatorManager: OnDeviceTranslatorManager
    private lateinit var jsBridge: KrishiJsBridge
    private var webViewRef: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        translatorManager = OnDeviceTranslatorManager()
        jsBridge = KrishiJsBridge(this, translatorManager)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val wv = webViewRef
                if (wv != null && wv.canGoBack()) {
                    wv.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        setContent {
            MaterialTheme(colorScheme = KrishiColorScheme) {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    KrishiFarmerB2CScreen(
                        jsBridge = jsBridge,
                        onWebViewCreated = { webViewRef = it }
                    )
                }
            }
        }
    }

    /**
     * Optional helper to launch pure Chrome Trusted Web Activity (TWA) when verified via Digital Asset Links
     */
    fun launchTrustedWebActivity() {
        val launcher = TwaLauncher(this)
        launcher.launch(Uri.parse(BuildConfig.PWA_HOST_URL))
    }

    override fun onDestroy() {
        jsBridge.shutdown()
        super.onDestroy()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun KrishiFarmerB2CScreen(
    jsBridge: KrishiJsBridge,
    onWebViewCreated: (WebView) -> Unit
) {
    val context = LocalContext.current
    val pendingFileCallback = remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* Non-blocking: app still works via gallery/text/offline even if camera or mic denied */ }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        val cb = pendingFileCallback.value
        if (uri != null) cb?.onReceiveValue(arrayOf(uri)) else cb?.onReceiveValue(null)
        pendingFileCallback.value = null
    }

    LaunchedEffect(Unit) {
        val perms = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(perms.toTypedArray())
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            WebView(ctx).apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                }

                addJavascriptInterface(jsBridge, "AndroidBridge")
                webViewClient = WebViewClient()

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest) {
                        request.grant(request.resources)
                    }

                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        pendingFileCallback.value?.onReceiveValue(null)
                        pendingFileCallback.value = filePathCallback
                        photoPickerLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo)
                        )
                        return true
                    }
                }

                // Offline-First Loading: Prefer bundled local assets in assets/pwa/index.html if packaged,
                // otherwise load Firebase Hosting URL with WebView offline cache
                val hasBundledOfflinePwa = try {
                    context.assets.list("pwa")?.contains("index.html") == true
                } catch (_: Exception) {
                    false
                }

                if (hasBundledOfflinePwa) {
                    loadUrl("file:///android_asset/pwa/index.html")
                } else {
                    loadUrl(BuildConfig.PWA_HOST_URL)
                }

                onWebViewCreated(this)
            }
        }
    )

    DisposableEffect(Unit) {
        onDispose { }
    }
}
