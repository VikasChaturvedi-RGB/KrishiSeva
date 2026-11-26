// ============================================================================
// KRISHI SAHAYAK — GOOGLE ANALYTICS 4 (GA4) & FIREBASE ANALYTICS B2C MODULE
// 100% Always Free & Unlimited Events (Google Services First)
// Privacy-First (DPDP Act 2023 Compliant):
//   - Anonymizes IP & strips all PII (never sends phone numbers or farmer names)
//   - Tracks B2C product health: 22-language adoption, voice usage, leaf scans,
//     DIY bio-remedy views, fake-input purity checks, WhatsApp shares & 👍/👎 feedback
//   - Bridges seamlessly to Native Firebase Analytics when inside the Android App!
// ============================================================================

window.KRISHI_GA4_MEASUREMENT_ID =
  window.KRISHI_GA4_MEASUREMENT_ID ||
  localStorage.getItem('krishi_ga4_id') ||
  'G-KRISHIFREE'; // Auto-overridden by /v1/google-free/status or Firebase web config when linked

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

window.KrishiAnalytics = {
  initialized: false,
  measurementId: window.KRISHI_GA4_MEASUREMENT_ID,

  init(customMeasurementId) {
    if (customMeasurementId && customMeasurementId.startsWith('G-')) {
      this.measurementId = customMeasurementId;
    }

    // Load gtag.js asynchronously when online and a real GA4 Measurement ID is configured
    if (!this.initialized && navigator.onLine && this.measurementId && this.measurementId.startsWith('G-')) {
      this.initialized = true;
      if (this.measurementId !== 'G-KRISHIFREE') {
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
        document.head.appendChild(s);
      }

      gtag('js', new Date());
      gtag('config', this.measurementId, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false, // Zero-selling / zero-ads B2C pledge!
        app_name: 'Krishi Sahayak B2C',
        app_version: '2.0.0-india-b2c',
        language: window.currentLanguage || 'hi'
      });
    }

    // Also pull Measurement ID dynamically from Cloud Run /v1/google-free/status if configured via env var
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
    fetch(`${apiBase}/google-free/status`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const remoteGaId = data?.services?.googleAnalytics?.measurementId;
        if (remoteGaId && remoteGaId.startsWith('G-') && remoteGaId !== this.measurementId) {
          localStorage.setItem('krishi_ga4_id', remoteGaId);
          this.initialized = false;
          this.init(remoteGaId);
        }
      })
      .catch(() => {});
  },

  trackEvent(eventName, params = {}) {
    // Strip any accidental PII keys before sending to Google Analytics
    const safeParams = Object.assign(
      {
        farmer_language: window.currentLanguage || 'hi',
        land_unit: window.KRISHI_LAND_UNIT || 'ACRE',
        platform_mode: window.AndroidBridge ? 'android_mlkit_hybrid' : 'pwa_web'
      },
      params
    );
    delete safeParams.phone;
    delete safeParams.mobileNumber;
    delete safeParams.name;

    // 1. Native Android Firebase Analytics Bridge (100% Always Free & Offline-Queued!)
    if (window.AndroidBridge && typeof window.AndroidBridge.logAnalyticsEvent === 'function') {
      try {
        window.AndroidBridge.logAnalyticsEvent(eventName, JSON.stringify(safeParams));
      } catch (e) {}
    }

    // 2. Web GA4 gtag
    try {
      gtag('event', eventName, safeParams);
    } catch (e) {}
  }
};

// Auto-instrument core B2C farmer journeys without Invasive Hooks
document.addEventListener('DOMContentLoaded', () => {
  window.KrishiAnalytics.init();
  window.KrishiAnalytics.trackEvent('b2c_app_open', {
    entry_hash: window.location.hash || '#home'
  });

  // Hook screen switches, language switches, voice companion & WhatsApp shares
  const origSelectLang = window.selectPhoneLanguage;
  if (typeof origSelectLang === 'function') {
    window.selectPhoneLanguage = function(langCode) {
      origSelectLang(langCode);
      window.KrishiAnalytics.trackEvent('language_selected', { selected_lang: langCode });
    };
  }

  const origSwitchView = window.switchView;
  if (typeof origSwitchView === 'function') {
    window.switchView = function(viewId, pushHistory) {
      origSwitchView(viewId, pushHistory);
      window.KrishiAnalytics.trackEvent('screen_view', { screen_name: viewId });
    };
  }

  if (window.KrishiB2C) {
    const origShare = window.KrishiB2C.shareGuidanceCard.bind(window.KrishiB2C);
    window.KrishiB2C.shareGuidanceCard = async function(contextType) {
      window.KrishiAnalytics.trackEvent('b2c_whatsapp_share', { content_type: contextType });
      return origShare(contextType);
    };

    const origFeedback = window.KrishiB2C.recordHelpfulFeedback.bind(window.KrishiB2C);
    window.KrishiB2C.recordHelpfulFeedback = function(itemType, isHelpful, btnEl) {
      window.KrishiAnalytics.trackEvent('guidance_helpfulness_vote', {
        item_type: itemType,
        helpful: isHelpful ? 'yes' : 'no'
      });
      return origFeedback(itemType, isHelpful, btnEl);
    };
  }
});
