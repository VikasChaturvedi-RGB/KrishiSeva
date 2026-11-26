// ============================================================================
// KRISHI SAHAYAK — 22 INDIAN LANGUAGES & DIALECTS BARRIER-FREE ENGINE
// Google-First Architecture:
//   Tier 1: Curated 22-Language Native UI + Agronomic Terminology Pack (Offline)
//   Tier 2: Google ML Kit On-Device Translation (Android Bridge) & Chrome W3C Translator API ($0)
//   Tier 3: Cloud Run / Gemini Flash Free-Tier Multilingual Proxy + Persistent Local Cache
//   Tier 4: "Bolo aur Suno" Universal Voice Companion, Per-Card TTS, RTL & Font/Land-Unit Scaling
// ============================================================================

window.KRISHI_SUPPORTED_LANGUAGES = [
  {
    "code": "hi",
    "native": "हिन्दी",
    "english": "Hindi",
    "region": "उत्तर व मध्य भारत",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "नमस्ते किसान मित्र! कृषि सहायक पूर्णतः निःशुल्क मार्गदर्शक है।"
  },
  {
    "code": "en",
    "native": "English",
    "english": "English (India)",
    "region": "All India",
    "voice": "en-IN",
    "rtl": false,
    "mlkit": "en",
    "welcome": "Welcome farmer friend! Krishi Sahayak is a 100% free, unbiased farming guide."
  },
  {
    "code": "mr",
    "native": "मराठी",
    "english": "Marathi",
    "region": "महाराष्ट्र",
    "voice": "mr-IN",
    "rtl": false,
    "mlkit": "mr",
    "welcome": "नमस्कार शेतकरी मित्रांनो! कृषी सहाय्यक हे १००% मोफत मार्गदर्शन अॅप आहे."
  },
  {
    "code": "pa",
    "native": "ਪੰਜਾਬੀ",
    "english": "Punjabi",
    "region": "ਪੰਜਾਬ",
    "voice": "pa-IN",
    "rtl": false,
    "mlkit": "pa",
    "welcome": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਕ੍ਰਿਸ਼ੀ ਸਹਾਇਕ 100% ਮੁਫ਼ਤ ਖੇਤੀ ਮਾਰਗਦਰਸ਼ਕ ਹੈ।"
  },
  {
    "code": "gu",
    "native": "ગુજરાતી",
    "english": "Gujarati",
    "region": "ગુજરાત",
    "voice": "gu-IN",
    "rtl": false,
    "mlkit": "gu",
    "welcome": "નમસ્તે ખેડૂત મિત્રો! કૃષિ સહાયક ૧૦૦% નિઃશુલ્ક માર્ગદર્શક છે."
  },
  {
    "code": "bn",
    "native": "বাংলা",
    "english": "Bengali",
    "region": "পশ্চিমবঙ্গ ও ত্রিপুরা",
    "voice": "bn-IN",
    "rtl": false,
    "mlkit": "bn",
    "welcome": "নমস্কার কৃষক বন্ধু! কৃষি সহায়ক সম্পূর্ণ বিনামূল্যে কৃষি নির্দেশিকা।"
  },
  {
    "code": "te",
    "native": "తెలుగు",
    "english": "Telugu",
    "region": "ఆంధ్రప్రదేశ్ & తెలంగాణ",
    "voice": "te-IN",
    "rtl": false,
    "mlkit": "te",
    "welcome": "నమస్కారం రైతు మిత్రులారా! కృషి సహాయక్ పూర్తిగా ఉచిత వ్యవసాయ మార్గదర్శి."
  },
  {
    "code": "ta",
    "native": "தமிழ்",
    "english": "Tamil",
    "region": "தமிழ்நாடு",
    "voice": "ta-IN",
    "rtl": false,
    "mlkit": "ta",
    "welcome": "வணக்கம் விவசாய நண்பர்களே! கிருஷி சஹாயக் முற்றிலும் இலவச வழிகாட்டி."
  },
  {
    "code": "kn",
    "native": "ಕನ್ನಡ",
    "english": "Kannada",
    "region": "ಕರ್ನಾಟಕ",
    "voice": "kn-IN",
    "rtl": false,
    "mlkit": "kn",
    "welcome": "ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ! ಕೃಷಿ ಸಹಾಯಕ್ ಸಂಪೂರ್ಣ ಉಚಿತ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ."
  },
  {
    "code": "ml",
    "native": "മലയാളം",
    "english": "Malayalam",
    "region": "കേരളം",
    "voice": "ml-IN",
    "rtl": false,
    "mlkit": "ml",
    "welcome": "നമസ്കാരം കർഷക സുഹൃത്തുക്കളെ! കൃഷി സഹായക് പൂർണ്ണമായും സൗജന്യ മാർഗ്ഗനിർദ്ദേശമാണ്."
  },
  {
    "code": "or",
    "native": "ଓଡ଼ିଆ",
    "english": "Odia",
    "region": "ଓଡ଼ିଶା",
    "voice": "or-IN",
    "rtl": false,
    "mlkit": "or",
    "welcome": "ନମସ୍କାର ଚାଷୀ ଭାଇ ଓ ଭଉଣୀମାନେ! କୃଷି ସହାୟକ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା କୃଷି ମାର୍ଗଦର୍ଶକ।"
  },
  {
    "code": "as",
    "native": "অসমীয়া",
    "english": "Assamese",
    "region": "অসম",
    "voice": "as-IN",
    "rtl": false,
    "mlkit": "as",
    "welcome": "নমস্কাৰ কৃষক বন্ধু! কৃষি সহায়ক সম্পূৰ্ণ বিনামূলীয়া কৃষি নিৰ্দেশিকা।"
  },
  {
    "code": "ur",
    "native": "اردو",
    "english": "Urdu",
    "region": "جموں و کشمیر / شمالی ہند",
    "voice": "ur-IN",
    "rtl": true,
    "mlkit": "ur",
    "welcome": "آداب کسان بھائیو! کرشی سہایک سو فیصد مفت زرعی رہنمائی ایپ ہے۔"
  },
  {
    "code": "bho",
    "native": "भोजपुरी",
    "english": "Bhojpuri",
    "region": "पूर्वी उ.प्र. व बिहार",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "रउआ सब किसान भाई के प्रणाम! कृषि सहायक एकदम मुफ्त खेती सलाहकार बा।"
  },
  {
    "code": "mai",
    "native": "मैथिली",
    "english": "Maithili",
    "region": "मिथिला / बिहार",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "प्रणाम किसान भाई लोकनि! कृषि सहायक पूर्णतः निःशुल्क खेती मार्गदर्शक अछि।"
  },
  {
    "code": "hne",
    "native": "छत्तीसगढ़ी",
    "english": "Chhattisgarhi",
    "region": "छत्तीसगढ़",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "जय जोहार किसान संगी हो! कृषि सहायक पूरा मुफ़्त खेती सलाह संगवारी आय।"
  },
  {
    "code": "raj",
    "native": "राजस्थानी",
    "english": "Rajasthani / Marwari",
    "region": "राजस्थान",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "खम्मा घणी किसान भायां! कृषि सहायक एकदम मुफ़्त खेती रो साचो साथी है।"
  },
  {
    "code": "bgc",
    "native": "हरियाणवी",
    "english": "Haryanvi",
    "region": "हरियाणा",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "राम-राम किसान भाइयो! कृषि सहायक सौ फीसदी मुफ़्त खेती का सच्चा सलाहकार सै।"
  },
  {
    "code": "kok",
    "native": "कोंकणी",
    "english": "Konkani",
    "region": "गोवा व कोंकण",
    "voice": "mr-IN",
    "rtl": false,
    "mlkit": "mr",
    "welcome": "देव बरे करूं शेतकार भाव! कृषी सहाय्यक पूर्णपणान फुकट शेतकी मार्गदर्शक आसा."
  },
  {
    "code": "ne",
    "native": "नेपाली",
    "english": "Nepali",
    "region": "सिक्किम व दार्जिलिङ",
    "voice": "ne-NP",
    "rtl": false,
    "mlkit": "ne",
    "welcome": "नमस्कार किसान मित्रहरू! कृषि सहायक पूर्ण रूपमा निःशुल्क कृषि मार्गदर्शक हो।"
  },
  {
    "code": "doi",
    "native": "डोगरी",
    "english": "Dogri",
    "region": "जम्मू क्षेत्र",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "जय देव किसान भाइयो! कृषि सहायक बिल्कुल मुफ़्त खेती दा सलाहकार ऐ।"
  },
  {
    "code": "sat",
    "native": "ᱥᱟᱱᱛᱟᱲᱤ (संताली)",
    "english": "Santali",
    "region": "झारखंड, ओडिशा व बंगाल",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "ᱡᱚᱦᱟᱨ ᱪᱟᱹᱥᱤ ᱵᱚᱭᱦᱟ! ᱠᱨᱤᱥᱤ ᱥᱚᱦᱟᱭᱚᱠ ᱫᱚ ᱢᱩᱯᱷᱛ ᱪᱟᱥ ᱫᱤᱥᱟᱹ ᱩᱫᱩᱜ ᱠᱟᱱᱟ।"
  }
];

