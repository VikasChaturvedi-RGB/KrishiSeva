const I18N = (() => {
  let dict = {};
  let currentLang = "hi";
  const cache = {};

  const fallbackDicts = {
    hi: {
      app_name: "कृषि स्वास्थ्य सहायक",
      app_tagline: "किसानों के लिए पौध स्वास्थ्य मार्गदर्शन",
      select_language: "अपनी भाषा चुनें",
      continue: "आगे बढ़ें",
      mobile_number_label: "मोबाइल नंबर",
      mobile_number_placeholder: "10 अंकों का मोबाइल नंबर",
      send_otp: "OTP भेजें",
      otp_sent_to: "OTP भेजा गया",
      enter_otp: "6 अंकों का कोड डालें",
      verify: "सत्यापित करें",
      resend_otp: "OTP दोबारा भेजें",
      change_number: "नंबर बदलें",
      select_state: "अपना राज्य चुनें",
      consent_text: "मैं डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार निदान और सलाह के लिए अपना मोबाइल नंबर और खेत की जानकारी साझा करने के लिए सहमत हूं।",
      agree_continue: "सहमत हूं, आगे बढ़ें",
      home_greeting: "स्वागत है",
      new_diagnosis: "नया निदान",
      recent_diagnoses: "हाल के निदान",
      no_diagnoses_yet: "अभी तक कोई निदान नहीं। ऊपर से शुरू करें।",
      select_crop: "अपनी फसल चुनें",
      select_organ: "कौन सा हिस्सा प्रभावित है?",
      organ_leaf: "पत्ती",
      organ_stem: "तना",
      organ_fruit: "फल",
      organ_root: "जड़",
      organ_flower: "फूल",
      input_mode_prompt: "समस्या कैसे बताना चाहेंगे?",
      use_photo: "फोटो लें या अपलोड करें",
      use_checklist: "जो दिख रहा है वह चुनें",
      select_signs: "जो भी लक्षण दिखें, चुनें",
      field_size_acres: "खेत का आकार, एकड़ में (वैकल्पिक)",
      get_diagnosis: "निदान प्राप्त करें",
      plant_health_index: "पौध स्वास्थ्य सूचकांक",
      possible_issues: "संभावित समस्याएं",
      confidence_label: "मेल",
      nutrition_first_hierarchy: "सुझाया गया क्रम",
      tier1_label: "1. खनिज / पर्णीय सुधार",
      tier2_label: "2. जैविक उपचार",
      tier3_label: "3. रासायनिक उपचार (अंतिम विकल्प)",
      chemical_caution: "यहां रसायन के नाम और मात्रा नहीं दिखाई गई है। खरीदने या उपयोग करने से पहले अपने राज्य कृषि विभाग या KVK से वर्तमान CIB&RC-पंजीकृत उत्पाद और मात्रा की पुष्टि करें।",
      saved_to_history: "आपके इतिहास में सहेजा गया",
      back: "वापस",
      history_title: "निदान इतिहास",
      profile_title: "प्रोफ़ाइल",
      profile_language: "भाषा",
      profile_location: "स्थान",
      change_language: "भाषा बदलें",
      log_out: "लॉग आउट",
      nav_home: "होम",
      nav_history: "इतिहास",
      nav_profile: "प्रोफ़ाइल",
      offline_notice: "आप ऑफ़लाइन हैं। आपका पिछला सहेजा डेटा दिखाया जा रहा है।",
      required_field: "यह फ़ील्ड आवश्यक है",
      invalid_mobile: "मान्य 10 अंकों का मोबाइल नंबर डालें",
      invalid_otp: "6 अंकों का कोड डालें",
      no_signs_selected: "कम से कम एक लक्षण चुनें, या फोटो जोड़ें",
      kvk_helpline: "किसान कॉल सेंटर: 1800-180-1551",
      disclaimer_short: "केवल संदर्भ मार्गदर्शन — अपने स्थानीय कृषि विशेषज्ञ का विकल्प नहीं।",
      acreage_scaling_prefix: "आपके खेत के आकार के अनुसार:",
      ai_analysing_title: "AI फोटो का विश्लेषण कर रहा है...",
      ai_analysing_desc: "कीट, रोग और पोषक तत्वों की कमी की पहचान की जा रही है",
      ai_vision_diagnosis: "AI दृश्य निदान",
      ai_findings_label: "दृश्य निष्कर्ष:"
    },
    en: {
      app_name: "Krishi Swasthya Sahayak",
      app_tagline: "Plant health advisory for Indian farmers",
      select_language: "Select Your Language",
      continue: "Continue",
      mobile_number_label: "Mobile Number",
      mobile_number_placeholder: "10-digit mobile number",
      send_otp: "Send OTP",
      otp_sent_to: "OTP sent to",
      enter_otp: "Enter 6-Digit Code",
      verify: "Verify & Enter",
      resend_otp: "Resend OTP",
      change_number: "Change number",
      select_state: "Select Your State",
      consent_text: "I consent to sharing my mobile number and farm location for diagnosis and advisory purposes, under the Digital Personal Data Protection Act, 2023.",
      agree_continue: "Agree & Continue",
      home_greeting: "Welcome",
      new_diagnosis: "New Diagnosis",
      recent_diagnoses: "Recent Diagnoses",
      no_diagnoses_yet: "No diagnoses yet. Start a new one above.",
      select_crop: "Select Crop",
      select_organ: "Which plant part is affected?",
      organ_leaf: "Leaf",
      organ_stem: "Stem / Shoot",
      organ_fruit: "Fruit / Pod",
      organ_root: "Root / Collar",
      organ_flower: "Flower / Inflorescence",
      input_mode_prompt: "How would you like to describe the issue?",
      use_photo: "Take / Upload Photo",
      use_checklist: "Pick Observable Signs",
      select_signs: "Select all signs you observe",
      field_size_acres: "Field size in acres (optional, for dosage scaling)",
      get_diagnosis: "Get Diagnosis",
      plant_health_index: "Plant Health Index",
      possible_issues: "Possible Issues",
      confidence_label: "match",
      nutrition_first_hierarchy: "Nutrition-First Hierarchy",
      tier1_label: "1. Mineral / Foliar Correction",
      tier2_label: "2. Biological / Biocontrol",
      tier3_label: "3. Chemical Intervention (last resort)",
      chemical_caution: "Chemical names and dosages are not shown here. Consult your State Agriculture Department or local KVK for registered active ingredients and approved doses before purchase.",
      saved_to_history: "Saved to your local history",
      back: "Back",
      history_title: "Diagnosis History",
      profile_title: "Farmer Profile",
      profile_language: "Interface Language",
      profile_location: "Location",
      change_language: "Change Language",
      log_out: "Log Out",
      nav_home: "Home",
      nav_history: "History",
      nav_profile: "Profile",
      offline_notice: "You are offline. Showing cached records.",
      required_field: "This field is required",
      invalid_mobile: "Please enter a valid 10-digit mobile number",
      invalid_otp: "Please enter a 6-digit OTP",
      no_signs_selected: "Please select at least one sign, or provide a photo",
      kvk_helpline: "Kisan Call Centre: 1800-180-1551 (toll-free)",
      disclaimer_short: "Reference guidance only — not a substitute for your local agronomist.",
      acreage_scaling_prefix: "Scaled for your field size:",
      ai_analysing_title: "AI is analysing crop photo...",
      ai_analysing_desc: "Identifying pests, diseases, and nutrient stress...",
      ai_vision_diagnosis: "AI Vision Assessment",
      ai_findings_label: "Visual Findings:"
    }
  };

  async function load(langCode) {
    if (cache[langCode]) {
      dict = cache[langCode];
    } else {
      try {
        const res = await fetch(`locales/${langCode}.json`);
        dict = await res.json();
        cache[langCode] = dict;
      } catch {
        dict = fallbackDicts[langCode] || fallbackDicts.hi || {};
        cache[langCode] = dict;
      }
    }
    currentLang = langCode;
    applyToDom();
    document.documentElement.setAttribute("data-lang", langCode);
    document.documentElement.setAttribute("lang", langCode);
    document.documentElement.setAttribute(
      "dir",
      langCode === "ur" ? "rtl" : "ltr"
    );
    try {
      localStorage.setItem("ksh_lang", langCode);
    } catch {}
  }

  function t(key) {
    return dict[key] || key;
  }

  function applyToDom() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(key));
    });
  }

  function getCurrentLang() {
    return currentLang;
  }

  return { load, t, applyToDom, getCurrentLang };
})();

if (typeof window !== "undefined") {
  window.I18N = I18N;
}
if (typeof module !== "undefined") {
  module.exports = I18N;
}
