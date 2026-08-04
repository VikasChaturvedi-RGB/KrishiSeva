import 'package:flutter/material.dart';

class SupportedLanguage {
  final String code;
  final String nameNative;
  final String nameEnglish;
  final String scriptCode;

  const SupportedLanguage({
    required this.code,
    required this.nameNative,
    required this.nameEnglish,
    required this.scriptCode,
  });
}

class AppLocalizations {
  static const List<SupportedLanguage> languages = [
    SupportedLanguage(code: 'hi', nameNative: 'हिन्दी', nameEnglish: 'Hindi', scriptCode: 'Deva'),
    SupportedLanguage(code: 'en', nameNative: 'English', nameEnglish: 'English', scriptCode: 'Latn'),
    SupportedLanguage(code: 'te', nameNative: 'తెలుగు', nameEnglish: 'Telugu', scriptCode: 'Telu'),
    SupportedLanguage(code: 'ta', nameNative: 'தமிழ்', nameEnglish: 'Tamil', scriptCode: 'Taml'),
    SupportedLanguage(code: 'kn', nameNative: 'ಕನ್ನಡ', nameEnglish: 'Kannada', scriptCode: 'Knda'),
    SupportedLanguage(code: 'mr', nameNative: 'मराठी', nameEnglish: 'Marathi', scriptCode: 'Deva'),
    SupportedLanguage(code: 'bn', nameNative: 'বাংলা', nameEnglish: 'Bengali', scriptCode: 'Beng'),
    SupportedLanguage(code: 'pa', nameNative: 'ਪੰਜਾਬੀ', nameEnglish: 'Punjabi', scriptCode: 'Guru'),
    SupportedLanguage(code: 'gu', nameNative: 'ગુજરાતી', nameEnglish: 'Gujarati', scriptCode: 'Gujr'),
    SupportedLanguage(code: 'or', nameNative: 'ଓଡ଼ିଆ', nameEnglish: 'Odia', scriptCode: 'Orya'),
    SupportedLanguage(code: 'ml', nameNative: 'മലയാളം', nameEnglish: 'Malayalam', scriptCode: 'Mlym'),
    SupportedLanguage(code: 'as', nameNative: 'অসমীয়া', nameEnglish: 'Assamese', scriptCode: 'Beng'),
    SupportedLanguage(code: 'mai', nameNative: 'मैथिली', nameEnglish: 'Maithili', scriptCode: 'Deva'),
    SupportedLanguage(code: 'sat', nameNative: 'ᱥᱟᱱᱛᱟᱲᱤ', nameEnglish: 'Santali', scriptCode: 'Olck'),
    SupportedLanguage(code: 'ks', nameNative: 'کٲشُر', nameEnglish: 'Kashmiri', scriptCode: 'Arab'),
    SupportedLanguage(code: 'ne', nameNative: 'नेपाली', nameEnglish: 'Nepali', scriptCode: 'Deva'),
    SupportedLanguage(code: 'sd', nameNative: 'سنڌي', nameEnglish: 'Sindhi', scriptCode: 'Arab'),
    SupportedLanguage(code: 'kok', nameNative: 'कोंकणी', nameEnglish: 'Konkani', scriptCode: 'Deva'),
    SupportedLanguage(code: 'dog', nameNative: 'डोगरी', nameEnglish: 'Dogri', scriptCode: 'Deva'),
    SupportedLanguage(code: 'mni', nameNative: 'মৈতৈলোন্', nameEnglish: 'Manipuri', scriptCode: 'Mtei'),
  ];

