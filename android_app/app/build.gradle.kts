plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Automatically activate Firebase Spark Always-Free services when google-services.json is present
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
    apply(plugin = "com.google.firebase.crashlytics")
}

android {
    namespace = "in.gov.krishisahayak.guide"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.gov.krishisahayak.guide"
        minSdk = 26 // Android 8.0+ (covers >98.5% of Indian Android devices + native Adaptive Icons)
        targetSdk = 35
        versionCode = 2
        versionName = "2.0.0-india-b2c"

        // Firebase Hosting + Cloud Run (Mumbai asia-south1) endpoint; falls back to bundled offline assets/pwa/
        buildConfigField(
            "String",
            "PWA_HOST_URL",
            "\"https://krishi-sahayak-india-free.web.app/index.html\""
        )
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("releaseConfig") {
            val ksPath = System.getenv("KRISHI_KEYSTORE_PATH")
            if (!ksPath.isNullOrBlank() && file(ksPath).exists()) {
                storeFile = file(ksPath)
                storePassword = System.getenv("KRISHI_KEYSTORE_PASSWORD") ?: "krishi2026free"
                keyAlias = System.getenv("KRISHI_KEY_ALIAS") ?: "krishi_b2c_key"
                keyPassword = System.getenv("KRISHI_KEY_PASSWORD") ?: "krishi2026free"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            val relSign = signingConfigs.findByName("releaseConfig")
            signingConfig = if (relSign?.storeFile != null) relSign else signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // 1. AndroidX Core & Jetpack Compose Material 3 (Sunlight-Readable B2C Shell)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.webkit:webkit:1.12.1")

    // 2. Google Trusted Web Activity (TWA) Hybrid Support
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")

    // 3. Google ML Kit On-Device AI — 100% ALWAYS FREE, OFFLINE, ZERO CLOUD COST
    implementation("com.google.mlkit:translate:17.0.3")
    implementation("com.google.mlkit:image-labeling:17.0.9")
    implementation("com.google.android.gms:play-services-tasks:18.2.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // 4. Firebase Spark Always-Free B2C Stack (FCM Push, Analytics, Auth, Firestore; Crashlytics when configured)
    val firebaseBom = platform("com.google.firebase:firebase-bom:33.6.0")
    implementation(firebaseBom)
    implementation("com.google.firebase:firebase-common")
    implementation("com.google.firebase:firebase-messaging")
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    if (file("google-services.json").exists()) {
        implementation("com.google.firebase:firebase-crashlytics")
    }

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