window.KRISHI_GUIDANCE_PACKS = {
  "hi": {
    "appName": "कृषि सहायक",
    "zeroSellPledge": "100% निःशुल्क किसान मार्गदर्शक • कोई बिक्री नहीं • निष्पक्ष सलाह",
    "home": "होम",
    "cropDoctor": "पत्ती जांच",
    "selfReliant": "घरेलू व परख",
    "mandi": "मंडी मार्गदर्शन",
    "calendar": "खाद व मौसम",
    "schemes": "योजना व हक",
    "mitra": "बोलो मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुनें",
    "stopBtn": "रोकें",
    "speakAskBtn": "अपनी भाषा में बोलकर पूछें",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "हिन्दी",
    "langEnglish": "Hindi",
    "region": "उत्तर व मध्य भारत",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "नमस्ते किसान मित्र! कृषि सहायक पूर्णतः निःशुल्क मार्गदर्शक है।"
  },
  "en": {
    "appName": "Krishi Sahayak",
    "zeroSellPledge": "100% Free Farmer Guide • No Selling • No Ads",
    "home": "Home",
    "cropDoctor": "Leaf Scan",
    "selfReliant": "DIY & Purity",
    "mandi": "Mandi Guide",
    "calendar": "Soil & Weather",
    "schemes": "Govt Rights",
    "mitra": "Voice AI",
    "profileBtn": "My Farm",
    "listenBtn": "Listen",
    "stopBtn": "Stop",
    "speakAskBtn": "Speak in Your Language",
    "unitAcre": "Acre",
    "unitBigha": "Bigha",
    "unitHectare": "Hectare",
    "per15LPump": "Per 15L Knapsack Pump",
    "guideTitle": "Self-Reliant Farming & Input Purity Guide",
    "tabDiyBio": "🌿 DIY Home Bio-Remedies",
    "tabPurityTest": "🧪 Test Fake Fertilizer/Seed",
    "tabClimateRescue": "⛈️ Weather Shock Rescue",
    "tabFarmDiary": "📒 My Private Cost Diary",
    "tabFreeHelpline": "📞 Free Govt Scientists",
    "rxNoSellBadge": "Unbiased Scientific & Natural Advice (Zero Brand Promotion)",
    "rxDiyCtaTitle": "🌿 Prepare Natural Remedy at Home & Check Genuine Inputs",
    "rxDiyCtaDesc": "Save ₹1,500–₹3,000/acre using on-farm Neemastra/Jeevamrut & 2-minute fertilizer purity checks before applying anything.",
    "rxDiyCtaBtn": "Open DIY Recipe & Input Purity Guide",
    "rxFreeKvkBtn": "Call Free Govt Scientist (1800-180-1551)",
    "tileClinicTitle": "DIY Remedies & Purity",
    "tileClinicSub": "Jeevamrut • Check Fake DAP",
    "tileKvkTitle": "Free KVK Helpline",
    "tileKvkSub": "1800-180-1551 (22 Langs)",
    "profileScreenTitle": "My Farm Profile & Free Cloud Backup",
    "profileScreenSub": "No login required! Customize your village, crop & land unit. Stored offline & optionally backed up via Google Free Tier.",
    "saveProfileBtn": "Save My Farm Preferences",
    "langName": "English",
    "langEnglish": "English (India)",
    "region": "All India",
    "voice": "en-IN",
    "rtl": false,
    "mlkit": "en",
    "welcome": "Welcome farmer friend! Krishi Sahayak is a 100% free, unbiased farming guide."
  },
  "mr": {
    "appName": "कृषी सहाय्यक",
    "zeroSellPledge": "१००% मोफत शेतकरी मार्गदर्शक • कोणतीही विक्री नाही • निष्पक्ष सल्ला",
    "home": "मुख्य पान",
    "cropDoctor": "पान तपासणी",
    "selfReliant": "घरगुती व पारख",
    "mandi": "बाजारभाव",
    "calendar": "खत व हवामान",
    "schemes": "शासकीय योजना",
    "mitra": "बोला मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "ऐका",
    "stopBtn": "थांबा",
    "speakAskBtn": "तुमच्या भाषेत बोलून विचारा",
    "unitAcre": "एकर",
    "unitBigha": "गुंठा/बिघा",
    "unitHectare": "हेक्टर",
    "per15LPump": "प्रति १५ लिटर पंप प्रमाण",
    "guideTitle": "स्वावलंबी शेती व अस्सल खत-बियाणे ओळख केंद्र",
    "tabDiyBio": "🌿 घरगुती जैविक उपाय",
    "tabPurityTest": "🧪 बनावट खत-बियाणे तपासा",
    "tabClimateRescue": "⛈️ हवामान आपत्ती बचाव",
    "tabFarmDiary": "📒 वैयक्तिक खर्च डायरी",
    "tabFreeHelpline": "📞 मोफत कृषी शास्त्रज्ञ",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व नैसर्गिक सल्ला (कोणतीही विक्री नाही)",
    "rxDiyCtaTitle": "🌿 घरीच जैविक अर्क बनवा आणि खऱ्या खताची ओळख पटवा",
    "rxDiyCtaDesc": "महागड्या रसायनांपासून वाचा — निमास्त्र/जीवामृत घरी बनवा आणि २ मिनिटांत अस्सल डीएपी/झिंक तपासा.",
    "rxDiyCtaBtn": "घरगुती कृती व खत शुद्धता चाचणी पहा",
    "rxFreeKvkBtn": "मोफत किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरगुती उपाय व पारख",
    "tileClinicSub": "जीवामृत • अस्सल खत चाचणी",
    "tileKvkTitle": "मोफत KVK मदत",
    "tileKvkSub": "1800-180-1551 (शासकीय)",
    "profileScreenTitle": "माझे शेत प्रोफाइल (लॉगिन आवश्यक नाही)",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "शेत माहिती जतन करा",
    "langName": "मराठी",
    "langEnglish": "Marathi",
    "region": "महाराष्ट्र",
    "voice": "mr-IN",
    "rtl": false,
    "mlkit": "mr",
    "welcome": "नमस्कार शेतकरी मित्रांनो! कृषी सहाय्यक हे १००% मोफत मार्गदर्शन अॅप आहे."
  },
  "pa": {
    "appName": "ਕ੍ਰਿਸ਼ੀ ਸਹਾਇਕ",
    "zeroSellPledge": "100% ਮੁਫ਼ਤ ਕਿਸਾਨ ਮਾਰਗਦਰਸ਼ਕ • ਕੋਈ ਵਿਕਰੀ ਨਹੀਂ • ਨਿਰਪੱਖ ਸਲਾਹ",
    "home": "ਮੁੱਖ ਪੰਨਾ",
    "cropDoctor": "ਪੱਤਾ ਜਾਂਚ",
    "selfReliant": "ਘਰੇਲੂ ਤੇ ਪਰਖ",
    "mandi": "ਮੰਡੀ ਸੇਧ",
    "calendar": "ਖਾਦ ਤੇ ਮੌਸਮ",
    "schemes": "ਸਰਕਾਰੀ ਹੱਕ",
    "mitra": "ਬੋਲੋ ਮਿੱਤਰ",
    "profileBtn": "मेरा खेत",
    "listenBtn": "ਸੁਣੋ",
    "stopBtn": "ਰੋਕੋ",
    "speakAskBtn": "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲ ਕੇ ਪੁੱਛੋ",
    "unitAcre": "ਏਕੜ (ਕਿੱਲਾ)",
    "unitBigha": "ਕਨਾਲ/ਬਿੱਘਾ",
    "unitHectare": "ਹੈਕਟੇਅਰ",
    "per15LPump": "ਪ੍ਰਤੀ 15 ਲੀਟਰ ਪੰਪ ਮਾਤਰਾ",
    "guideTitle": "ਆਤਮ-ਨਿਰਭਰ ਖੇਤੀ ਅਤੇ ਅਸਲੀ ਖਾਦ-ਬੀਜ ਪਛਾਣ ਕੇਂਦਰ",
    "tabDiyBio": "🌿 ਘਰੇਲੂ ਜੈਵਿਕ ਨੁਸਖੇ",
    "tabPurityTest": "🧪 ਨਕਲੀ ਖਾਦ-ਬੀਜ ਪਰਖੋ",
    "tabClimateRescue": "⛈️ ਮੌਸਮੀ ਆਫ਼ਤ ਬਚਾਅ",
    "tabFarmDiary": "📒 ਨਿੱਜੀ ਖਰਚ ਡਾਇਰੀ",
    "tabFreeHelpline": "📞 ਮੁਫ਼ਤ KVK ਵਿਗਿਆਨੀ",
    "rxNoSellBadge": "ਨਿਰਪੱਖ ਵਿਗਿਆਨਕ ਸਲਾਹ (ਕੋਈ ਦਵਾਈ ਵੇਚਣ ਲਈ ਨਹੀਂ)",
    "rxDiyCtaTitle": "🌿 ਘਰ ਵਿੱਚ ਜੈਵਿਕ ਘੋਲ ਬਣਾਓ ਤੇ ਅਸਲੀ ਖਾਦ ਪਰਖੋ",
    "rxDiyCtaDesc": "ਮਹਿੰਗੀਆਂ ਜ਼ਹਿਰਾਂ ਤੋਂ ਬਚੋ — ਨੀਮਾਸਤਰ/ਜੀਵਾਮ੍ਰਿਤ ਘਰ ਬਣਾਓ ਅਤੇ 2 ਮਿੰਟ ਵਿੱਚ ਅਸਲੀ ਡੀਏਪੀ/ਜ਼ਿੰਕ ਚੈੱਕ ਕਰੋ।",
    "rxDiyCtaBtn": "ਘਰੇਲੂ ਵਿਧੀ ਅਤੇ ਖਾਦ ਪਰਖ ਵੇਖੋ",
    "rxFreeKvkBtn": "ਮੁਫ਼ਤ ਕਿਸਾਨ ਕਾਲ ਸੈਂਟਰ (1800-180-1551)",
    "tileClinicTitle": "ਘਰੇਲੂ ਨੁਸਖੇ ਤੇ ਪਰਖ",
    "tileClinicSub": "ਜੀਵਾਮ੍ਰਿਤ • ਅਸਲੀ ਖਾਦ ਜਾਂਚ",
    "tileKvkTitle": "ਮੁਫ਼ਤ KVK ਮਦਦ",
    "tileKvkSub": "1800-180-1551 (ਸਰਕਾਰੀ)",
    "profileScreenTitle": "ਮੇਰਾ ਖੇਤ ਪ੍ਰੋਫਾਈਲ (ਬਿਨਾਂ ਲੌਗਇਨ ਖੁੱਲ੍ਹਾ)",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "ਖੇਤ ਜਾਣਕਾਰੀ ਸੰਭਾਲੋ",
    "langName": "ਪੰਜਾਬੀ",
    "langEnglish": "Punjabi",
    "region": "ਪੰਜਾਬ",
    "voice": "pa-IN",
    "rtl": false,
    "mlkit": "pa",
    "welcome": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਕ੍ਰਿਸ਼ੀ ਸਹਾਇਕ 100% ਮੁਫ਼ਤ ਖੇਤੀ ਮਾਰਗਦਰਸ਼ਕ ਹੈ।"
  },
  "gu": {
    "appName": "કૃષિ સહાયક",
    "zeroSellPledge": "૧૦૦% નિઃશુલ્ક ખેડૂત માર્ગદર્શક • કોઈ વેચાણ નહીં • નિષ્પક્ષ સલાહ",
    "home": "હોમ",
    "cropDoctor": "પાન તપાસ",
    "selfReliant": "ઘરગથ્થુ અને પરખ",
    "mandi": "બજાર ભાવ",
    "calendar": "ખાતર-હવામાન",
    "schemes": "સરકારી યોજના",
    "mitra": "બોલો મિત્ર",
    "profileBtn": "मेरा खेत",
    "listenBtn": "સાંભળો",
    "stopBtn": "રોકો",
    "speakAskBtn": "તમારી ભાષામાં બોલીને પૂછો",
    "unitAcre": "એકર",
    "unitBigha": "વીઘા",
    "unitHectare": "હેક્ટર",
    "per15LPump": "પ્રતિ ૧૫ લિટર પંપ પ્રમાણ",
    "guideTitle": "સ્વાવલંબી ખેતી અને અસલી ખાતર-બિયારણ ઓળખ કેન્દ્ર",
    "tabDiyBio": "🌿 ઘરગથ્થુ જૈવિક ઉપાય",
    "tabPurityTest": "🧪 નકલી ખાતર-બિયારણ ચકાસો",
    "tabClimateRescue": "⛈️ હવામાન આપત્તિ બચાવ",
    "tabFarmDiary": "📒 ખાનગી ખર્ચ ડાયરી",
    "tabFreeHelpline": "📞 નિઃશુલ્ક KVK વૈજ્ઞાનિક",
    "rxNoSellBadge": "નિષ્પક્ષ વૈજ્ઞાનિક અને પ્રાકૃતિક સલાહ (કોઈ વેચાણ નહીં)",
    "rxDiyCtaTitle": "🌿 ઘરે જ જૈવિક દવા બનાવો અને અસલી ખાતર ઓળખો",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "ઘરગથ્થુ રીત અને ખાતર ચકાસણી જુઓ",
    "rxFreeKvkBtn": "નિઃશુલ્ક કિસાન કોલ સેન્ટર (1800-180-1551)",
    "tileClinicTitle": "ઘરગથ્થુ ઉપાય અને પરખ",
    "tileClinicSub": "જીવામૃત • ખાતર ચકાસણી",
    "tileKvkTitle": "નિઃશુલ્ક KVK મદદ",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "ગુજરાતી",
    "langEnglish": "Gujarati",
    "region": "ગુજરાત",
    "voice": "gu-IN",
    "rtl": false,
    "mlkit": "gu",
    "welcome": "નમસ્તે ખેડૂત મિત્રો! કૃષિ સહાયક ૧૦૦% નિઃશુલ્ક માર્ગદર્શક છે."
  },
  "bn": {
    "appName": "কৃষি সহায়ক",
    "zeroSellPledge": "১০০% বিনামূল্যে কৃষক নির্দেশিকা • কোনো বিক্রি নয় • নিরপেক্ষ পরামর্শ",
    "home": "হোম",
    "cropDoctor": "পাতা পরীক্ষা",
    "selfReliant": "ঘরোয়া ও যাচাই",
    "mandi": "মান্ডি দর",
    "calendar": "সার ও আবহাওয়া",
    "schemes": "সরকারি প্রকল্প",
    "mitra": "ভয়েস এআই",
    "profileBtn": "मेरा खेत",
    "listenBtn": "শুনুন",
    "stopBtn": "থামুন",
    "speakAskBtn": "আপনার ভাষায় কথা বলে জিজ্ঞাসা করুন",
    "unitAcre": "একর",
    "unitBigha": "বিঘা",
    "unitHectare": "হেক্টর",
    "per15LPump": "প্রতি ১৫ লিটার স্প্রে ট্যাঙ্ক মাত্রা",
    "guideTitle": "স্বনির্ভর কৃষি ও আসল সার-বীজ চেনার কেন্দ্র",
    "tabDiyBio": "🌿 ঘরোয়া জৈব সমাধান",
    "tabPurityTest": "🧪 নকল সার-বীজ পরীক্ষা",
    "tabClimateRescue": "⛈️ দুর্যোগ থেকে ফসল রক্ষা",
    "tabFarmDiary": "📒 নিজস্ব চাষের হিসাব",
    "tabFreeHelpline": "📞 বিনামূল্যে কৃষি বিজ্ঞানী",
    "rxNoSellBadge": "নিরপেক্ষ বৈজ্ঞানিক ও প্রাকৃতিক পরামর্শ (কোনো পণ্য বিক্রি নয়)",
    "rxDiyCtaTitle": "🌿 বাড়িতে জৈব দ্রবণ তৈরি করুন ও আসল সার চিনুন",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "ঘরোয়া পদ্ধতি ও সার পরীক্ষা দেখুন",
    "rxFreeKvkBtn": "বিনামূল্যে কিষাণ কল সেন্টার (1800-180-1551)",
    "tileClinicTitle": "ঘরোয়া উপায় ও যাচাই",
    "tileClinicSub": "জীবামৃত • আসল সার পরীক্ষা",
    "tileKvkTitle": "বিনামূল্যে KVK সাহায্য",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "বাংলা",
    "langEnglish": "Bengali",
    "region": "পশ্চিমবঙ্গ ও ত্রিপুরা",
    "voice": "bn-IN",
    "rtl": false,
    "mlkit": "bn",
    "welcome": "নমস্কার কৃষক বন্ধু! কৃষি সহায়ক সম্পূর্ণ বিনামূল্যে কৃষি নির্দেশিকা।"
  },
  "te": {
    "appName": "కృషి సహాయక్",
    "zeroSellPledge": "100% ఉచిత రైతు మార్గదర్శి • ఎలాంటి అమ్మకాలు లేవు • నిష్పాక్షిక సలహా",
    "home": "హోమ్",
    "cropDoctor": "ఆకు పరీక్ష",
    "selfReliant": "సొంత వైద్యం & తనిఖీ",
    "mandi": "మండీ ధరలు",
    "calendar": "ఎరువు & వాతావరణం",
    "schemes": "ప్రభుత్వ పథకాలు",
    "mitra": "వాయిస్ AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "వినండి",
    "stopBtn": "ఆపండి",
    "speakAskBtn": "మీ భాషలో మాట్లాడి అడగండి",
    "unitAcre": "ఎకరం",
    "unitBigha": "గుంట/బిఘా",
    "unitHectare": "హెక్టారు",
    "per15LPump": "15 లీటర్ల స్ప్రే ట్యాంక్ మోతాదు",
    "guideTitle": "స్వావలంబన వ్యవసాయం & అసలైన ఎరువులు-విత్తనాల గుర్తింపు కేంద్రం",
    "tabDiyBio": "🌿 ఇంటి వద్ద జీవ కషాయాలు",
    "tabPurityTest": "🧪 నకిలీ ఎరువు/విత్తన పరీక్ష",
    "tabClimateRescue": "⛈️ వాతావరణ విపత్తు రక్షణ",
    "tabFarmDiary": "📒 నా సాగు ఖర్చు డైరీ",
    "tabFreeHelpline": "📞 ఉచిత KVK శాస్త్రవేత్తలు",
    "rxNoSellBadge": "నిష్పాక్షిక శాస్త్రీయ & ప్రకృతి సలహా (మందుల అమ్మకం కాదు)",
    "rxDiyCtaTitle": "🌿 ఇంట్లోనే నీమాస్త్రం/జీవామృతం తయారీ & అసలైన ఎరువు పరీక్ష",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "తయారీ విధానం & నాణ్యత పరీక్ష చూడండి",
    "rxFreeKvkBtn": "ఉచిత కిసాన్ కాల్ సెంటర్ (1800-180-1551)",
    "tileClinicTitle": "సొంత కషాయాలు & పరీక్ష",
    "tileClinicSub": "జీవామృతం • నకిలీ ఎరువు తనిఖీ",
    "tileKvkTitle": "ఉచిత KVK సహాయం",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "తెలుగు",
    "langEnglish": "Telugu",
    "region": "ఆంధ్రప్రదేశ్ & తెలంగాణ",
    "voice": "te-IN",
    "rtl": false,
    "mlkit": "te",
    "welcome": "నమస్కారం రైతు మిత్రులారా! కృషి సహాయక్ పూర్తిగా ఉచిత వ్యవసాయ మార్గదర్శి."
  },
  "ta": {
    "appName": "கிருஷி சஹாயக்",
    "zeroSellPledge": "100% இலவச விவசாய வழிகாட்டி • விற்பனை இல்லை • நடுநிலை ஆலோசனை",
    "home": "முகப்பு",
    "cropDoctor": "இலை சோதனை",
    "selfReliant": "இயற்கை & தர சோதனை",
    "mandi": "மண்டி விலை",
    "calendar": "உரம் & வானிலை",
    "schemes": "அரசு திட்டம்",
    "mitra": "குரல் AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "கேளுங்கள்",
    "stopBtn": "நிறுத்து",
    "speakAskBtn": "உங்கள் மொழியில் பேசி கேளுங்கள்",
    "unitAcre": "ஏக்கர்",
    "unitBigha": "சென்ட்/பிகா",
    "unitHectare": "ஹெக்டேர்",
    "per15LPump": "15 லிட்டர் டேங்க் அளவு",
    "guideTitle": "தற்சார்பு விவசாயம் & அசல் உரம்-விதை கண்டறியும் மையம்",
    "tabDiyBio": "🌿 வீட்டு இயற்கை கரைசல்கள்",
    "tabPurityTest": "🧪 போலி உரம்/விதை சோதனை",
    "tabClimateRescue": "⛈️ பேரிடர் பயிர் பாதுகாப்பு",
    "tabFarmDiary": "📒 என் விவசாய கணக்கு",
    "tabFreeHelpline": "📞 இலவச KVK விஞ்ஞானிகள்",
    "rxNoSellBadge": "நடுநிலையான அறிவியல் மற்றும் இயற்கை ஆலோசனை (விற்பனை இல்லை)",
    "rxDiyCtaTitle": "🌿 வீட்டிலேயே ஜீவாமிர்தம் தயாரிப்பு & அசல் உரம் சோதனை",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "தயாரிப்பு முறை & தர சோதனை காண்க",
    "rxFreeKvkBtn": "இலவச கிசான் அழைப்பு மையம் (1800-180-1551)",
    "tileClinicTitle": "இயற்கை தீர்வு & சோதனை",
    "tileClinicSub": "ஜீவாமிர்தம் • உரம் சோதனை",
    "tileKvkTitle": "இலவச KVK உதவி",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "தமிழ்",
    "langEnglish": "Tamil",
    "region": "தமிழ்நாடு",
    "voice": "ta-IN",
    "rtl": false,
    "mlkit": "ta",
    "welcome": "வணக்கம் விவசாய நண்பர்களே! கிருஷி சஹாயக் முற்றிலும் இலவச வழிகாட்டி."
  },
  "kn": {
    "appName": "ಕೃಷಿ ಸಹಾಯಕ್",
    "zeroSellPledge": "100% ಉಚಿತ ರೈತ ಮಾರ್ಗದರ್ಶಿ • ಯಾವುದೇ ಮಾರಾಟವಿಲ್ಲ • ನಿಷ್ಪಕ್ಷಪಾತ ಸಲಹೆ",
    "home": "ಮುಖಪುಟ",
    "cropDoctor": "ಎಲೆ ಪರೀಕ್ಷೆ",
    "selfReliant": "ಮನೆಮದ್ದು & ಗುಣಮಟ್ಟ",
    "mandi": "ಮಂಡಿ ದರ",
    "calendar": "ಗೊಬ್ಬರ & ಹವಾಮಾನ",
    "schemes": "ಸರ್ಕಾರಿ ಯೋಜನೆ",
    "mitra": "ಧ್ವನಿ AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "ಕೇಳಿ",
    "stopBtn": "ನಿಲ್ಲಿಸಿ",
    "speakAskBtn": "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಕೇಳಿ",
    "unitAcre": "ಎಕರೆ",
    "unitBigha": "ಗುಂಟೆ",
    "unitHectare": "ಹೆಕ್ಟೇರ್",
    "per15LPump": "ಪ್ರತಿ 15 ಲೀಟರ್ ಪಂಪ್ ಪ್ರಮಾಣ",
    "guideTitle": "ಸ್ವಾವಲಂಬಿ ಕೃಷಿ ಮತ್ತು ಅಸಲಿ ಗೊಬ್ಬರ-ಬೀಜ ಗುರುತಿಸುವ ಕೇಂದ್ರ",
    "tabDiyBio": "🌿 ಜೀವಾಮೃತ / ಸಾವಯವ ದ್ರಾವಣ",
    "tabPurityTest": "🧪 ನಕಲಿ ಗೊಬ್ಬರ/ಬೀಜ ಪರೀಕ್ಷೆ",
    "tabClimateRescue": "⛈️ ಹವಾಮಾನ ಆಪತ್ತು ರಕ್ಷಣೆ",
    "tabFarmDiary": "📒 ನನ್ನ ಕೃಷಿ ಖರ್ಚು ಡೈರಿ",
    "tabFreeHelpline": "📞 ಉಚಿತ KVK ವಿಜ್ಞಾನಿಗಳು",
    "rxNoSellBadge": "ನಿಷ್ಪಕ್ಷಪಾತ ವೈಜ್ಞಾನಿಕ ಮತ್ತು ನೈಸರ್ಗಿಕ ಸಲಹೆ (ಯಾವುದೇ ಮಾರಾಟವಿಲ್ಲ)",
    "rxDiyCtaTitle": "🌿 ಮನೆಯಲ್ಲೇ ಸಾವಯವ ದ್ರಾವಣ ತಯಾರಿಸಿ & ಅಸಲಿ ಗೊಬ್ಬರ ಪರೀಕ್ಷಿಸಿ",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "ತಯಾರಿಸುವ ವಿಧಾನ ಮತ್ತು ಪರೀಕ್ಷೆ ನೋಡಿ",
    "rxFreeKvkBtn": "ಉಚಿತ ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ (1800-180-1551)",
    "tileClinicTitle": "ಮನೆಮದ್ದು & ಪರೀಕ್ಷೆ",
    "tileClinicSub": "ಜೀವಾಮೃತ • ಅಸಲಿ ಗೊಬ್ಬರ ಪರೀಕ್ಷೆ",
    "tileKvkTitle": "ಉಚಿತ KVK ಸಹಾಯ",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "ಕನ್ನಡ",
    "langEnglish": "Kannada",
    "region": "ಕರ್ನಾಟಕ",
    "voice": "kn-IN",
    "rtl": false,
    "mlkit": "kn",
    "welcome": "ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ! ಕೃಷಿ ಸಹಾಯಕ್ ಸಂಪೂರ್ಣ ಉಚಿತ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ."
  },
  "ml": {
    "appName": "കൃഷി സഹായക്",
    "zeroSellPledge": "100% സൗജന്യ കർഷക മാർഗ്ഗനിർദ്ദേശം • വിൽപ്പനയില്ല • നിഷ്പക്ഷ ഉപദേശം",
    "home": "ഹോം",
    "cropDoctor": "ഇല പരിശോധന",
    "selfReliant": "ജൈവരീതി & പരിശോധന",
    "mandi": "വിപണി വില",
    "calendar": "വളം & കാലാവസ്ഥ",
    "schemes": "പദ്ധതികൾ",
    "mitra": "വോയ്‌സ് AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "കേൾക്കുക",
    "stopBtn": "നിർത്തുക",
    "speakAskBtn": "നിങ്ങളുടെ ഭാഷയിൽ സംസാരിച്ച് ചോദിക്കൂ",
    "unitAcre": "ഏക്കർ",
    "unitBigha": "സെന്റ്",
    "unitHectare": "ഹെക്ടർ",
    "per15LPump": "15 ലിറ്റർ പമ്പ് അളവ്",
    "guideTitle": "സ്വാശ്രയ കൃഷിയും വ്യാജ വളം-വിത്ത് തിരിച്ചറിയൽ കേന്ദ്രവും",
    "tabDiyBio": "🌿 വീട്ടിലുണ്ടാക്കാവുന്ന ജൈവലായനി",
    "tabPurityTest": "🧪 വ്യാജ വളം/വിത്ത് പരിശോധന",
    "tabClimateRescue": "⛈️ കാലാവസ്ഥാ ദുരന്ത രക്ഷ",
    "tabFarmDiary": "📒 എന്റെ കൃഷി കണക്ക്",
    "tabFreeHelpline": "📞 സൗജന്യ KVK ശാസ്ത്രജ്ഞർ",
    "rxNoSellBadge": "നിഷ്പക്ഷ ശാസ്ത്രീയ & ജൈവ ഉപദേശം (ഉൽപ്പന്ന വിൽപ്പനയില്ല)",
    "rxDiyCtaTitle": "🌿 വീട്ടിൽ ജീവാമൃതം തയ്യാറാക്കാം & യഥാർത്ഥ വളം തിരിച്ചറിയാം",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "തയ്യാറാക്കുന്ന രീതിയും പരിശോധനയും കാണുക",
    "rxFreeKvkBtn": "സൗജന്യ കിസാൻ കോൾ സെന്റർ (1800-180-1551)",
    "tileClinicTitle": "ജൈവരീതി & പരിശോധന",
    "tileClinicSub": "ജീവാമൃതം • വളം പരിശോധന",
    "tileKvkTitle": "സൗജന്യ KVK സഹായം",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "മലയാളം",
    "langEnglish": "Malayalam",
    "region": "കേരളം",
    "voice": "ml-IN",
    "rtl": false,
    "mlkit": "ml",
    "welcome": "നമസ്കാരം കർഷക സുഹൃത്തുക്കളെ! കൃഷി സഹായക് പൂർണ്ണമായും സൗജന്യ മാർഗ്ഗനിർദ്ദേശമാണ്."
  },
  "or": {
    "appName": "କୃଷି ସହାୟକ",
    "zeroSellPledge": "୧୦୦% ମାଗଣା ଚାଷୀ ମାର୍ଗଦର୍ଶକ • କୌଣସି ବିକ୍ରି ନାହିଁ • ନିରପେକ୍ଷ ପରାମର୍ଶ",
    "home": "ମୁଖ୍ୟ ପୃଷ୍ଠା",
    "cropDoctor": "ପତ୍ର ପରୀକ୍ଷା",
    "selfReliant": "ଘରୋଇ ଓ ପରଖ",
    "mandi": "ମଣ୍ଡି ଦର",
    "calendar": "ସାର ଓ ପାଣିପାଗ",
    "schemes": "ସରକାରୀ ଯୋଜନା",
    "mitra": "ଭଏସ୍ AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "ଶୁଣନ୍ତୁ",
    "stopBtn": "ରୋକନ୍ତୁ",
    "speakAskBtn": "ନିଜ ଭାଷାରେ କହି ପଚାରନ୍ତୁ",
    "unitAcre": "ଏକର",
    "unitBigha": "ମାଣ/ବିଘା",
    "unitHectare": "ହେକ୍ଟର",
    "per15LPump": "ପ୍ରତି ୧୫ ଲିଟର ପମ୍ପ ମାତ୍ରା",
    "guideTitle": "ସ୍ୱାବଲମ୍ବୀ ଚାଷ ଓ ଅସଲି ସାର-ବିହନ ଚିହ୍ନଟ କେନ୍ଦ୍ର",
    "tabDiyBio": "🌿 ଘରୋଇ ଜୈବିକ ଉପାୟ",
    "tabPurityTest": "🧪 ନକଲି ସାର-ବିହନ ପରୀକ୍ଷା",
    "tabClimateRescue": "⛈️ ପାଣିପାଗ ବିପତ୍ତି ସୁରକ୍ଷା",
    "tabFarmDiary": "📒 ମୋ ଚାଷ ଖର୍ଚ୍ଚ ଡାଏରୀ",
    "tabFreeHelpline": "📞 ମାଗଣା KVK ବୈଜ୍ଞାନିକ",
    "rxNoSellBadge": "ନିରପେକ୍ଷ ବୈଜ୍ଞାନିକ ଓ ପ୍ରାକୃତିକ ପରାମର୍ଶ (କୌଣସି ବିକ୍ରି ନାହିଁ)",
    "rxDiyCtaTitle": "🌿 ଘରେ ଜୀବାମୃତ/ନୀମାସ୍ତ୍ର ତିଆରି ଓ ଅସଲି ସାର ପରୀକ୍ଷା",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "ଘରୋଇ ପଦ୍ଧତି ଓ ସାର ପରୀକ୍ଷା ଦେଖନ୍ତୁ",
    "rxFreeKvkBtn": "ମାଗଣା କିଷାନ କଲ୍ ସେଣ୍ଟର (1800-180-1551)",
    "tileClinicTitle": "ଘରୋଇ ଉପାୟ ଓ ପରଖ",
    "tileClinicSub": "ଜୀବାମୃତ • ସାର ପରୀକ୍ଷା",
    "tileKvkTitle": "ମାଗଣା KVK ସହାୟତା",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "ଓଡ଼ିଆ",
    "langEnglish": "Odia",
    "region": "ଓଡ଼ିଶା",
    "voice": "or-IN",
    "rtl": false,
    "mlkit": "or",
    "welcome": "ନମସ୍କାର ଚାଷୀ ଭାଇ ଓ ଭଉଣୀମାନେ! କୃଷି ସହାୟକ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା କୃଷି ମାର୍ଗଦର୍ଶକ।"
  },
  "as": {
    "appName": "কৃষি সহায়ক",
    "zeroSellPledge": "১০০% বিনামূলীয়া কৃষক নিৰ্দেশিকা • কোনো বিক্ৰী নাই • নিৰপেক্ষ পৰামৰ্শ",
    "home": "মূল পৃষ্ঠা",
    "cropDoctor": "পাত পৰীক্ষা",
    "selfReliant": "ঘৰুৱা আৰু পৰীক্ষা",
    "mandi": "বজাৰ দৰ",
    "calendar": "সাৰ আৰু বতৰ",
    "schemes": "চৰকাৰী আঁচনি",
    "mitra": "ভয়েচ AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "শুনক",
    "stopBtn": "ৰখক",
    "speakAskBtn": "আপোনাৰ ভাষাত কৈ সুধিব পাৰে",
    "unitAcre": "একৰ",
    "unitBigha": "বিঘা",
    "unitHectare": "হেক্টৰ",
    "per15LPump": "প্ৰতি ১৫ লিটাৰ স্প্ৰে পাম্পৰ মাত্ৰা",
    "guideTitle": "স্বাৱলম্বী কৃষি আৰু আচল সাৰ-বীজ চিনাক্তকৰণ কেন্দ্ৰ",
    "tabDiyBio": "🌿 ঘৰুৱা জৈৱিক উপায়",
    "tabPurityTest": "🧪 নকল সাৰ-বীজ পৰীক্ষা",
    "tabClimateRescue": "⛈️ বতৰৰ দুৰ্যোগ সুৰক্ষা",
    "tabFarmDiary": "📒 মোৰ খেতিৰ খৰচ ডায়েৰী",
    "tabFreeHelpline": "📞 বিনামূলীয়া KVK বিজ্ঞানী",
    "rxNoSellBadge": "নিৰপেক্ষ বৈজ্ঞানিক আৰু প্ৰাকৃতিক পৰামৰ্শ (কোনো বিক্ৰী নাই)",
    "rxDiyCtaTitle": "🌿 ঘৰতে জীৱামৃত প্ৰস্তুত কৰক আৰু আচল সাৰ চিনাক্ত কৰক",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "ঘৰুৱা পদ্ধতি আৰু সাৰ পৰীক্ষা চাওক",
    "rxFreeKvkBtn": "বিনামূলীয়া কিষাণ কল চেণ্টাৰ (1800-180-1551)",
    "tileClinicTitle": "ঘৰুৱা উপায় ও পৰীক্ষা",
    "tileClinicSub": "জীৱামৃত • আচল সাৰ পৰীক্ষা",
    "tileKvkTitle": "বিনামূলীয়া KVK সহায়",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "অসমীয়া",
    "langEnglish": "Assamese",
    "region": "অসম",
    "voice": "as-IN",
    "rtl": false,
    "mlkit": "as",
    "welcome": "নমস্কাৰ কৃষক বন্ধু! কৃষি সহায়ক সম্পূৰ্ণ বিনামূলীয়া কৃষি নিৰ্দেশিকা।"
  },
  "ur": {
    "appName": "کرشی سہایک",
    "zeroSellPledge": "100% مفت کسان رہنما • کوئی فروخت نہیں • غیر جانبدار مشورہ",
    "home": "ہوم",
    "cropDoctor": "پتوں کی جانچ",
    "selfReliant": "گھریلو و پرکھ",
    "mandi": "منڈی بھاؤ",
    "calendar": "کھاد و موسم",
    "schemes": "سرکاری اسکیمیں",
    "mitra": "آواز AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "سنیں",
    "stopBtn": "روکیں",
    "speakAskBtn": "اپنی زبان میں بول کر پوچھیں",
    "unitAcre": "ایکڑ",
    "unitBigha": "بیگھہ/کنال",
    "unitHectare": "ہیکٹر",
    "per15LPump": "فی 15 لیٹر پمپ مقدار",
    "guideTitle": "خود کفیل کاشتکاری اور اصلی کھاد و بیج شناخت مرکز",
    "tabDiyBio": "🌿 گھریلو حیاتیاتی نسخے",
    "tabPurityTest": "🧪 نقلی کھاد و بیج کی پرکھ",
    "tabClimateRescue": "⛈️ موسمی آفات سے بچاؤ",
    "tabFarmDiary": "📒 میری ذاتی لاگت ڈائری",
    "tabFreeHelpline": "📞 مفت سرکاری زرعی ماہرین",
    "rxNoSellBadge": "غیر جانبدار سائنسی و قدرتی مشورہ (کوئی دوا فروخت نہیں)",
    "rxDiyCtaTitle": "🌿 گھر پر نیم استر/جیوامرت بنائیں اور اصلی کھاد پہچانیں",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "گھریلو طریقہ اور کھاد ٹیسٹ دیکھیں",
    "rxFreeKvkBtn": "مفت کسان کال سینٹر (1800-180-1551)",
    "tileClinicTitle": "گھریلو نسخے و پرکھ",
    "tileClinicSub": "جیوامرت • اصلی کھاد جانچ",
    "tileKvkTitle": "مفت KVK مدد",
    "tileKvkSub": "1800-180-1551",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "اردو",
    "langEnglish": "Urdu",
    "region": "جموں و کشمیر / شمالی ہند",
    "voice": "ur-IN",
    "rtl": true,
    "mlkit": "ur",
    "welcome": "آداب کسان بھائیو! کرشی سہایک سو فیصد مفت زرعی رہنمائی ایپ ہے۔"
  },
  "bho": {
    "appName": "कृषि सहायक (भोजपुरी)",
    "zeroSellPledge": "100% मुफ़्त किसान सलाहकार • कवनो दुकानदारी ना • साँच मार्गदर्शन",
    "home": "घर",
    "cropDoctor": "पत्ता जांच",
    "selfReliant": "घरेलू नुस्खा",
    "mandi": "मंडी भाव",
    "calendar": "खाद-मौसम",
    "schemes": "सरकारी हक",
    "mitra": "बोलीं मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुनीं",
    "stopBtn": "रोकीं",
    "speakAskBtn": "आपन भोजपुरी भा हिंदी में बोल के पूछीं",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "अपना हाथे जैविक दवाई आ असली खाद-बीया के पहचान",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घरे नीमास्त्र/जीवामृत बनाईं आ नकली डीएपी-यूरिया पकड़ीं",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू तरीका आ खाद जांच देखीं",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "भोजपुरी",
    "langEnglish": "Bhojpuri",
    "region": "पूर्वी उ.प्र. व बिहार",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "रउआ सब किसान भाई के प्रणाम! कृषि सहायक एकदम मुफ्त खेती सलाहकार बा।"
  },
  "mai": {
    "appName": "कृषि सहायक (मैथिली)",
    "zeroSellPledge": "100% निःशुल्क किसान मार्गदर्शक • कोनो बिक्री नहि • निष्पक्ष सलाह",
    "home": "मुख्य पृष्ठ",
    "cropDoctor": "पात जांच",
    "selfReliant": "घरेलू उपाय",
    "mandi": "मंडी भाव",
    "calendar": "खाद आ मौसम",
    "schemes": "सरकारी योजना",
    "mitra": "बजू मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुनु",
    "stopBtn": "रोकू",
    "speakAskBtn": "अपन मैथिली वा हिंदी मे बाजि कऽ पूछू",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "मैथिली",
    "langEnglish": "Maithili",
    "region": "मिथिला / बिहार",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "प्रणाम किसान भाई लोकनि! कृषि सहायक पूर्णतः निःशुल्क खेती मार्गदर्शक अछि।"
  },
  "hne": {
    "appName": "कृषि सहायक (छत्तीसगढ़ी)",
    "zeroSellPledge": "100% मुफ़्त किसान संगवारी • कोनो बेचे के काम नहीं • सही सलाह",
    "home": "मुख पन्ना",
    "cropDoctor": "पाना जांच",
    "selfReliant": "घर के उपाय",
    "mandi": "मंडी भाव",
    "calendar": "खातू अउ मौसम",
    "schemes": "सरकारी योजना",
    "mitra": "गोठियाव संगी",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुनव",
    "stopBtn": "रोकव",
    "speakAskBtn": "अपन छत्तीसगढ़ी म बोल के पूछव",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "छत्तीसगढ़ी",
    "langEnglish": "Chhattisgarhi",
    "region": "छत्तीसगढ़",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "जय जोहार किसान संगी हो! कृषि सहायक पूरा मुफ़्त खेती सलाह संगवारी आय।"
  },
  "raj": {
    "appName": "कृषि सहायक (राजस्थानी)",
    "zeroSellPledge": "100% मुफ़्त किसान साथी • कोई सौदा-बिक्री कोनी • साचो मार्गदर्शन",
    "home": "मुख्य पानड़ो",
    "cropDoctor": "पानड़ा जांच",
    "selfReliant": "देसी उपाय",
    "mandi": "मंडी भाव",
    "calendar": "खाद अर मौसम",
    "schemes": "सरकारी योजना",
    "mitra": "बोलो साथी",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुणो",
    "stopBtn": "रोको",
    "speakAskBtn": "आपणी मारवाड़ी/राजस्थानी में बोल ने पूछो",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "राजस्थानी",
    "langEnglish": "Rajasthani / Marwari",
    "region": "राजस्थान",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "खम्मा घणी किसान भायां! कृषि सहायक एकदम मुफ़्त खेती रो साचो साथी है।"
  },
  "bgc": {
    "appName": "कृषि सहायक (हरियाणवी)",
    "zeroSellPledge": "100% मुफ़्त किसान सलाहकार • किमे बेचण का काम कोन्या • साची सलाह",
    "home": "घर",
    "cropDoctor": "पत्ता जांच",
    "selfReliant": "देसी नुस्खे",
    "mandi": "मंडी भाव",
    "calendar": "खाद-मौसम",
    "schemes": "सरकारी स्कीम",
    "mitra": "बोल कै पूछो",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुणो",
    "stopBtn": "रोको",
    "speakAskBtn": "आपणी हरियाणवी मैं बोल कै पूछो",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "हरियाणवी",
    "langEnglish": "Haryanvi",
    "region": "हरियाणा",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "राम-राम किसान भाइयो! कृषि सहायक सौ फीसदी मुफ़्त खेती का सच्चा सलाहकार सै।"
  },
  "kok": {
    "appName": "कृषी सहाय्यक (कोंकणी)",
    "zeroSellPledge": "१००% फुकट शेतकार मार्गदर्शक • कसलीच विक्री ना",
    "home": "मुखेल पान",
    "cropDoctor": "पानां तपासणी",
    "selfReliant": "घरगुती उपाय",
    "mandi": "बाजार दर",
    "calendar": "सारें आनी हवामान",
    "schemes": "सरकारी येवजण",
    "mitra": "उलय मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "आयकात",
    "stopBtn": "थांबात",
    "speakAskBtn": "अपनी भाषा में बोलकर पूछें",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "कोंकणी",
    "langEnglish": "Konkani",
    "region": "गोवा व कोंकण",
    "voice": "mr-IN",
    "rtl": false,
    "mlkit": "mr",
    "welcome": "देव बरे करूं शेतकार भाव! कृषी सहाय्यक पूर्णपणान फुकट शेतकी मार्गदर्शक आसा."
  },
  "ne": {
    "appName": "कृषि सहायक (नेपाली)",
    "zeroSellPledge": "१००% निःशुल्क किसान मार्गदर्शक • कुनै व्यापार छैन • निष्पक्ष सल्लाह",
    "home": "गृहपृष्ठ",
    "cropDoctor": "पात जाँच",
    "selfReliant": "घरेलु उपाय",
    "mandi": "बजार भाउ",
    "calendar": "मल र मौसम",
    "schemes": "सरकारी योजना",
    "mitra": "आवाज AI",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुन्नुहोस्",
    "stopBtn": "रोक्नुहोस्",
    "speakAskBtn": "अपनी भाषा में बोलकर पूछें",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "नेपाली",
    "langEnglish": "Nepali",
    "region": "सिक्किम व दार्जिलिङ",
    "voice": "ne-NP",
    "rtl": false,
    "mlkit": "ne",
    "welcome": "नमस्कार किसान मित्रहरू! कृषि सहायक पूर्ण रूपमा निःशुल्क कृषि मार्गदर्शक हो।"
  },
  "doi": {
    "appName": "कृषि सहायक (डोगरी)",
    "zeroSellPledge": "100% मुफ़्त करसान सलाहकार • कोई बिक्री नेईं • सच्ची सलाह",
    "home": "मुक्ख पन्ना",
    "cropDoctor": "पत्तर जांच",
    "selfReliant": "देसी उपाय",
    "mandi": "मंडी भाऽ",
    "calendar": "खाद ते मौसम",
    "schemes": "सरकारी स्कीमां",
    "mitra": "बोलो मित्र",
    "profileBtn": "मेरा खेत",
    "listenBtn": "सुनो",
    "stopBtn": "रोको",
    "speakAskBtn": "अपनी भाषा में बोलकर पूछें",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "डोगरी",
    "langEnglish": "Dogri",
    "region": "जम्मू क्षेत्र",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "जय देव किसान भाइयो! कृषि सहायक बिल्कुल मुफ़्त खेती दा सलाहकार ऐ।"
  },
  "sat": {
    "appName": "ᱠᱨᱤᱥᱤ ᱥᱚᱦᱟᱭᱚᱠ (संताली)",
    "zeroSellPledge": "100% ᱢᱩᱯᱷᱛ ᱪᱟᱹᱥᱤ ᱫᱤᱥᱟᱹ • ᱟᱹᱠᱷᱨᱤᱧ ᱵᱟᱝ • निश्पक्ष सलाह",
    "home": "ᱚᱲᱟᱜ (होम)",
    "cropDoctor": "ᱥᱟᱠᱟᱢ ᱧᱮᱞ",
    "selfReliant": "ᱚᱲᱟᱜ ᱨᱟᱱ",
    "mandi": "ᱵᱟᱡᱟᱨ ᱫᱚᱨ",
    "calendar": "ᱥᱟᱨ ᱟᱨ ᱦᱚᱭᱦᱤᱥᱤᱫ",
    "schemes": "ᱥᱚᱨᱠᱟᱨᱤ ᱜᱚᱲᱚ",
    "mitra": "ᱨᱚᱲ ᱢᱮ",
    "profileBtn": "मेरा खेत",
    "listenBtn": "ᱟᱸᱡᱚᱢ ᱢᱮ",
    "stopBtn": "ᱛᱤᱸᱜᱩ",
    "speakAskBtn": "अपनी भाषा में बोलकर पूछें",
    "unitAcre": "एकड़",
    "unitBigha": "बीघा",
    "unitHectare": "हेक्टेयर",
    "per15LPump": "प्रति 15 लीटर पंप मात्रा",
    "guideTitle": "स्वावलंबी कृषि एवं असली खाद-बीज पहचान केंद्र",
    "tabDiyBio": "🌿 घरेलू जैविक नुस्खे",
    "tabPurityTest": "🧪 नकली खाद-बीज परखें",
    "tabClimateRescue": "⛈️ मौसम आपदा बचाव",
    "tabFarmDiary": "📒 निजी खर्च व बचत डायरी",
    "tabFreeHelpline": "📞 निःशुल्क सरकारी वैज्ञानिक",
    "rxNoSellBadge": "निष्पक्ष वैज्ञानिक व प्राकृतिक सलाह (कोई ब्रांड प्रचार नहीं)",
    "rxDiyCtaTitle": "🌿 घर पर स्वयं जैविक घोल बनाएं एवं असली खाद की पहचान करें",
    "rxDiyCtaDesc": "बाजार के महंगे रसायनों से बचें — नीमास्त्र/जीवामृत घर पर बनाएं व 2 मिनट में असली डीएपी/जिंक की जांच करें।",
    "rxDiyCtaBtn": "घरेलू विधि एवं असली खाद पहचान देखें",
    "rxFreeKvkBtn": "निःशुल्क किसान कॉल सेंटर (1800-180-1551)",
    "tileClinicTitle": "घरेलू नुस्खे व परख",
    "tileClinicSub": "जीवामृत • असली खाद जांच",
    "tileKvkTitle": "निःशुल्क KVK मदद",
    "tileKvkSub": "1800-180-1551 (सरकारी)",
    "profileScreenTitle": "मेरा खेत प्रोफाइल एवं निःशुल्क क्लाउड बैकअप",
    "profileScreenSub": "बिना किसी लॉगिन या OTP के सभी सेवाएं खुली हैं! अपनी फसल, राज्य और जमीन की इकाई (एकड़/बीघा) चुनें।",
    "saveProfileBtn": "खेत विवरण सुरक्षित करें",
    "langName": "ᱥᱟᱱᱛᱟᱲᱤ (संताली)",
    "langEnglish": "Santali",
    "region": "झारखंड, ओडिशा व बंगाल",
    "voice": "hi-IN",
    "rtl": false,
    "mlkit": "hi",
    "welcome": "ᱡᱚᱦᱟᱨ ᱪᱟᱹᱥᱤ ᱵᱚᱭᱦᱟ! ᱠᱨᱤᱥᱤ ᱥᱚᱦᱟᱭᱚᱠ ᱫᱚ ᱢᱩᱯᱷᱛ ᱪᱟᱥ ᱫᱤᱥᱟᱹ ᱩᱫᱩᱜ ᱠᱟᱱᱟ।"
  }
};

