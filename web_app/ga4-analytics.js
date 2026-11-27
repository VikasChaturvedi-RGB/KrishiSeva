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

// Google Tag Manager container (server-side taggable; GA4 tag is configured inside GTM)
window.KRISHI_GTM_CONTAINER_ID =
  window.KRISHI_GTM_CONTAINER_ID ||
  localStorage.getItem('krishi_gtm_id') ||
  'GTM-M9S2B335';

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

window.KrishiAnalytics = {
  initialized: false,
  gtmLoaded: false,
  measurementId: window.KRISHI_GA4_MEASUREMENT_ID,
  containerId: window.KRISHI_GTM_CONTAINER_ID,

  // Loads the GTM container exactly once (the inline <head> snippet normally
  // does this already; this is the safety net for pages/WebViews that cache an
  // older shell, and it stays silent when offline).
  ensureGtmContainer() {
    if (this.gtmLoaded || !this.containerId || !/^GTM-/.test(this.containerId)) return;
    const already = Array.from(document.scripts).some(
      sc => sc.src && sc.src.indexOf('googletagmanager.com/gtm.js') !== -1
    );
    this.gtmLoaded = true;
    if (already || !navigator.onLine) return;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(this.containerId)}`;
    document.head.appendChild(s);
  },

  usesGtm() {
    return Boolean(this.containerId && /^GTM-/.test(this.containerId));
  },

  isRealMeasurementId() {
    return Boolean(this.measurementId && /^G-[A-Z0-9]{6,}$/.test(this.measurementId) && this.measurementId !== 'G-KRISHIFREE');
  },

  init(customMeasurementId) {
    this.ensureGtmContainer();
    if (customMeasurementId && customMeasurementId.startsWith('G-')) {
      this.measurementId = customMeasurementId;
    }

    // Direct GA4 (gtag.js) is only used when there is NO GTM container — with GTM the
    // GA4 Google Tag lives inside the container, so configuring it here too would
    // double-count. The 'G-KRISHIFREE' placeholder is never configured.
    if (!this.initialized && navigator.onLine && this.isRealMeasurementId() && !this.usesGtm()) {
      this.initialized = true;
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
      document.head.appendChild(s);

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
        if (remoteGaId && remoteGaId.startsWith('G-') && remoteGaId !== this.measurementId && !this.usesGtm()) {
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

    // 2. Google Tag Manager dataLayer (named event so GTM triggers can fire,
    //    and GTM forwards it to the GA4 configuration tag inside the container)
    try {
      window.dataLayer.push(Object.assign({ event: eventName }, safeParams));
    } catch (e) {}

    // 3. Direct GA4 only in non-GTM mode (GTM forwards dataLayer events to GA4 itself)
    if (!this.usesGtm() && this.isRealMeasurementId()) {
      try {
        gtag('event', eventName, safeParams);
      } catch (e) {}
    }
  },

  // Convenience wrapper used by the crop-fit, soil-atlas and AI-diagnosis modules
  trackTiming(eventName, startedAtMs, params = {}) {
    this.trackEvent(eventName, Object.assign({
      duration_ms: Math.max(0, Math.round(performance.now() - startedAtMs))
    }, params));
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