  static final Map<String, Map<String, String>> _localizedValues = {
    'hi': {
      'appName': 'कृषि स्वास्थ्य सहायक',
      'appSubtitle': 'AI फसल डॉक्टर एवं पोषण-प्रथम कृषि परामर्श',
      'loginTitle': 'किसान मोबाइल लॉगिन',
      'loginSubtitle': 'बिना पासवर्ड केवल 10 अंकों का मोबाइल नंबर डालें',
      'sendOtp': 'OTP भेजें',
      'verifyOtp': 'सत्यापित करें एवं आगे बढ़ें',
      'dpdpConsent': 'DPDP 2023 स्पष्ट सहमति',
      'dpdpConsentDesc': 'फसल की बीमारी का सटीक निदान करने के लिए मौसम, स्थान और मृदा डेटा के उपयोग की सहमति दें।',
      'captureLeaf': 'फसल की पत्ती का फोटो लें',
      'blurWarning': 'चित्र बहुत धुंधला है! कृपया फोन स्थिर रखें।',
      'lightWarning': 'रोशनी कम है! कृपया छाया से हटकर प्रकाश में फोटो लें।',
      'provisionalResult': 'तात्कालिक ऑन-डिवाइस निदान (ऑफ़लाइन उपलब्ध)',
      'step1Nutrient': 'चरण 1: पोषक तत्व एवं पर्णीय सुधार (सर्वप्रथम)',
      'step2Biological': 'चरण 2: जैविक एवं मृदा उपचार',
      'step3Chemical': 'चरण 3: रासायनिक उपचार (CIB&RC पंजीकृत)',
      'dilutionRate': 'प्रति लीटर पानी में घोल दर',
      'perAcreVolume': 'प्रति एकड़ मात्रा',
      'slaCountdown': 'कृषि वैज्ञानिक परामर्श SLA समय शेष',
      'clinicMode': 'कृषि-क्लिनिक प्रो मोड',
      'generatePdfSlip': 'पर्चा (PDF) डाउनलोड / प्रिंट करें',
      'listenAudio': 'सलाह सुनें (आवाज़)',
    },
    'en': {
      'appName': 'AgriScan AI (Krishi Sahayak)',
      'appSubtitle': 'AI Crop Doctor & Nutrition-First Agronomic Advisory',
      'loginTitle': 'Farmer Mobile Login',
      'loginSubtitle': 'Passwordless login via 10-digit mobile number',
      'sendOtp': 'Send OTP',
      'verifyOtp': 'Verify & Proceed',
      'dpdpConsent': 'DPDP Act 2023 Explicit Consent',
      'dpdpConsentDesc': 'Consent to use hyperlocal weather, location & soil data for precise plant pathology.',
      'captureLeaf': 'Capture Crop Leaf Image',
      'blurWarning': 'Image is blurry! Please hold phone steady.',
      'lightWarning': 'Low ambient light! Move into better illumination.',
      'provisionalResult': 'Provisional On-Device Diagnosis (Offline)',
      'step1Nutrient': 'Step 1: Mineral & Foliar Correction (Top Priority)',
      'step2Biological': 'Step 2: Biological & Soil Bio-control',
      'step3Chemical': 'Step 3: CIB&RC Registered Chemical (If Required)',
      'dilutionRate': 'Per Litre Water Dilution Rate',
      'perAcreVolume': 'Per Acre Dosage',
      'slaCountdown': 'Agronomist Specialist SLA Time Remaining',
      'clinicMode': 'Agri-Clinic Professional Mode',
      'generatePdfSlip': 'Download / Print Prescription PDF',
      'listenAudio': 'Listen Audio Advisory',
    },
    'te': {
      'appName': 'కృషి స్వాస్థ్య సహాయక్',
      'appSubtitle': 'AI పంట డాక్టర్ మరియు పోషకాహార ప్రథమ సలహాదారు',
      'loginTitle': 'రైతు మొబైల్ లాగిన్',
      'sendOtp': 'OTP పంపండి',
      'verifyOtp': 'ధృవీకరించండి',
      'captureLeaf': 'పంట ఆకు ఫోటో తీయండి',
      'step1Nutrient': 'దశ 1: పోషకాలు మరియు పిచికారీ చికిత్స (మొదటి ప్రాధాన్యత)',
      'step2Biological': 'దశ 2: సేంద్రీయ మరియు జీవ నియంత్రణ',
      'step3Chemical': 'దశ 3: రసాయన నివారణ (CIB&RC రిజిస్టర్డ్)',
    },
    'ta': {
      'appName': 'வேளாண் சுகாதார உதவியாளர்',
      'appSubtitle': 'AI பயிர் மருத்துவர் மற்றும் ஊட்டச்சத்து-முதல் ஆலோசனை',
      'loginTitle': 'விவசாயி மொபைல் உள்நுழைவு',
      'sendOtp': 'OTP அனுப்புக',
      'verifyOtp': 'சரிபார்த்து தொடரவும்',
      'captureLeaf': 'பயிர் இலையை புகைப்படம் எடுக்கவும்',
      'step1Nutrient': 'படி 1: கனிம மற்றும் இலை ஊட்டச்சத்து சிகிச்சை (முதன்மை)',
      'step2Biological': 'படி 2: இயற்கை மற்றும் உயிரியல் கட்டுப்பாடு',
      'step3Chemical': 'படி 3: இரசாயன சிகிச்சை (CIB&RC பதிவு செய்யப்பட்டது)',
    },
    'mr': {
      'appName': 'कृषी स्वास्थ्य सहाय्यक',
      'appSubtitle': 'AI पीक डॉक्टर आणि पोषण-प्रथम कृषी सल्ला',
      'loginTitle': 'शेतकरी मोबाईल लॉगिन',
      'sendOtp': 'OTP पाठवा',
      'verifyOtp': 'सत्यापित करा आणि पुढे जा',
      'captureLeaf': 'पिकाच्या पानाचा फोटो घ्या',
      'step1Nutrient': 'टप्पा १: सूक्ष्म अन्नद्रव्ये आणि फवारणी उपचार (प्राधान्य)',
      'step2Biological': 'टप्पा २: जैविक व सेंद्रिय कीड नियंत्रण',
      'step3Chemical': 'टप्पा ३: रासायनिक उपचार (CIB&RC नोंदणीकृत)',
    },
    'pa': {
      'appName': 'ਕ੍ਰਿਸ਼ੀ ਸਵਾਸਥ ਸਹਾਇਕ',
      'appSubtitle': 'AI ਫ਼ਸਲ ਡਾਕਟਰ ਅਤੇ ਪੋਸ਼ਣ-ਪਹਿਲ ਖੇਤੀਬਾੜੀ ਸਲਾਹ',
      'loginTitle': 'ਕਿਸਾਨ ਮੋਬਾਈਲ ਲੌਗਇਨ',
      'sendOtp': 'OTP ਭੇਜੋ',
      'verifyOtp': 'ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਅੱਗੇ ਵਧੋ',
      'captureLeaf': 'ਫ਼ਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਲਵੋ',
      'step1Nutrient': 'ਕਦਮ 1: ਖੁਰਾਕੀ ਤੱਤ ਅਤੇ ਪੱਤਿਆਂ ਤੇ ਛਿੜਕਾਅ (ਪਹਿਲ)',
      'step2Biological': 'ਕਦਮ 2: ਜੈਵਿਕ ਅਤੇ ਜ਼ਮੀਨੀ ਸੁਧਾਰ',
      'step3Chemical': 'ਕਦਮ 3: ਰਸਾਇਣਕ ਇਲਾਜ (CIB&RC ਰਜਿਸਟਰਡ)',
    }
  };

  static String get(String key, String langCode) {
    if (_localizedValues.containsKey(langCode) && _localizedValues[langCode]!.containsKey(key)) {
      return _localizedValues[langCode]![key]!;
    }
    // Fallback to Hindi, then English
    return _localizedValues['hi']?[key] ?? _localizedValues['en']?[key] ?? key;
  }
}
