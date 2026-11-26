plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Automatically activate Firebase Spark Always-Free services when google-services.json is added
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
    apply(plugin = "com.google.firebase.crashlytics")
}

android {
    namespace = "in.gov.krishisahayak.guide"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.gov.krishisahayak.guide"
        minSdk = 24 // Covers 99.2% of rural Android smartphones in India (Android 7.0+)
        targetSdk = 35
        versionCode = 1
        versionName = "2.0.0-b2c-free"

        // Configure Firebase Hosting / Cloud Run Always-Free PWA endpoint
        buildConfigField(
            "String",
            "PWA_HOST_URL",
            "\"https://krishi-sahayak-free.web.app/index.html\""
        )
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
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
    // 1. Google Jetpack Compose & Material 3 (Sunlight-Readable B2C UI)
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.webkit:webkit:1.12.1")

    // 2. Google Trusted Web Activity (TWA) for Seamless Chrome Custom Tabs Integration
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")

    // 3. Google ML Kit On-Device AI — 100% ALWAYS FREE, OFFLINE, ZERO CLOUD COST
    //    - On-Device Translation (hi, mr, bn, gu, kn, ta, te, ur <-> en)
    //    - On-Device Image Labeling for Leaf Quality & Plant Pre-Validation
    implementation("com.google.mlkit:translate:17.0.3")
    implementation("com.google.mlkit:image-labeling:17.0.9")

    // 4. Google Play Services Location (Hyperlocal Weather & Mandi Distance)
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // 5. Firebase Spark Plan (Always Free B2C Stack: FCM Unlimited Push, Analytics, Crashlytics, Auth, Firestore)
    val firebaseBom = platform("com.google.firebase:firebase-bom:33.6.0")
    implementation(firebaseBom)
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")
    implementation("com.google.firebase:firebase-crashlytics-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")
}