// Merge into main `localizations` dictionary & extend LANG_VOICE_MAP as soon as app loads
window.KRISHI_LAND_UNIT = localStorage.getItem('krishi_land_unit') || 'ACRE'; // ACRE | BIGHA | HECTARE
window.KRISHI_FONT_SCALE = parseFloat(localStorage.getItem('krishi_font_scale') || '1');

// Conversion factors relative to 1 Acre (Standard Indian average: 1 Hectare = 2.471 Acres, 1 Pucca Bigha ≈ 0.625 Acre -> 1 Acre = 1.6 Bigha)
window.KRISHI_UNIT_FACTORS = {
  ACRE: { factorFromAcre: 1.0, key: 'unitAcre' },
  BIGHA: { factorFromAcre: 1.6, key: 'unitBigha' },
  HECTARE: { factorFromAcre: 0.4047, key: 'unitHectare' }
};

// Persistent client-side translation cache (zero cloud cost for repeated strings)
const TRANSLATION_CACHE_KEY = 'krishi_dynamic_i18n_cache_v2';
let dynamicTranslationCache = {};
try {
  dynamicTranslationCache = JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) || '{}');
} catch (e) {
  dynamicTranslationCache = {};
}

function saveTranslationCache() {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(dynamicTranslationCache));
  } catch (e) {}
}

