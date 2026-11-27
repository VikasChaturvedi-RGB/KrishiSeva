package `in`.gov.krishisahayak.guide

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
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
import androidx.webkit.WebViewAssetLoader
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
     * Launches pure Chrome Trusted Web Activity (TWA) when verified via Digital Asset Links
     */
    fun launchTrustedWebActivity() {
        val launcher = TwaLauncher(this)
        launcher.launch(Uri.parse(BuildConfig.PWA_HOST_URL))
    }

    override fun onDestroy() {
        webViewRef?.destroy()
        webViewRef = null
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

    // Google Play Security Best Practice: Serve bundled offline PWA over virtual HTTPS origin
    // (https://appassets.androidplatform.net/assets/pwa/index.html) instead of file:// URLs
    val assetLoader = remember {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* Non-blocking: app works offline/text/samples even if camera or mic denied */ }

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
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                isVerticalScrollBarEnabled = true
                isHorizontalScrollBarEnabled = false
                overScrollMode = View.OVER_SCROLL_IF_CONTENT_SCROLLS

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = false
                    allowContentAccess = true
                    mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                    builtInZoomControls = true
                    displayZoomControls = false
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                }

                addJavascriptInterface(jsBridge, "AndroidBridge")

                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest
                    ): WebResourceResponse? {
                        return assetLoader.shouldInterceptRequest(request.url)
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest
                    ): Boolean {
                        val uri = request.url ?: return false
                        val scheme = uri.scheme?.lowercase() ?: ""
                        val host = uri.host?.lowercase() ?: ""

                        // 1. Toll-Free Kisan Call Centre (1800-180-1551) & PMFBY (14447) tel: links
                        if (scheme == "tel") {
                            try {
                                ctx.startActivity(
                                    Intent(Intent.ACTION_DIAL, uri).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                )
                            } catch (_: Exception) {}
                            return true
                        }

                        // 2. External WhatsApp Share / Mailto / SMS / Official Portal Links
                        if (scheme in listOf("whatsapp", "mailto", "sms", "intent") ||
                            host == "wa.me" || host == "api.whatsapp.com"
                        ) {
                            try {
                                ctx.startActivity(
                                    Intent(Intent.ACTION_VIEW, uri).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                )
                            } catch (_: Exception) {}
                            return true
                        }

                        // 3. Keep internal virtual HTTPS assets & verified PWA host inside WebView
                        if (host == "appassets.androidplatform.net" ||
                            BuildConfig.PWA_HOST_URL.contains(host)
                        ) {
                            return false
                        }

                        // 4. Open third-party external links safely in system browser
                        if (scheme == "https" || scheme == "http") {
                            try {
                                ctx.startActivity(
                                    Intent(Intent.ACTION_VIEW, uri).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                )
                            } catch (_: Exception) {}
                            return true
                        }

                        return false
                    }

                    override fun onRenderProcessGone(
                        view: WebView?,
                        detail: RenderProcessGoneDetail?
                    ): Boolean {
                        // Prevent app crash on 2GB RAM budget Android phones if OS reclaims WebView renderer
                        view?.reload()
                        return true
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest) {
                        val allowed = request.resources.filter {
                            it == PermissionRequest.RESOURCE_VIDEO_CAPTURE ||
                                it == PermissionRequest.RESOURCE_AUDIO_CAPTURE
                        }.toTypedArray()
                        if (allowed.isNotEmpty()) request.grant(allowed) else request.deny()
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

                val hasBundledOfflinePwa = try {
                    context.assets.list("pwa")?.contains("index.html") == true
                } catch (_: Exception) {
                    false
                }

                if (hasBundledOfflinePwa) {
                    loadUrl("https://appassets.androidplatform.net/assets/pwa/index.html")
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