function gp(key, fallback = '') {
  const lang = window.currentLanguage || localStorage.getItem('agriscan_language') || 'hi';
  const pack = window.KRISHI_GUIDANCE_PACKS[lang] || window.KRISHI_GUIDANCE_PACKS.hi;
  if (pack && pack[key] !== undefined) return pack[key];
  if (typeof localizations !== 'undefined' && localizations[lang] && localizations[lang][key] !== undefined) {
    return localizations[lang][key];
  }
  return (window.KRISHI_GUIDANCE_PACKS.hi && window.KRISHI_GUIDANCE_PACKS.hi[key]) || fallback;
}
window.gp = gp;

// Format acreage into farmer's chosen local land unit (Acre / Bigha / Hectare)
window.formatLandArea = function(acresValue) {
  const unit = window.KRISHI_LAND_UNIT || 'ACRE';
  const cfg = window.KRISHI_UNIT_FACTORS[unit] || window.KRISHI_UNIT_FACTORS.ACRE;
  const converted = (Number(acresValue || 1) * cfg.factorFromAcre).toFixed(1);
  return `${converted} ${gp(cfg.key, 'एकड़')}`;
};

// Calculate per 15-Litre Knapsack Sprayer Pump dose (practical Indian farmer unit)
window.formatKnapsackDose = function(gramsOrMlPerAcre, waterLitresPerAcre = 195) {
  const pumpsPerAcre = Math.max(1, Math.round(waterLitresPerAcre / 15)); // ~13 pumps of 15L per acre
  const perPump = Math.round(Number(gramsOrMlPerAcre) / pumpsPerAcre);
  return `${perPump}g / 15L`;
};

// ============================================================================
// 4-TIER ZERO-COST GOOGLE TRANSLATION PIPELINE FOR DYNAMIC CONTENT
// ============================================================================
window.translateTextBarrierFree = async function(text, targetLang) {
  const lang = targetLang || window.currentLanguage || 'hi';
  if (!text || typeof text !== 'string' || !text.trim()) return text;
  if (lang === 'hi' && /[\u0900-\u097F]/.test(text)) return text;
  if (lang === 'en' && /^[\x00-\x7F\s₹•%0-9.,:;()\-+/*&'"]+$/.test(text)) return text;

  const cacheKey = `${lang}::${text.trim().slice(0, 180)}`;
  if (dynamicTranslationCache[cacheKey]) {
    return dynamicTranslationCache[cacheKey];
  }

  const meta = window.KRISHI_SUPPORTED_LANGUAGES.find(x => x.code === lang) || window.KRISHI_SUPPORTED_LANGUAGES[0];
  const targetIso = meta.mlkit || lang;

  // Tier 1: Android Native Google ML Kit On-Device Translation Bridge (100% Free & Offline)
  if (window.AndroidBridge && typeof window.AndroidBridge.translateOnDevice === 'function') {
    try {
      const mlkitOut = window.AndroidBridge.translateOnDevice(text, 'auto', targetIso);
      if (mlkitOut && mlkitOut !== text) {
        dynamicTranslationCache[cacheKey] = mlkitOut;
        saveTranslationCache();
        return mlkitOut;
      }
    } catch (e) {}
  }

  // Tier 2: Chrome / WebView Built-in W3C On-Device AI Translator API (100% Free & Offline)
  if ('Translator' in self && typeof self.Translator?.create === 'function') {
    try {
      const sourceIso = /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
      if (sourceIso !== targetIso) {
        const translator = await self.Translator.create({
          sourceLanguage: sourceIso,
          targetLanguage: targetIso
        });
        const translated = await translator.translate(text);
        if (translated) {
          dynamicTranslationCache[cacheKey] = translated;
          saveTranslationCache();
          return translated;
        }
      }
    } catch (e) {}
  }

  // Tier 3: Cloud Run Backend (/v1/translate backed by Gemini Flash Free Tier / Cloud Translation Free Tier)
  try {
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
    const res = await fetch(`${apiBase}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: lang, targetLanguageName: meta.english })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.translatedText) {
        dynamicTranslationCache[cacheKey] = data.translatedText;
        saveTranslationCache();
        return data.translatedText;
      }
    }
  } catch (e) {}

  return text;
};

// Automatically translate any elements tagged with [data-auto-translate] when language is non-Hindi/non-English
window.translateVisibleDynamicCards = async function() {
  const lang = window.currentLanguage || 'hi';
  if (lang === 'hi') return; // Default rich agronomic copy is already Hindi; English handled natively or via auto-translate
  const nodes = document.querySelectorAll('[data-translatable="true"]');
  for (const node of nodes) {
    const raw = node.getAttribute('data-orig-text') || node.innerText;
    if (!node.getAttribute('data-orig-text')) {
      node.setAttribute('data-orig-text', raw);
    }
    if (node.getAttribute('data-translated-lang') === lang) continue;
    const out = await window.translateTextBarrierFree(raw, lang);
    if (out && out !== raw) {
      node.innerText = out;
      node.setAttribute('data-translated-lang', lang);
    }
  }
};

// ============================================================================
// UNIVERSAL "BOLO AUR SUNO" AUDIO & ACCESSIBILITY CONTROLS
// ============================================================================
window.speakInFarmerLanguage = function(text, overrideLang) {
  if (!text) return;
  const lang = overrideLang || window.currentLanguage || 'hi';
  const meta = window.KRISHI_SUPPORTED_LANGUAGES.find(x => x.code === lang) || window.KRISHI_SUPPORTED_LANGUAGES[0];

  // Use Native Android TTS if inside Android App
  if (window.AndroidBridge && typeof window.AndroidBridge.speak === 'function') {
    try {
      window.AndroidBridge.speak(text, meta.voice || 'hi-IN');
      return;
    } catch (e) {}
  }

  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = meta.voice || 'hi-IN';
    utterance.rate = 0.92;

    // Pick best matching Indian voice installed on device
    const voices = window.speechSynthesis.getVoices() || [];
    const exactVoice = voices.find(v => v.lang.toLowerCase() === utterance.lang.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()))
      || voices.find(v => v.lang.toLowerCase().includes('-in'));
    if (exactVoice) utterance.voice = exactVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {}
};

window.readCurrentScreenAloud = function() {
  const activeSection = document.querySelector('.screen-view.active');
  if (!activeSection) return;
  const headings = Array.from(activeSection.querySelectorAll('h2, h3, h4, h5, .eco-desc-text, .step-desc, #mitraAnswerText'))
    .slice(0, 6)
    .map(el => el.innerText.trim())
    .filter(Boolean)
    .join('. ');
  window.speakInFarmerLanguage(headings || gp('welcome'));
};

window.cycleFontScale = function() {
  const scales = [1.0, 1.12, 1.24];
  const idx = scales.findIndex(s => Math.abs(s - window.KRISHI_FONT_SCALE) < 0.04);
  const next = scales[(idx + 1) % scales.length];
  window.KRISHI_FONT_SCALE = next;
  localStorage.setItem('krishi_font_scale', String(next));
  document.documentElement.style.fontSize = `${Math.round(next * 100)}%`;
  const lbl = document.getElementById('fontScaleBtnLabel');
  if (lbl) lbl.innerText = next > 1.2 ? 'अ++' : next > 1.05 ? 'अ+' : 'अ';
};

window.cycleLandUnit = function() {
  const order = ['ACRE', 'BIGHA', 'HECTARE'];
  const next = order[(order.indexOf(window.KRISHI_LAND_UNIT) + 1) % order.length];
  window.KRISHI_LAND_UNIT = next;
  localStorage.setItem('krishi_land_unit', next);
  const badge = document.getElementById('landUnitBtnLabel');
  if (badge) badge.innerText = gp(window.KRISHI_UNIT_FACTORS[next].key, next);
  if (typeof updateAcreage === 'function') {
    const sl = document.getElementById('acreageSlider');
    if (sl) updateAcreage(sl.value);
  }
  if (typeof onNpkAcreInput === 'function') {
    const nsl = document.getElementById('npkAcreSlider');
    if (nsl) onNpkAcreInput(nsl.value);
  }
};

// Render all 22 languages inside #langGrid22 with audio preview button
window.render22LanguageGrid = function() {
  const grid = document.getElementById('langGrid22');
  if (!grid) return;
  const active = window.currentLanguage || localStorage.getItem('agriscan_language') || 'hi';

  grid.innerHTML = window.KRISHI_SUPPORTED_LANGUAGES.map(item => {
    const isActive = item.code === active;
    return `
      <div class="lang-option ${isActive ? 'active' : ''}" onclick="selectPhoneLanguage('${item.code}')">
        <div class="lang-opt-main">
          <span class="lang-native">${item.native}</span>
          <span class="lang-sub">${item.english} • ${item.region}</span>
        </div>
        <button type="button" class="lang-audio-preview-btn" onclick="event.stopPropagation(); window.speakInFarmerLanguage('${item.welcome.replace(/'/g, '')}', '${item.code}')" title="सुनें / Listen">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      </div>
    `;
  }).join('');
};

// Hydrate localizations & LANG_VOICE_MAP for all 22 languages so legacy + new screens seamlessly share state
window.hydrate22Localizations = function() {
  if (typeof localizations !== 'undefined') {
    window.KRISHI_SUPPORTED_LANGUAGES.forEach(meta => {
      const baseFallback = meta.code === 'en' ? (localizations.en || {}) : (localizations.hi || {});
      const existing = localizations[meta.code] || {};
      const pack = window.KRISHI_GUIDANCE_PACKS[meta.code] || {};
      localizations[meta.code] = Object.assign({}, baseFallback, existing, pack, {
        langName: meta.native,
        clinic: pack.selfReliant || existing.clinic,
        quickShop: pack.tileClinicTitle || existing.quickShop,
        quickShopSub: pack.tileClinicSub || existing.quickShopSub,
        quickCall: pack.tileKvkTitle || existing.quickCall,
        quickCallSub: pack.tileKvkSub || existing.quickCallSub,
        clinicTitleText: pack.guideTitle || existing.clinicTitleText,
        gradKitBadge: pack.rxNoSellBadge || existing.gradKitBadge,
        gradKitTitle: pack.rxDiyCtaTitle || existing.gradKitTitle,
        gradKitDesc: pack.rxDiyCtaDesc || existing.gradKitDesc,
        gradKitOrderBtn: pack.rxDiyCtaBtn || existing.gradKitOrderBtn,
        orderBtn: pack.rxFreeKvkBtn || existing.orderBtn
      });
    });
  }
  if (typeof LANG_VOICE_MAP !== 'undefined') {
    window.KRISHI_SUPPORTED_LANGUAGES.forEach(meta => {
      LANG_VOICE_MAP[meta.code] = meta.voice;
    });
  }
};
