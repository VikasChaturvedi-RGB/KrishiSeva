// ============================================================================
// MRIDAK (मृदक) — CUSTOMER MOBILE + DOB AUTHENTICATION, UNIFIED REGIONAL CONTEXT
// & GOOGLE CLOUD FREE SYNC
// Supports 1,000 to 50,000+ Self-Registering Customers at ₹0 Cost:
//   1. Firebase Authentication (Email/Password mapping <mobile>@auth.mridak.com: 50,000 MAU Free, 0 SMS fees)
//   2. Cloud Firestore Per-Customer Profile Sync (/farmers/{uid} with strict owner isolation)
//   3. Cloud Run / Backend PBKDF2-SHA512 + 365-Day Persistent JWT (/v1/auth/mobile-dob)
//   4. Unified 8-Region Farmer Context (State + Crop + Acreage + Soil + Mandis + KVK wired hand-in-hand)
// ============================================================================

const MRIDAK_SESSION_KEY = 'mridak_customer_session_v1';
const MRIDAK_DEVICE_VAULT_KEY = 'mridak_device_accounts_v1';

window.MRIDAK_CROP_META = {
  WHEAT: { hi: 'गेहूँ', fullHi: 'गेहूँ (HD-2967 / शरबती)', en: 'Wheat', icon: '🌾', step1ShortHi: 'जिंक सल्फेट + यूरिया पर्णीय स्प्रे' },
  PADDY: { hi: 'धान', fullHi: 'धान (सांभा मंसूरी / PR-126)', en: 'Paddy (Rice)', icon: '🌿', step1ShortHi: 'जिंक सल्फेट 21% (खैरा बचाव)' },
  SOYBEAN: { hi: 'सोयाबीन', fullHi: 'सोयाबीन (JS 20-34)', en: 'Soybean', icon: '🌱', step1ShortHi: 'चिलेटेड जिंक 12% स्प्रे' },
  POTATO: { hi: 'आलू', fullHi: 'आलू (कुफरी ज्योति / 3797)', en: 'Potato', icon: '🥔', step1ShortHi: 'पोटाश 00:00:50 + ट्राइकोडर्मा' },
  SUGARCANE: { hi: 'गन्ना', fullHi: 'गन्ना (Co-0238)', en: 'Sugarcane', icon: '🎋', step1ShortHi: 'फेरस + जिंक सूक्ष्म पोषण' },
  MAIZE: { hi: 'मक्का', fullHi: 'मक्का (हाइब्रिड येलो)', en: 'Maize', icon: '🌽', step1ShortHi: 'जिंक सल्फेट + नीम सत्व' },
  COTTON: { hi: 'कपास', fullHi: 'कपास (Bt Cotton)', en: 'Cotton', icon: '☁️', step1ShortHi: 'मैग्नीशियम सल्फेट 1% स्प्रे' },
  BANANA: { hi: 'केला', fullHi: 'केला (G-9 / चिनिया)', en: 'Banana', icon: '🍌', step1ShortHi: 'पोटेशियम + चिलेटेड जिंक' },
  TOMATO: { hi: 'टमाटर', fullHi: 'टमाटर (हाइब्रिड)', en: 'Tomato', icon: '🍅', step1ShortHi: 'कैल्शियम नाइट्रेट + बोरॉन' },
  CHILLI: { hi: 'मिर्च', fullHi: 'लाल मिर्च (तेजा हाइब्रिड)', en: 'Chilli', icon: '🌶️', step1ShortHi: 'नीला ट्रैप + सूक्ष्म पोषण' }
};

window.MRIDAK_REGIONS = {
  UP_BR: {
    stateCode: 'UP_BR',
    uiValue: 'Uttar Pradesh & Bihar',
    labelHi: 'उत्तर प्रदेश एवं बिहार',
    labelEn: 'Uttar Pradesh & Bihar',
    hubHi: 'कानपुर / वाराणसी / पटना',
    hubEn: 'Kanpur / Varanasi / Patna',
    sampleVillageHi: 'चिरईगाँव / बिहटा (उ.प्र.-बिहार)',
    defaultCrop: 'WHEAT',
    defaultCrops: ['WHEAT', 'PADDY', 'POTATO'],
    soil: {
      typeHi: 'गंगा-यमुना जलोढ़ दोमट मिट्टी (Gangetic Alluvial Loam)',
      typeEn: 'Indo-Gangetic Alluvial Loam',
      ph: 7.3,
      phStatusHi: 'सामान्य (Neutral pH 7.3)',
      n: 215,
      p: 19,
      k: 265,
      zn: 0.51,
      znStatusHi: 'जिंक न्यून (0.51 ppm)',
      irrigationHi: 'निःशुल्क निजी नलकूप (ट्यूबवेल) + नहर सिंचाई'
    },
    kvk: {
      drHi: 'डॉ. राजेश कुमार त्रिपाठी (वरिष्ठ पादप रोग वैज्ञानिक)',
      kvkHi: 'ICAR-IIPR कानपुर / BHU वाराणसी / RPCAU पूसा (उ.प्र.-बिहार)'
    },
    bannedChemHi: 'मोनोक्रोटोफॉस (सब्जियों पर प्रतिबंधित), एंडोसल्फान, कार्बोफ्यूरान 50% SP',
    offlineMandis: [
      { mandi_name: 'Kanpur Chakeri APMC Mandi (e-NAM, उ.प्र.)', crop_code: 'WHEAT', crop_name_hi: 'गेहूँ (HD-2967 / DBW-187)', crop_name_en: 'Wheat (HD-2967)', modal_price_qtl: 2685, msp_price_qtl: 2425, price_change_24h: 65, distance_km: 14, arrival_tonnes: 1340, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'कानपुर आटा मिलों की मांग से गेहूँ MSP (₹2,425) से ₹260 ऊपर है। <12% नमी पर बेचें।', advisory_en: 'Kanpur flour mill demand keeping wheat ₹260/qtl above MSP.' },
      { mandi_name: 'Varanasi Paharia e-NAM Mandi (उ.प्र.)', crop_code: 'PADDY', crop_name_hi: 'धान (सांभा मंसूरी / BPT-5204)', crop_name_en: 'Paddy (Samba Mahsuri)', modal_price_qtl: 2590, msp_price_qtl: 2320, price_change_24h: 55, distance_km: 18, arrival_tonnes: 1180, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'वाराणसी पहड़िया मंडी में महीन धान MSP से ₹270/क्विंटल ऊपर बिक रहा है।', advisory_en: 'Fine paddy trading ₹270/qtl above MSP in Varanasi Paharia Mandi.' },
      { mandi_name: 'Agra Sikandra APMC Yard (उ.प्र.)', crop_code: 'POTATO', crop_name_hi: 'आलू (कुफरी बहार 3797)', crop_name_en: 'Potato (Kufri 3797)', modal_price_qtl: 1780, msp_price_qtl: 1250, price_change_24h: 70, distance_km: 16, arrival_tonnes: 910, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'आगरा-कन्नौज पट्टी में कोल्ड स्टोरेज आलू पर मजबूत भाव मिल रहा है।', advisory_en: 'Strong cold-storage table potato rates in Agra belt.' },
      { mandi_name: 'Gulabbagh Purnea Maize Market (बिहार)', crop_code: 'MAIZE', crop_name_hi: 'मक्का (सीमांचल रबी हाइब्रिड)', crop_name_en: 'Maize (Rabi Hybrid)', modal_price_qtl: 2490, msp_price_qtl: 2225, price_change_24h: 75, distance_km: 19, arrival_tonnes: 2240, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'पूर्णिया गुलाबबाग मंडी में एथेनॉल मांग से मक्का MSP से ₹265 ऊपर है।', advisory_en: 'Ethanol demand lifting Purnea maize ₹265/qtl over MSP.' },
      { mandi_name: 'Bihta & Musallahpur Bazar Samiti, Patna (बिहार)', crop_code: 'PADDY', crop_name_hi: 'धान (सोनम / राजेंद्र मंसूरी)', crop_name_en: 'Paddy (Sonam)', modal_price_qtl: 2530, msp_price_qtl: 2320, price_change_24h: 50, distance_km: 15, arrival_tonnes: 1090, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'पटना-बिहटा मंडी में साफ धान पर MSP से ₹210/क्विंटल अधिक मिल रहा है।', advisory_en: 'Patna rice mills offering ₹210/qtl above MSP.' },
      { mandi_name: 'Muzaffarnagar Naveen Gur & Cane e-NAM (उ.प्र.)', crop_code: 'SUGARCANE', crop_name_hi: 'गन्ना / गुड़ (Co-0238)', crop_name_en: 'Sugarcane / Gur', modal_price_qtl: 4120, msp_price_qtl: 3700, price_change_24h: 90, distance_km: 26, arrival_tonnes: 1650, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'मुजफ्फरनगर मंडी में सुनहरे गुड़ का भाव ₹4,120/क्विंटल व गन्ना SAP भुगतान सक्रिय।', advisory_en: 'Strong festive jaggery rates in Muzaffarnagar e-NAM.' }
    ],
    offlineOutbreak: { district: 'वाराणसी व पटना पट्टी', village: 'चिरईगाँव व बिहटा क्लस्टर', disease_name_hi: 'धान शीथ झुलसा व आलू पछेती झुलसा निगरानी', affected_farms_count: 29, distance_km: 5.4, severity: 'HIGH_ALERT', preventive_step_hi: 'खेत से अतिरिक्त पानी निकालें, यूरिया रोकें और नीमास्त्र 3ml/L + पोटाश 00:00:50 @ 5g/L छिड़कें।' }
  },
  MP: {
    stateCode: 'MP',
    uiValue: 'Madhya Pradesh',
    labelHi: 'मध्य प्रदेश',
    labelEn: 'Madhya Pradesh',
    hubHi: 'इंदौर / उज्जैन / सीहोर',
    hubEn: 'Indore / Ujjain / Sehore',
    sampleVillageHi: 'बड़नगर / धरमपुरी (म.प्र.)',
    defaultCrop: 'SOYBEAN',
    defaultCrops: ['SOYBEAN', 'WHEAT'],
    soil: {
      typeHi: 'काली चिकनी मिट्टी (Deep Black Vertisol)',
      typeEn: 'Deep Black Vertisol',
      ph: 7.7,
      phStatusHi: 'हल्की क्षारीय (pH 7.7)',
      n: 195,
      p: 22,
      k: 340,
      zn: 0.45,
      znStatusHi: 'जिंक की कमी (0.45 ppm)',
      irrigationHi: 'ट्यूबवेल + स्प्रिंकलर / ड्रिप'
    },
    kvk: {
      drHi: 'डॉ. सुरेश वर्मा (वरिष्ठ कृषि वैज्ञानिक)',
      kvkHi: 'ICAR-IISR इंदौर / RVSKVV KVK उज्जैन (म.प्र.)'
    },
    bannedChemHi: 'मोनोक्रोटोफॉस (सब्जियों पर), एंडोसल्फान, मिथाइल पैराथियान',
    offlineMandis: [
      { mandi_name: 'Indore Chhavani APMC Mandi (e-NAM, म.प्र.)', crop_code: 'SOYBEAN', crop_name_hi: 'सोयाबीन (JS 20-34)', crop_name_en: 'Soybean (JS 20-34)', modal_price_qtl: 5240, msp_price_qtl: 4892, price_change_24h: 115, distance_km: 24, arrival_tonnes: 1120, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'इंदौर मंडी में सोयाबीन MSP से ₹348 ऊपर है। <10% नमी पर बेचें।', advisory_en: 'Indore soybean trading ₹348/qtl above MSP.' },
      { mandi_name: 'Sehore Krishi Upaj Mandi (म.प्र.)', crop_code: 'WHEAT', crop_name_hi: 'गेहूँ (शरबती / HI-1544)', crop_name_en: 'Wheat (MP Sharbati)', modal_price_qtl: 3180, msp_price_qtl: 2425, price_change_24h: 95, distance_km: 35, arrival_tonnes: 530, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'सीहोर शरबती गेहूँ MSP से ₹755/क्विंटल ऊपर चल रहा है।', advisory_en: 'MP Sharbati trading ₹755/qtl above MSP.' }
    ],
    offlineOutbreak: { district: 'उज्जैन', village: 'बड़नगर क्लस्टर', disease_name_hi: 'सोयाबीन गेरूई एवं पीला मोज़ेक अलर्ट', affected_farms_count: 38, distance_km: 4.2, severity: 'HIGH_ALERT', preventive_step_hi: 'पोटेशियम सिलिकेट 2 मिली/लीटर + घुलनशील पोटाश 5 ग्राम/लीटर छिड़कें और 10 पीले ट्रैप लगाएं।' }
  },
  PB_HR: {
    stateCode: 'PB_HR',
    uiValue: 'Punjab & Haryana',
    labelHi: 'पंजाब एवं हरियाणा',
    labelEn: 'Punjab & Haryana',
    hubHi: 'लुधियाना / करनाल',
    hubEn: 'Ludhiana / Karnal',
    sampleVillageHi: 'खन्ना / समराला (पंजाब-हरियाणा)',
    defaultCrop: 'PADDY',
    defaultCrops: ['PADDY', 'WHEAT'],
    soil: {
      typeHi: 'सिंचित जलोढ़ दोमट मिट्टी (Trans-Gangetic Alluvial)',
      typeEn: 'Irrigated Alluvial Sandy Loam',
      ph: 7.9,
      phStatusHi: 'हल्की क्षारीय (pH 7.9)',
      n: 180,
      p: 24,
      k: 290,
      zn: 0.48,
      znStatusHi: 'जिंक व कार्बन न्यून (0.48 ppm)',
      irrigationHi: 'नहर + सबमर्सिबल ट्यूबवेल (DSR जल बचत)'
    },
    kvk: {
      drHi: 'डॉ. हरप्रीत सिंह गिल (वरिष्ठ शस्य वैज्ञानिक)',
      kvkHi: 'PAU लुधियाना / ICAR-IIWBR करनाल KVK'
    },
    bannedChemHi: 'बासमती में 10 रसायन प्रतिबंधित: ट्राईसाइक्लाजोल, बुप्रोफेज़िन, एसीफेट, क्लोरोपायरीफॉस, थायमेथॉक्सम, कार्बेन्डाजिम',
    offlineMandis: [
      { mandi_name: 'Khanna Grain Market APMC (पंजाब)', crop_code: 'PADDY', crop_name_hi: 'धान (PR-126 / बासमती)', crop_name_en: 'Paddy (PR-126 / Basmati)', modal_price_qtl: 2890, msp_price_qtl: 2320, price_change_24h: 65, distance_km: 18, arrival_tonnes: 2150, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'खन्ना मंडी में निर्यात मांग से धान MSP से ₹570 ऊपर है।', advisory_en: 'Export demand lifting Khanna paddy ₹570/qtl over MSP.' },
      { mandi_name: 'Karnal New Grain Market e-NAM (हरियाणा)', crop_code: 'WHEAT', crop_name_hi: 'गेहूँ (DBW-303 / HD-3086)', crop_name_en: 'Wheat (DBW-303)', modal_price_qtl: 2710, msp_price_qtl: 2425, price_change_24h: 60, distance_km: 16, arrival_tonnes: 1580, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'करनाल अनाज मंडी में गेहूँ MSP से ₹285/क्विंटल ऊपर है।', advisory_en: 'Karnal wheat trading ₹285/qtl above MSP.' }
    ],
    offlineOutbreak: { district: 'लुधियाना', village: 'खन्ना व समराला ब्लॉक', disease_name_hi: 'धान गर्दन तोड़ झुलसा (Blast) व खैरा रोग', affected_farms_count: 31, distance_km: 11.8, severity: 'HIGH_ALERT', preventive_step_hi: 'यूरिया तुरंत रोकें! ऑर्थो-सिलिकिक एसिड 2ml/L + जिंक सल्फेट 2.5g/L का बायो-स्प्रे करें।' }
  },
  MH: {
    stateCode: 'MH',
    uiValue: 'Maharashtra',
    labelHi: 'महाराष्ट्र',
    labelEn: 'Maharashtra',
    hubHi: 'अकोला / जलगाँव / लातूर',
    hubEn: 'Akola / Jalgaon / Latur',
    sampleVillageHi: 'रावेर / अकोला (महाराष्ट्र)',
    defaultCrop: 'COTTON',
    defaultCrops: ['COTTON', 'SOYBEAN', 'BANANA'],
    soil: {
      typeHi: 'दक्कन काली बेसाल्ट मिट्टी (Medium-Deep Black Regur)',
      typeEn: 'Deccan Black Regur Soil',
      ph: 7.8,
      phStatusHi: 'क्षारीय काली मृदा (pH 7.8)',
      n: 190,
      p: 18,
      k: 360,
      zn: 0.46,
      znStatusHi: 'जिंक व मैग्नीशियम न्यून (0.46 ppm)',
      irrigationHi: 'ड्रिप सिंचाई + शेततळे (खेत तालाब)'
    },
    kvk: {
      drHi: 'डॉ. अनिल देशमुख (वरिष्ठ कीट एवं उद्यानिकी वैज्ञानिक)',
      kvkHi: 'PDKV अकोला / MPKV राहुरी / KVK जलगाँव'
    },
    bannedChemHi: 'मोनोक्रोटोफॉस, प्रोफेनोफॉस+साइपरमेथ्रिन अनधिकृत मिश्रण, फिप्रोनिल (बिना सुरक्षा किट)',
    offlineMandis: [
      { mandi_name: 'Akola Cotton APMC Yard (महाराष्ट्र)', crop_code: 'COTTON', crop_name_hi: 'कपास (Long Staple)', crop_name_en: 'Cotton (Long Staple)', modal_price_qtl: 7680, msp_price_qtl: 7521, price_change_24h: 45, distance_km: 24, arrival_tonnes: 620, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'अकोला मंडी में साफ सूखे कपास का भाव MSP से ऊपर है।', advisory_en: 'Akola cotton trading above CCI MSP.' },
      { mandi_name: 'Latur APMC e-NAM Oilseed Hub (महाराष्ट्र)', crop_code: 'SOYBEAN', crop_name_hi: 'सोयाबीन (MAUS-158)', crop_name_en: 'Soybean (MAUS-158)', modal_price_qtl: 5190, msp_price_qtl: 4892, price_change_24h: 95, distance_km: 19, arrival_tonnes: 1490, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'लातूर मंडी में सोयाबीन MSP से ₹298/क्विंटल ऊपर है।', advisory_en: 'Latur soybean trading ₹298/qtl above MSP.' },
      { mandi_name: 'Jalgaon Raver Banana e-NAM Hub (महाराष्ट्र)', crop_code: 'BANANA', crop_name_hi: 'केला (Grand Naine G-9)', crop_name_en: 'Banana (G-9)', modal_price_qtl: 1920, msp_price_qtl: 1600, price_change_24h: 110, distance_km: 22, arrival_tonnes: 490, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'जलगाँव रावेर मंडी से उत्तर भारत लदान तेज है।', advisory_en: 'Strong North India dispatch from Jalgaon.' }
    ],
    offlineOutbreak: { district: 'जलगाँव व अकोला', village: 'रावेर एवं बार्शीटाकली', disease_name_hi: 'केला सिगाटोका धब्बा एवं कपास गुलाबी सुंडी निगरानी', affected_farms_count: 19, distance_km: 14.0, severity: 'MODERATE_WATCH', preventive_step_hi: 'नीचे की धब्बेदार पत्तियां हटाएं व 8 फेरोमोन ट्रैप/एकड़ लगाएं।' }
  },
  SOUTH: {
    stateCode: 'SOUTH',
    uiValue: 'Andhra, Telangana & Karnataka',
    labelHi: 'आंध्र, तेलंगाना व कर्नाटक',
    labelEn: 'Andhra, Telangana & Karnataka',
    hubHi: 'गुंटूर / वारंगल / कोलार',
    hubEn: 'Guntur / Warangal / Kolar',
    sampleVillageHi: 'गुंटूर / वारंगल क्लस्टर',
    defaultCrop: 'CHILLI',
    defaultCrops: ['CHILLI', 'PADDY', 'TOMATO'],
    soil: {
      typeHi: 'लाल दोमट एवं काली मिट्टी (Red Alfisol & Vertisol)',
      typeEn: 'Red Alfisol & Black Soil',
      ph: 6.8,
      phStatusHi: 'उत्तम संतुलित (pH 6.8)',
      n: 210,
      p: 21,
      k: 275,
      zn: 0.52,
      znStatusHi: 'बोरॉन व जिंक न्यून (0.52 ppm)',
      irrigationHi: 'बोरवेल + माइक्रो ड्रिप फर्टिगेशन'
    },
    kvk: {
      drHi: 'डॉ. वेंकटेश्वर राव (वरिष्ठ उद्यानिकी वैज्ञानिक)',
      kvkHi: 'ANGRAU गुंटूर / PJTSAU वारंगल / ICAR-IIHR बेंगलुरु'
    },
    bannedChemHi: 'क्लोरोपायरीफॉस (निर्यात मिर्च पर), मोनोक्रोटोफॉस, ट्राइजोफॉस (EU MRL अलर्ट)',
    offlineMandis: [
      { mandi_name: 'Guntur Mirchi Yard e-NAM (आंध्र प्रदेश)', crop_code: 'CHILLI', crop_name_hi: 'लाल मिर्च (तेजा S-17)', crop_name_en: 'Chilli (Teja S-17)', modal_price_qtl: 17400, msp_price_qtl: 13500, price_change_24h: 350, distance_km: 20, arrival_tonnes: 710, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'गुंटूर मिर्ची यार्ड में निर्यात मांग से लाल मिर्च ₹17,400/क्विंटल है।', advisory_en: 'Strong export demand at Guntur Mirchi Yard.' },
      { mandi_name: 'Kolar APMC Tomato Market (कर्नाटक)', crop_code: 'TOMATO', crop_name_hi: 'टमाटर (अर्का रक्षक)', crop_name_en: 'Tomato (Arka Rakshak)', modal_price_qtl: 2650, msp_price_qtl: 1500, price_change_24h: 240, distance_km: 19, arrival_tonnes: 390, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'कोलार मंडी में टमाटर का भाव मजबूत चल रहा है।', advisory_en: 'Firm prices at Kolar APMC Tomato Market.' },
      { mandi_name: 'Raichur APMC Rice Market (कर्नाटक)', crop_code: 'PADDY', crop_name_hi: 'धान (सोना मसूरी)', crop_name_en: 'Paddy (Sona Masuri)', modal_price_qtl: 2760, msp_price_qtl: 2320, price_change_24h: 65, distance_km: 24, arrival_tonnes: 1340, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'रायचूर में सोना मसूरी धान MSP से ₹440 ऊपर है।', advisory_en: 'Sona Masuri trading ₹440/qtl over MSP.' }
    ],
    offlineOutbreak: { district: 'गुंटूर व वारंगल', village: 'प्रथिपाडु मिर्च क्लस्टर', disease_name_hi: 'मिर्च में ब्लैक थ्रिप्स व पत्ती मरोड़ अलर्ट', affected_farms_count: 33, distance_km: 6.2, severity: 'HIGH_ALERT', preventive_step_hi: '20 नीले चिपचिपे ट्रैप/एकड़ लगाएं तथा ब्यूवेरिया बेसियाना 5g/L + नीम तेल छिड़कें।' }
  },
  GJ_RJ: {
    stateCode: 'GJ_RJ',
    uiValue: 'Gujarat & Rajasthan',
    labelHi: 'गुजरात एवं राजस्थान',
    labelEn: 'Gujarat & Rajasthan',
    hubHi: 'राजकोट / डीसा / कोटा',
    hubEn: 'Rajkot / Deesa / Kota',
    sampleVillageHi: 'गोंडल / लाडपुरा (गुजरात-राजस्थान)',
    defaultCrop: 'COTTON',
    defaultCrops: ['COTTON', 'WHEAT', 'POTATO'],
    soil: {
      typeHi: 'रेतीली दोमट एवं मध्यम काली मिट्टी (Arid Sandy Loam)',
      typeEn: 'Arid Sandy Loam & Black Soil',
      ph: 8.0,
      phStatusHi: 'क्षारीय मृदा (pH 8.0)',
      n: 170,
      p: 20,
      k: 310,
      zn: 0.43,
      znStatusHi: 'सल्फर व जिंक न्यून (0.43 ppm)',
      irrigationHi: 'सोलर पंप + फव्वारा (Sprinkler) व ड्रिप'
    },
    kvk: {
      drHi: 'डॉ. भरत भाई पटेल (वरिष्ठ शुष्क कृषि वैज्ञानिक)',
      kvkHi: 'JAU जूनागढ़-राजकोट / ICAR-CAZRI जोधपुर KVK'
    },
    bannedChemHi: 'जीरा/मसाला निर्यात पर क्लोरोपायरीफॉस व प्रोफेनोफॉस वर्जित (IPM बायो-प्रोटोकॉल अनिवार्य)',
    offlineMandis: [
      { mandi_name: 'Gondal Rajkot APMC Yard (गुजरात)', crop_code: 'COTTON', crop_name_hi: 'कपास (शंकर-6)', crop_name_en: 'Cotton (Shankar-6)', modal_price_qtl: 7920, msp_price_qtl: 7521, price_change_24h: 110, distance_km: 18, arrival_tonnes: 1410, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'गोंडल (राजकोट) मंडी में शंकर-6 कपास MSP से ₹399 ऊपर है।', advisory_en: 'Shankar-6 cotton ₹399/qtl above MSP in Gondal.' },
      { mandi_name: 'Kota Bhamashah APMC e-NAM (राजस्थान)', crop_code: 'WHEAT', crop_name_hi: 'गेहूँ (राज-4079)', crop_name_en: 'Wheat (Raj-4079)', modal_price_qtl: 2740, msp_price_qtl: 2425, price_change_24h: 70, distance_km: 20, arrival_tonnes: 1260, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'कोटा भामाशाह मंडी में गेहूँ MSP से ₹315 ऊपर है।', advisory_en: 'Kota wheat trading ₹315/qtl over MSP.' }
    ],
    offlineOutbreak: { district: 'राजकोट व कोटा', village: 'गोंडल क्लस्टर', disease_name_hi: 'कपास सफेद मक्खी व सफेद लट निगरानी', affected_farms_count: 22, distance_km: 7.8, severity: 'MODERATE_WATCH', preventive_step_hi: 'मेटाराइजियम 2kg/एकड़ गोबर खाद के साथ जड़ों में दें और 12 पीले ट्रैप लगाएं।' }
  },
  EAST: {
    stateCode: 'EAST',
    uiValue: 'West Bengal, Odisha & Assam',
    labelHi: 'बंगाल, ओडिशा व असम',
    labelEn: 'West Bengal, Odisha & Assam',
    hubHi: 'बर्दवान / हुगली / कटक',
    hubEn: 'Burdwan / Hooghly / Cuttack',
    sampleVillageHi: 'मेमारी / कटक क्लस्टर',
    defaultCrop: 'PADDY',
    defaultCrops: ['PADDY', 'POTATO'],
    soil: {
      typeHi: 'अम्लीय जलोढ़ एवं लेटराइट मिट्टी (Acidic Alluvial)',
      typeEn: 'Humid Acidic Alluvial Soil',
      ph: 5.6,
      phStatusHi: 'अम्लीय मृदा (pH 5.6 — चूना सुधार उपयोगी)',
      n: 245,
      p: 15,
      k: 220,
      zn: 0.54,
      znStatusHi: 'बोरॉन व जिंक न्यून (0.54 ppm)',
      irrigationHi: 'वर्षा आधारित + उथले नलकूप'
    },
    kvk: {
      drHi: 'डॉ. सुब्रत चटर्जी (वरिष्ठ धान एवं आलू विशेषज्ञ)',
      kvkHi: 'ICAR-NRRI कटक / BCKV कल्याणी / AAU जोरहाट'
    },
    bannedChemHi: 'चाय/सब्जी पट्टी में मोनोक्रोटोफॉस, फोरेट एवं एंडोसल्फान पूर्णतः प्रतिबंधित',
    offlineMandis: [
      { mandi_name: 'Burdwan e-NAM Regulated Rice Yard (प. बंगाल)', crop_code: 'PADDY', crop_name_hi: 'धान (स्वर्णा / मिनीकिट)', crop_name_en: 'Paddy (Swarna / Minikit)', modal_price_qtl: 2560, msp_price_qtl: 2320, price_change_24h: 55, distance_km: 15, arrival_tonnes: 1620, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'बर्दवान मंडी में धान MSP से ₹240 ऊपर है।', advisory_en: 'Burdwan paddy trading ₹240/qtl above MSP.' },
      { mandi_name: 'Tarakeswar Hooghly Regulated Mandi (प. बंगाल)', crop_code: 'POTATO', crop_name_hi: 'आलू (कुफरी ज्योति)', crop_name_en: 'Potato (Kufri Jyoti)', modal_price_qtl: 1890, msp_price_qtl: 1250, price_change_24h: 80, distance_km: 19, arrival_tonnes: 1140, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'हुगली मंडी में ज्योति आलू ₹1,890/क्विंटल पर मजबूत है।', advisory_en: 'Strong interstate demand for Hooghly potato.' }
    ],
    offlineOutbreak: { district: 'बर्दवान व कटक', village: 'मेमारी क्लस्टर', disease_name_hi: 'धान पीला तना छेदक व आलू झुलसा चेतावनी', affected_farms_count: 25, distance_km: 6.9, severity: 'HIGH_ALERT', preventive_step_hi: '8 फेरोमोन ट्रैप/एकड़ एवं ट्राइकोग्रामा कार्ड लगाएं।' }
  },
  HILLS: {
    stateCode: 'HILLS',
    uiValue: 'Kerala & Himachal',
    labelHi: 'केरल एवं हिमाचल प्रदेश',
    labelEn: 'Kerala & Himachal',
    hubHi: 'सोलन / शिमला / त्रिशूर',
    hubEn: 'Solan / Shimla / Thrissur',
    sampleVillageHi: 'कंडाघाट / वायनाड क्लस्टर',
    defaultCrop: 'TOMATO',
    defaultCrops: ['TOMATO', 'BANANA', 'POTATO'],
    soil: {
      typeHi: 'पर्वतीय ह्यूमस एवं लेटराइट मिट्टी (Hill Loam & Laterite)',
      typeEn: 'Mountain Loam & Coastal Laterite',
      ph: 5.5,
      phStatusHi: 'अम्लीय पर्वतीय (pH 5.5)',
      n: 280,
      p: 17,
      k: 210,
      zn: 0.56,
      znStatusHi: 'कैल्शियम व बोरॉन न्यून (0.56 ppm)',
      irrigationHi: 'गुरुत्व स्प्रिंकलर / वर्षा जल संचयन'
    },
    kvk: {
      drHi: 'डॉ. विक्रम ठाकुर / डॉ. राजीव नायर (उद्यानिकी वैज्ञानिक)',
      kvkHi: 'YSPUHF नौणी सोलन (हिमाचल) / KAU त्रिशूर (केरल)'
    },
    bannedChemHi: 'केरल राज्य में क्लोरोपायरीफॉस, प्रोफेनोफॉस, इमिडाक्लोप्रिड (मसालों पर) व ग्लाइफोसेट प्रतिबंधित',
    offlineMandis: [
      { mandi_name: 'Solan APMC Terminal Market (हिमाचल प्रदेश)', crop_code: 'TOMATO', crop_name_hi: 'टमाटर (सोलन रेड गोल्ड)', crop_name_en: 'Tomato (Solan Red Gold)', modal_price_qtl: 2940, msp_price_qtl: 1500, price_change_24h: 185, distance_km: 14, arrival_tonnes: 520, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'सोलन APMC मंडी में पहाड़ी टमाटर को ₹2,940/क्विंटल का उच्च भाव मिल रहा है।', advisory_en: 'Premium off-season tomato rate in Solan APMC.' },
      { mandi_name: 'Thrissur & Wayanad VFPCK Market (केरल)', crop_code: 'BANANA', crop_name_hi: 'केला (नेन्द्रन केरल)', crop_name_en: 'Banana (Nendran)', modal_price_qtl: 4150, msp_price_qtl: 3000, price_change_24h: 140, distance_km: 17, arrival_tonnes: 410, sell_hold_signal: 'STRONG_SELL', advisory_hi: 'केरल त्रिशूर मंडी में नेन्द्रन केले का भाव ₹4,150/क्विंटल मजबूत है।', advisory_en: 'Strong Nendran banana price in Thrissur.' }
    ],
    offlineOutbreak: { district: 'सोलन व वायनाड', village: 'कंडाघाट क्लस्टर', disease_name_hi: 'टमाटर फल सड़न व केला प्रकंद गलन निगरानी', affected_farms_count: 16, distance_km: 8.1, severity: 'MODERATE_WATCH', preventive_step_hi: 'पौधों को जमीन से 20 सेमी ऊपर सहारा दें और ट्राइकोडर्मा 5g/L का ड्रेंच करें।' }
  }
};

window.resolveMridakRegion = function(stateInput) {
  const s = String(stateInput || '').trim().toLowerCase();
  if (!s) return window.MRIDAK_REGIONS.MP;
  if (s.includes('uttar') || s.includes('bihar') || s === 'up_br' || s === 'up' || s === 'br') return window.MRIDAK_REGIONS.UP_BR;
  if (s.includes('punjab') || s.includes('haryana') || s === 'pb_hr') return window.MRIDAK_REGIONS.PB_HR;
  if (s.includes('maharashtra') || s === 'mh') return window.MRIDAK_REGIONS.MH;
  if (s.includes('andhra') || s.includes('telangana') || s.includes('karnataka') || s === 'south') return window.MRIDAK_REGIONS.SOUTH;
  if (s.includes('gujarat') || s.includes('rajasthan') || s === 'gj_rj') return window.MRIDAK_REGIONS.GJ_RJ;
  if (s.includes('bengal') || s.includes('odisha') || s.includes('assam') || s === 'east') return window.MRIDAK_REGIONS.EAST;
  if (s.includes('kerala') || s.includes('himachal') || s === 'hills') return window.MRIDAK_REGIONS.HILLS;
  return window.MRIDAK_REGIONS.MP;
};

window.getFarmerContext = function() {
  let stored = null;
  try {
    const raw = localStorage.getItem('krishi_farmer_profile_v2');
    if (raw) stored = JSON.parse(raw);
  } catch {}
  const sessionUser = window.KrishiGoogleCloud?.customerSession?.user || null;

  // Merge session + stored profile, preferring the most recently updated state/crop/acreage
  const useStoredOverSession =
    stored &&
    sessionUser &&
    stored.updatedAt &&
    sessionUser.updatedAt &&
    stored.updatedAt > sessionUser.updatedAt;

  const base = useStoredOverSession
    ? Object.assign({}, sessionUser, stored)
    : Object.assign({}, stored || {}, sessionUser || {});

  const region = window.resolveMridakRegion(base.state || 'Madhya Pradesh');
  const cropCode = String(base.crop || region.defaultCrop || 'WHEAT').replace(/^CROP_/, '').toUpperCase();
  const cropMeta = window.MRIDAK_CROP_META[cropCode] || window.MRIDAK_CROP_META.WHEAT;
  const rawCrops = Array.isArray(base.crops) && base.crops.length > 0 ? base.crops : [cropCode];
  const crops = [cropCode, ...rawCrops.filter((c) => c !== cropCode)];
  const areaAcres = Math.max(0.2, Number(base.areaAcres || 3.5));
  const landUnit = base.landUnit || window.KRISHI_LAND_UNIT || 'ACRE';

  return {
    uid: base.uid || base.userId || window.KrishiGoogleCloud?.anonymousFarmerId || 'anon',
    name: base.name || base.fullName || 'किसान मित्र',
    mobileNumber: base.mobileNumber || '',
    mobileMasked: base.mobileMasked || '',
    state: region.uiValue,
    stateCode: region.stateCode,
    stateLabelHi: region.labelHi,
    stateLabelEn: region.labelEn,
    hubDistrictHi: region.hubHi,
    hubDistrictEn: region.hubEn,
    sampleVillageHi: region.sampleVillageHi,
    crop: cropCode,
    cropLabelHi: cropMeta.hi,
    cropFullHi: cropMeta.fullHi,
    cropLabelEn: cropMeta.en,
    crops,
    areaAcres,
    landUnit,
    soil: region.soil,
    kvk: region.kvk,
    bannedChemHi: region.bannedChemHi,
    region
  };
};

window.getRegionalOfflineMandis = function(stateInput, cropFilter, lotQtl) {
  const reg = window.resolveMridakRegion(stateInput);
  const qty = Math.max(1, Number(lotQtl || 25));
  const normCrop = String(cropFilter || 'ALL').toUpperCase();
  let list = reg.offlineMandis || [];
  if (normCrop !== 'ALL') {
    const filtered = list.filter((m) => m.crop_code === normCrop);
    if (filtered.length > 0) {
      list = filtered;
    } else {
      const meta = window.MRIDAK_CROP_META[normCrop] || window.MRIDAK_CROP_META.WHEAT;
      list = [{
        mandi_name: `${reg.hubHi.split('/')[0].trim()} e-NAM मंडी (${reg.labelHi})`,
        crop_code: normCrop,
        crop_name_hi: meta.fullHi,
        crop_name_en: meta.en,
        modal_price_qtl: 2650,
        msp_price_qtl: 2400,
        price_change_24h: 55,
        distance_km: 20,
        arrival_tonnes: 640,
        sell_hold_signal: 'STRONG_SELL',
        advisory_hi: `${reg.labelHi} क्षेत्रीय मंडी में ${meta.hi} का भाव संतुलित है। नमी सुखाकर ग्रेडिंग के साथ बेचें।`,
        advisory_en: `Regional e-NAM benchmark rate in ${reg.labelEn}.`
      }];
    }
  }
  return list.map((m) => {
    const transportAndHamaliInr = Math.round((m.distance_km || 18) * 18 + qty * 15);
    const netRealizationInr = Math.round(m.modal_price_qtl * qty - transportAndHamaliInr);
    return Object.assign({}, m, {
      mspDiffInr: m.modal_price_qtl - m.msp_price_qtl,
      lotCalculation: {
        quantityQtl: qty,
        transportAndHamaliInr,
        netRealizationInr
      }
    });
  });
};

window.syncAllModulesToFarmerContext = function() {
  const ctx = window.getFarmerContext();
  const isEn = (window.currentLanguage || 'hi') === 'en';
  const fmtArea = (typeof window.formatLandArea === 'function')
    ? window.formatLandArea(ctx.areaAcres)
    : `${ctx.areaAcres} ${isEn ? 'Acres' : 'एकड़'}`;

  // 1. Sync global variables in app.js & b2c-consumer.js
  window.currentCrop = ctx.crop;
  window.currentAcreage = ctx.areaAcres;
  if (typeof currentCrop !== 'undefined') currentCrop = ctx.crop;
  if (typeof currentAcreage !== 'undefined') currentAcreage = ctx.areaAcres;
  if (typeof currentSelectedStateCode !== 'undefined') currentSelectedStateCode = ctx.stateCode;
  if (window.KrishiB2C) {
    window.KrishiB2C.selectedCrops = ctx.crops;
    localStorage.setItem('krishi_b2c_crops', JSON.stringify(ctx.crops));
    if (typeof window.KrishiB2C.updatePersonalizedDailyBrief === 'function') {
      window.KrishiB2C.updatePersonalizedDailyBrief();
    }
    if (typeof window.KrishiB2C.renderCropChipsInOnboarding === 'function') {
      window.KrishiB2C.renderCropChipsInOnboarding();
    }
  }

  // 2. Sync Form Inputs Across Auth, Profile, Onboarding, Calendar, Mandi & Rx
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
  setVal('nameInput', ctx.name);
  setVal('profileStateSelect', ctx.state);
  setVal('profileCropSelect', ctx.crop);
  setVal('profileAreaInput', ctx.areaAcres);
  setVal('profileUnitSelect', ctx.landUnit);
  setVal('b2cOnboardState', ctx.state);
  setVal('npkCropSelect', ctx.crop);
  setVal('npkAcreSlider', Math.min(15, Math.max(0.5, ctx.areaAcres)));
  setVal('acreageSlider', Math.min(10, Math.max(0.5, ctx.areaAcres)));

  const npkDisp = document.getElementById('npkAcreDisplay');
  if (npkDisp) npkDisp.innerText = fmtArea;
  const rxAcreDisp = document.getElementById('acreageValue');
  if (rxAcreDisp) rxAcreDisp.innerText = fmtArea;

  const estLotQtl = Math.max(5, Math.min(100, Math.round((ctx.areaAcres * 8) / 5) * 5));
  if (typeof currentMandiLotQuintals !== 'undefined') currentMandiLotQuintals = estLotQtl;
  setVal('mandiQtySlider', estLotQtl);
  const mandiQtyLbl = document.getElementById('mandiQtyValue');
  if (mandiQtyLbl) mandiQtyLbl.innerText = isEn ? `${estLotQtl} Quintals` : `${estLotQtl} क्विंटल`;

  const mandiStateBanner = document.getElementById('mandiStateNameText');
  if (mandiStateBanner) mandiStateBanner.innerText = isEn ? `${ctx.stateLabelEn} (${ctx.hubDistrictEn})` : `${ctx.stateLabelHi} (${ctx.hubDistrictHi})`;

  // 3. Sync Active Chips on Camera Crop Bar & State Matrix Bar
  const camBar = document.getElementById('cropSelectionBar');
  if (camBar) {
    camBar.querySelectorAll('.crop-chip').forEach((btn) => {
      const m = (btn.getAttribute('onclick') || '').match(/'([A-Z_]+)'/);
      btn.classList.toggle('active', Boolean(m && m[1] === ctx.crop));
    });
  }
  const stBar = document.getElementById('stateMatrixSelectorBar');
  if (stBar) {
    stBar.querySelectorAll('.crop-chip').forEach((btn) => {
      const m = (btn.getAttribute('onclick') || '').match(/'([A-Z_]+)'/);
      btn.classList.toggle('active', Boolean(m && m[1] === ctx.stateCode));
    });
  }
  const procCropEl = document.getElementById('procCropName');
  if (procCropEl) procCropEl.innerText = isEn ? ctx.cropLabelEn : ctx.cropFullHi;

  // 4. Sync Home Dashboard Greeting & Regional Quick Tiles Instantly
  const farmerNameEl = document.getElementById('homeFarmerName');
  if (farmerNameEl) farmerNameEl.innerText = ctx.name;
  const locMetaEl = document.getElementById('homeLocationMeta');
  if (locMetaEl) {
    locMetaEl.innerHTML = `${isEn ? ctx.stateLabelEn : ctx.stateLabelHi} (${isEn ? ctx.hubDistrictEn : ctx.hubDistrictHi}) • <strong>${fmtArea}</strong>`;
  }

  const offMandis = window.getRegionalOfflineMandis(ctx.state, ctx.crop, estLotQtl);
  const topOffMandi = offMandis[0];
  const tileMandiSub = document.getElementById('homeTileMandiSub');
  if (tileMandiSub && topOffMandi) {
    const shortMandi = topOffMandi.mandi_name.split(' ')[0];
    tileMandiSub.innerText = isEn
      ? `${shortMandi}: ${ctx.cropLabelEn} ₹${topOffMandi.modal_price_qtl}/qtl`
      : `${shortMandi}: ${ctx.cropLabelHi} ₹${topOffMandi.modal_price_qtl.toLocaleString('en-IN')}/क्विं`;
  }

  const offOut = ctx.region.offlineOutbreak;
  const tileMitraSub = document.getElementById('homeTileMitraSub');
  if (tileMitraSub && offOut) {
    tileMitraSub.innerText = isEn
      ? `${ctx.hubDistrictEn.split('/')[0].trim()}: ${offOut.affected_farms_count} farms alert`
      : `${offOut.district.split(' ')[0]}: ${offOut.affected_farms_count} खेतों में अलर्ट`;
  }

  const tileSoilSub = document.getElementById('homeTileSoilSub');
  if (tileSoilSub) {
    tileSoilSub.innerText = isEn ? `pH ${ctx.soil.ph} • Zn ${ctx.soil.zn} ppm` : ctx.soil.znStatusHi;
  }

  const tileRxSub = document.getElementById('homeTileRxSub');
  if (tileRxSub) {
    const meta = window.MRIDAK_CROP_META[ctx.crop] || window.MRIDAK_CROP_META.WHEAT;
    tileRxSub.innerText = isEn ? `${meta.en} Care` : `${meta.hi}: ${meta.step1ShortHi}`;
  }

  // 5. Sync Soil Health Passport (viewFarm)
  const setTxt = (id, t) => { const el = document.getElementById(id); if (el) el.innerText = t; };
  setTxt('soilValZn', `${ctx.soil.zn} ppm`);
  setTxt('soilValPh', String(ctx.soil.ph));
  setTxt('soilStatusPh', ctx.soil.phStatusHi);
  setTxt('soilValN', `${ctx.soil.n} kg/ha`);
  setTxt('soilValK', `${ctx.soil.k} kg/ha`);
  const parcelEl = document.getElementById('farmParcelMeta');
  if (parcelEl) {
    parcelEl.innerHTML = isEn
      ? `Region: <strong>${ctx.stateLabelEn} (${ctx.hubDistrictEn})</strong> | Area: <strong>${fmtArea}</strong>`
      : `क्षेत्र: <strong>${ctx.stateLabelHi} (${ctx.hubDistrictHi})</strong> | रकबा: <strong>${fmtArea}</strong>`;
  }
  const soilTypeEl = document.getElementById('soilTypeDesc');
  if (soilTypeEl) {
    soilTypeEl.innerHTML = isEn
      ? `Soil Type: <strong>${ctx.soil.typeEn}</strong>`
      : `मिट्टी का प्रकार: <strong>${ctx.soil.typeHi}</strong>`;
  }
  const irrigEl = document.getElementById('irrigationDesc');
  if (irrigEl) {
    irrigEl.innerHTML = `सिंचाई साधन: <strong>${ctx.soil.irrigationHi}</strong>`;
  }

  // 6. Sync Escalation KVK Scientist & Prescription State Ban Button
  setTxt('escScientistName', ctx.kvk.drHi);
  setTxt('escKvkLocation', ctx.kvk.kvkHi);
  const rxStateBtn = document.getElementById('rxActiveStateBtn');
  if (rxStateBtn) {
    rxStateBtn.innerText = `${ctx.stateLabelHi} (${ctx.stateCode})`;
  }

  // 7. Sync Kisan e-Mitra Prompt Chips & Initial Answer to Customer's State, Crop & Acreage
  const chip1 = document.getElementById('mitraChip1');
  const chip1Txt = document.getElementById('mitraChip1Text');
  if (chip1 && chip1Txt) {
    const q1 = `आज ${ctx.stateLabelHi} में ${ctx.cropLabelHi} का मंडी भाव क्या है और कहाँ बेचें?`;
    chip1.setAttribute('onclick', `askMitraQuestion('${q1.replace(/'/g, '')}')`);
    chip1Txt.innerText = isEn ? `${ctx.cropLabelEn} Mandi Rate?` : `${ctx.cropLabelHi} मंडी भाव?`;
  }
  const chip3 = document.getElementById('mitraChip3');
  const chip3Txt = document.getElementById('mitraChip3Text');
  if (chip3 && chip3Txt) {
    const q3 = `${ctx.areaAcres} एकड़ ${ctx.cropLabelHi} में कितनी डीएपी, यूरिया व जिंक खाद डालें?`;
    chip3.setAttribute('onclick', `askMitraQuestion('${q3.replace(/'/g, '')}')`);
    chip3Txt.innerText = isEn ? `${ctx.areaAcres} Acre NPK Dose?` : `${fmtArea} ${ctx.cropLabelHi} खाद मात्रा?`;
  }
  const mitraInput = document.getElementById('mitraQueryInput');
  if (mitraInput && (!mitraInput.dataset.userEdited)) {
    mitraInput.value = `आज ${ctx.stateLabelHi} में ${ctx.cropLabelHi} का मंडी भाव क्या है?`;
  }
  const mitraAns = document.getElementById('mitraAnswerText');
  if (mitraAns && topOffMandi && (!mitraAns.dataset.liveAnswered)) {
    const diff = topOffMandi.modal_price_qtl - topOffMandi.msp_price_qtl;
    mitraAns.innerText = isEn
      ? `Today at ${topOffMandi.mandi_name}, ${topOffMandi.crop_name_en} modal price is ₹${topOffMandi.modal_price_qtl}/qtl (+₹${diff} vs MSP ₹${topOffMandi.msp_price_qtl}). ${topOffMandi.advisory_en}`
      : `आज ${topOffMandi.mandi_name} में ${topOffMandi.crop_name_hi} का मॉडल भाव ₹${topOffMandi.modal_price_qtl.toLocaleString('en-IN')}/क्विंटल है, जो सरकारी MSP (₹${topOffMandi.msp_price_qtl.toLocaleString('en-IN')}) से ₹${diff} अधिक है। ${topOffMandi.advisory_hi}`;
    if (typeof lastMitraSpokenText !== 'undefined') lastMitraSpokenText = mitraAns.innerText;
  }

  // 8. Refresh Active Prescription View Dosage for Farmer's Crop & Acreage
  if (typeof renderDynamicRecommendation === 'function' && (!window.activeDiagnosisReport || window.activeDiagnosisReport._autoSynced)) {
    // Update default rx card silently without adding duplicate history item
    if (typeof window.syncDefaultPrescriptionCard === 'function') {
      window.syncDefaultPrescriptionCard(ctx);
    }
  }

  // 9. Live Background Hydration of Home Mandi, Outbreak & Weather Tiles from Backend
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
  fetch(`${apiBase}/market/mandi-prices?state=${encodeURIComponent(ctx.state)}&crop=${encodeURIComponent(ctx.crop)}&quantityQtl=${estLotQtl}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const top = d && Array.isArray(d.mandis) && d.mandis[0];
      if (top && tileMandiSub) {
        const shortM = top.mandi_name.split(' ')[0];
        tileMandiSub.innerText = isEn
          ? `${shortM}: ₹${top.modal_price_qtl}/qtl (+MSP)`
          : `${shortM}: ${ctx.cropLabelHi} ₹${Number(top.modal_price_qtl).toLocaleString('en-IN')}/क्विं`;
      }
    })
    .catch(() => {});

  fetch(`${apiBase}/community/outbreaks?state=${encodeURIComponent(ctx.state)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const first = d && Array.isArray(d.outbreaks) && d.outbreaks[0];
      if (first && tileMitraSub) {
        const shortDist = String(first.district || '').split(/[ ,/&]/)[0];
        tileMitraSub.innerText = isEn
          ? `${shortDist}: ${first.affected_farms_count} farms alert`
          : `${shortDist}: ${first.affected_farms_count} खेतों में अलर्ट`;
      }
    })
    .catch(() => {});
};

async function sha256Hex(input) {
  if (window.crypto && window.crypto.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0xdeadbeef ^ input.length, h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const base = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return (base + base + base + base).slice(0, 64);
}

window.KrishiGoogleCloud = {
  mode: 'OFFLINE_FIRST_WITH_GOOGLE_FREE_SYNC',
  projectId: 'kris-seva',
  firebaseConfig: null,
  firebaseIdToken: null,
  anonymousFarmerId: null,
  customerSession: null,

  init() {
    this.populateDobDropdowns();
    this.restoreCustomerSession();

    let fid = localStorage.getItem('krishi_anon_farmer_uid');
    if (!fid) {
      fid = 'farmer-anon-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('krishi_anon_farmer_uid', fid);
    }
    this.anonymousFarmerId = (this.customerSession && this.customerSession.user && this.customerSession.user.uid) || fid;

    // Pre-fill login state/crop if previously saved on this device
    try {
      const prev = JSON.parse(localStorage.getItem('krishi_farmer_profile_v2') || 'null');
      if (prev && prev.state) {
        const stEl = document.getElementById('loginStateSelect');
        if (stEl && !stEl.value) stEl.value = prev.state;
        const crEl = document.getElementById('loginCropSelect');
        if (crEl && prev.crop) crEl.value = prev.crop;
      }
    } catch {}

    // Auto-discover Firebase Hosting Web Config (served automatically at /__/firebase/init.json on mridak.com)
    fetch('/__/firebase/init.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg && cfg.apiKey && cfg.projectId) {
          this.firebaseConfig = cfg;
          this.projectId = cfg.projectId;
          this.mode = 'FIREBASE_AUTH_AND_FIRESTORE_ACTIVE';
          if (this.customerSession && this.customerSession.firebaseRefreshToken) {
            this.refreshFirebaseIdToken(this.customerSession.firebaseRefreshToken);
          }
        }
      })
      .catch(() => {});

    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
    fetch(`${apiBase}/google-free/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info && info.projectId) {
          this.projectId = info.projectId;
          if (!this.firebaseConfig) {
            this.mode = info.firestoreEnabled ? 'CLOUD_RUN_FIRESTORE_ACTIVE' : 'CLOUD_RUN_FREE_ACTIVE';
          }
        }
        this.updateStatusBadge();
      })
      .catch(() => {
        this.updateStatusBadge();
      });
  },

  onLoginStateChanged(stateVal) {
    if (!stateVal) return;
    const reg = window.resolveMridakRegion(stateVal);
    const cropSel = document.getElementById('loginCropSelect');
    if (cropSel && !cropSel.dataset.userTouched) {
      cropSel.value = reg.defaultCrop;
    }
  },

  populateDobDropdowns() {
    const daySel = document.getElementById('loginDobDay');
    const yearSel = document.getElementById('loginDobYear');
    if (daySel && daySel.options.length <= 1) {
      for (let d = 1; d <= 31; d++) {
        const dd = String(d).padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = dd;
        opt.textContent = dd;
        daySel.appendChild(opt);
      }
    }
    if (yearSel && yearSel.options.length <= 1) {
      const maxYear = new Date().getFullYear() - 12;
      for (let y = maxYear; y >= 1930; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        yearSel.appendChild(opt);
      }
    }
    const cropSel = document.getElementById('loginCropSelect');
    if (cropSel && !cropSel.dataset.listenerAttached) {
      cropSel.dataset.listenerAttached = '1';
      cropSel.addEventListener('change', () => {
        cropSel.dataset.userTouched = '1';
      });
    }
  },

  isCustomerLoggedIn() {
    return Boolean(this.customerSession && this.customerSession.authenticated && this.customerSession.user);
  },

  restoreCustomerSession() {
    try {
      const raw = localStorage.getItem(MRIDAK_SESSION_KEY);
      if (!raw) {
        this.customerSession = null;
        window.authToken = null;
        window.currentUser = null;
        this.syncAuthGateUi();
        return false;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.authenticated || !parsed.user || !parsed.user.mobileNumber) {
        this.customerSession = null;
        window.authToken = null;
        window.currentUser = null;
        this.syncAuthGateUi();
        return false;
      }
      this.customerSession = parsed;
      this.firebaseIdToken = parsed.firebaseIdToken || null;
      this.anonymousFarmerId = parsed.user.uid;
      window.authToken = parsed.token || 'mridak-local-session';
      window.currentUser = parsed.user;
      if (typeof authToken !== 'undefined') authToken = window.authToken;
      if (typeof currentUser !== 'undefined') currentUser = window.currentUser;

      const reg = window.resolveMridakRegion(parsed.user.state || 'Madhya Pradesh');
      const primaryCrop = parsed.user.crop || reg.defaultCrop;
      localStorage.setItem('krishi_farmer_profile_v2', JSON.stringify({
        uid: parsed.user.uid,
        name: parsed.user.name || parsed.user.fullName,
        mobileNumber: parsed.user.mobileNumber,
        mobileMasked: parsed.user.mobileMasked,
        state: reg.uiValue,
        crop: primaryCrop,
        crops: parsed.user.crops || [primaryCrop],
        areaAcres: parsed.user.areaAcres || 3.5,
        landUnit: parsed.user.landUnit || 'ACRE',
        language: parsed.user.preferredLanguage || window.currentLanguage || 'hi',
        updatedAt: parsed.user.updatedAt || new Date().toISOString()
      }));
      localStorage.setItem('krishi_b2c_onboarded_v1', 'true');
      this.syncAuthGateUi();
      return true;
    } catch {
      this.customerSession = null;
      this.syncAuthGateUi();
      return false;
    }
  },

  syncAuthGateUi() {
    const loggedIn = this.isCustomerLoggedIn();
    const loginBox = document.getElementById('authLoginGateBox');
    const profileBox = document.getElementById('authProfileManageBox');
    const bottomNav = document.querySelector('.phone-bottom-nav');
    const voiceFab = document.getElementById('floatingVoiceCompanionBtn');

    if (loginBox) loginBox.classList.toggle('hidden', loggedIn);
    if (profileBox) profileBox.classList.toggle('hidden', !loggedIn);
    if (bottomNav) bottomNav.style.display = loggedIn ? 'flex' : 'none';
    if (voiceFab) voiceFab.style.display = loggedIn ? 'inline-flex' : 'none';

    if (loggedIn && this.customerSession?.user) {
      const u = this.customerSession.user;
      const badge = document.getElementById('loggedInMobileDisplay');
      if (badge) badge.textContent = u.mobileMasked || (`+91-XXXXXX${String(u.mobileNumber).slice(-4)}`);
      this.updateStatusBadge();
    }
  },

  showLoginMessage(msg, isError) {
    const box = document.getElementById('mobileDobErrorBox');
    if (!box) return;
    if (!msg) {
      box.classList.add('hidden');
      box.textContent = '';
      return;
    }
    box.classList.remove('hidden');
    box.style.background = isError ? '#fef2f2' : '#f0fdf4';
    box.style.borderColor = isError ? '#fca5a5' : '#86efac';
    box.style.color = isError ? '#b91c1c' : '#166534';
    box.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> <span>${msg}</span>`;
  },

  async authenticateWithFirebaseRest(cleanMobile, normalizedDob, extraProfile) {
    if (!this.firebaseConfig || !this.firebaseConfig.apiKey) return null;
    const apiKey = this.firebaseConfig.apiKey;
    const projectId = this.firebaseConfig.projectId || 'kris-seva';
    const syntheticEmail = `${cleanMobile}@auth.mridak.com`;
    const derivedHex = await sha256Hex(`mridak-fb-auth-v1:${cleanMobile}:${normalizedDob}`);
    const derivedPassword = `Mridak#${derivedHex.slice(0, 40)}`;
    const dobSha256 = 'sha256:' + (await sha256Hex(`mridak-dob:${cleanMobile}:${normalizedDob}`));
    const mobileMasked = `+91-XXXXXX${cleanMobile.slice(-4)}`;
    const reg = window.resolveMridakRegion(extraProfile.state || 'Madhya Pradesh');

    // 1. Try signing in existing customer
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: syntheticEmail, password: derivedPassword, returnSecureToken: true })
    });

    if (signInRes.ok) {
      const authData = await signInRes.json();
      const uid = authData.localId;
      let profile = {
        uid,
        userId: uid,
        mobileNumber: cleanMobile,
        mobileMasked,
        dobHash: dobSha256,
        name: extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`,
        fullName: extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`,
        state: extraProfile.state || reg.uiValue,
        crop: extraProfile.crop || reg.defaultCrop,
        crops: [extraProfile.crop || reg.defaultCrop],
        areaAcres: 3.5,
        landUnit: 'ACRE',
        preferredLanguage: extraProfile.preferredLanguage || 'hi',
        updatedAt: new Date().toISOString()
      };

      try {
        const fsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/farmers/${encodeURIComponent(uid)}`, {
          headers: { Authorization: `Bearer ${authData.idToken}` }
        });
        if (fsRes.ok) {
          const doc = await fsRes.json();
          const f = doc.fields || {};
          if (f.name?.stringValue && !extraProfile.fullName) { profile.name = f.name.stringValue; profile.fullName = f.name.stringValue; }
          if (f.state?.stringValue && !extraProfile.state) profile.state = f.state.stringValue;
          if (f.crop?.stringValue && !extraProfile.crop) { profile.crop = f.crop.stringValue; profile.crops = [f.crop.stringValue]; }
          if (f.areaAcres?.doubleValue || f.areaAcres?.integerValue) {
            profile.areaAcres = Number(f.areaAcres.doubleValue ?? f.areaAcres.integerValue);
          }
          if (f.landUnit?.stringValue) profile.landUnit = f.landUnit.stringValue;
          if (f.language?.stringValue) profile.preferredLanguage = f.language.stringValue;
        }
        // If user explicitly chose a new state/crop on login, persist update back to Firestore
        if (extraProfile.state || extraProfile.crop) {
          await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/farmers/${encodeURIComponent(uid)}?updateMask.fieldPaths=state&updateMask.fieldPaths=crop&updateMask.fieldPaths=updatedAt`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${authData.idToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  state: { stringValue: profile.state },
                  crop: { stringValue: profile.crop },
                  updatedAt: { stringValue: profile.updatedAt }
                }
              })
            }
          ).catch(() => {});
        }
      } catch {}

      return {
        isNewUser: false,
        token: authData.idToken,
        firebaseIdToken: authData.idToken,
        firebaseRefreshToken: authData.refreshToken,
        user: profile
      };
    }

    const signInErr = await signInRes.json().catch(() => ({}));
    const errMsg = signInErr?.error?.message || '';
    if (errMsg.includes('TOO_MANY_ATTEMPTS')) {
      throw new Error('गलत जन्मतिथि के कई प्रयास हुए हैं। कृपया कुछ मिनट बाद पुनः प्रयास करें। (Too many attempts, please retry shortly.)');
    }
    if (errMsg.includes('OPERATION_NOT_ALLOWED') || errMsg.includes('CONFIGURATION_NOT_FOUND')) {
      return null;
    }

    // 2. Open Self-Registration via accounts:signUp
    const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: syntheticEmail, password: derivedPassword, returnSecureToken: true })
    });

    if (signUpRes.ok) {
      const upData = await signUpRes.json();
      const uid = upData.localId;
      const nowIso = new Date().toISOString();
      const chosenName = extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`;
      const chosenState = extraProfile.state || reg.uiValue;
      const chosenCrop = extraProfile.crop || reg.defaultCrop;
      const chosenLang = extraProfile.preferredLanguage || 'hi';

      try {
        await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/farmers?documentId=${encodeURIComponent(uid)}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${upData.idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              uid: { stringValue: uid },
              name: { stringValue: chosenName },
              mobileMasked: { stringValue: mobileMasked },
              dobHash: { stringValue: dobSha256 },
              authMethod: { stringValue: 'MOBILE_DOB' },
              state: { stringValue: chosenState },
              crop: { stringValue: chosenCrop },
              areaAcres: { doubleValue: 3.5 },
              landUnit: { stringValue: 'ACRE' },
              language: { stringValue: chosenLang },
              updatedAt: { stringValue: nowIso }
            }
          })
        });
      } catch {}

      return {
        isNewUser: true,
        token: upData.idToken,
        firebaseIdToken: upData.idToken,
        firebaseRefreshToken: upData.refreshToken,
        user: {
          uid,
          userId: uid,
          mobileNumber: cleanMobile,
          mobileMasked,
          dobHash: dobSha256,
          name: chosenName,
          fullName: chosenName,
          state: chosenState,
          crop: chosenCrop,
          crops: [chosenCrop],
          areaAcres: 3.5,
          landUnit: 'ACRE',
          preferredLanguage: chosenLang,
          updatedAt: nowIso
        }
      };
    }

    const signUpErr = await signUpRes.json().catch(() => ({}));
    const upErrMsg = signUpErr?.error?.message || '';
    if (upErrMsg.includes('EMAIL_EXISTS')) {
      throw new Error('यह मोबाइल नंबर पहले से पंजीकृत है, लेकिन जन्मतिथि (DOB) मेल नहीं खाती! कृपया अपनी सही जन्मतिथि चुनें। (Incorrect Date of Birth for this mobile number.)');
    }
    if (upErrMsg.includes('OPERATION_NOT_ALLOWED') || upErrMsg.includes('CONFIGURATION_NOT_FOUND')) {
      return null;
    }
    throw new Error('लॉगिन सत्यापन में त्रुटि हुई, कृपया पुनः प्रयास करें।');
  },

  async refreshFirebaseIdToken(refreshToken) {
    if (!this.firebaseConfig?.apiKey || !refreshToken) return;
    try {
      const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(this.firebaseConfig.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id_token && this.customerSession) {
          this.firebaseIdToken = data.id_token;
          this.customerSession.firebaseIdToken = data.id_token;
          this.customerSession.token = data.id_token;
          localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(this.customerSession));
        }
      }
    } catch {}
  },

  async submitMobileDobLogin(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    this.showLoginMessage('', false);

    const rawMobile = document.getElementById('loginMobileInput')?.value || '';
    const digits = rawMobile.replace(/\D/g, '');
    const cleanMobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

    if (!/^[6-9][0-9]{9}$/.test(cleanMobile)) {
      this.showLoginMessage('कृपया 10-अंकों का सही मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)।', true);
      document.getElementById('loginMobileInput')?.focus();
      return;
    }

    const dd = document.getElementById('loginDobDay')?.value || '';
    const mm = document.getElementById('loginDobMonth')?.value || '';
    const yyyy = document.getElementById('loginDobYear')?.value || '';
    if (!dd || !mm || !yyyy) {
      this.showLoginMessage('कृपया अपनी पूरी जन्मतिथि (दिन, महीना और वर्ष) चुनें।', true);
      return;
    }

    const yNum = parseInt(yyyy, 10), mNum = parseInt(mm, 10), dNum = parseInt(dd, 10);
    const checkDate = new Date(Date.UTC(yNum, mNum - 1, dNum));
    if (checkDate.getUTCFullYear() !== yNum || checkDate.getUTCMonth() !== mNum - 1 || checkDate.getUTCDate() !== dNum) {
      this.showLoginMessage('चुनी गई तारीख कैलेंडर में मान्य नहीं है (जैसे 30/31 फरवरी)। कृपया सही तारीख चुनें।', true);
      return;
    }
    const normalizedDob = `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;

    const deviceVault = JSON.parse(localStorage.getItem(MRIDAK_DEVICE_VAULT_KEY) || '{}');
    const rawSelectedState = document.getElementById('loginStateSelect')?.value || '';
    if (!rawSelectedState && !deviceVault[cleanMobile]?.user?.state) {
      this.showLoginMessage('कृपया अपना राज्य / क्षेत्र (जैसे उ.प्र. एवं बिहार) चुनें ताकि आपके क्षेत्र के सटीक मंडी भाव और सलाह दिखें।', true);
      document.getElementById('loginStateSelect')?.focus();
      return;
    }

    const optState = rawSelectedState || deviceVault[cleanMobile]?.user?.state || 'Madhya Pradesh';
    const reg = window.resolveMridakRegion(optState);
    const optCrop = document.getElementById('loginCropSelect')?.value || reg.defaultCrop;
    const optName = document.getElementById('loginNameInput')?.value?.trim() || '';
    const lang = window.currentLanguage || 'hi';

    const btn = document.getElementById('mobileDobSubmitBtn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>सत्यापित किया जा रहा है...</span>';
    }

    try {
      let authOutcome = null;

      // Path 1: Firebase Authentication (50,000 MAU Always-Free) if active on domain
      if (this.firebaseConfig && this.firebaseConfig.apiKey) {
        authOutcome = await this.authenticateWithFirebaseRest(cleanMobile, normalizedDob, {
          fullName: optName || undefined,
          state: rawSelectedState || undefined,
          crop: rawSelectedState ? optCrop : undefined,
          preferredLanguage: lang
        });
      }

      // Path 2: Cloud Run / Express Backend API (/v1/auth/mobile-dob)
      if (!authOutcome) {
        const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
        try {
          const res = await fetch(`${apiBase}/auth/mobile-dob`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mobileNumber: cleanMobile,
              dob: normalizedDob,
              fullName: optName || undefined,
              state: rawSelectedState || undefined,
              crop: optCrop,
              preferredLanguage: lang
            })
          });

          const payload = await res.json().catch(() => null);
          if (res.ok && payload && payload.success && payload.user) {
            authOutcome = {
              isNewUser: Boolean(payload.isNewUser),
              token: payload.accessToken,
              firebaseIdToken: null,
              firebaseRefreshToken: null,
              user: payload.user
            };
          } else if (res.status === 400 || res.status === 401 || res.status === 429) {
            throw new Error(payload?.message || 'जन्मतिथि (DOB) मेल नहीं खाती! कृपया सही जन्मतिथि चुनें।');
          }
        } catch (netOrAuthErr) {
          if (netOrAuthErr && netOrAuthErr.message && !/Failed to fetch|NetworkError|Load failed/i.test(netOrAuthErr.message)) {
            throw netOrAuthErr;
          }
        }
      }

      // Path 3: Offline Rural Field Fallback (when 0% mobile network or static hosting before backend warm-up)
      const offlineDobHash = await sha256Hex(`mridak-offline-v1:${cleanMobile}:${normalizedDob}`);

      if (!authOutcome) {
        const cachedAcct = deviceVault[cleanMobile];
        if (cachedAcct) {
          if (cachedAcct.saltedDobHash !== offlineDobHash) {
            throw new Error('यह मोबाइल नंबर इस फोन में पंजीकृत है, लेकिन जन्मतिथि (DOB) मेल नहीं खाती! कृपया सही जन्मतिथि चुनें।');
          }
          const updatedUser = Object.assign({}, cachedAcct.user);
          if (rawSelectedState) updatedUser.state = rawSelectedState;
          if (optCrop) {
            updatedUser.crop = optCrop;
            updatedUser.crops = [optCrop, ...(updatedUser.crops || []).filter((c) => c !== optCrop)];
          }
          if (optName) { updatedUser.name = optName; updatedUser.fullName = optName; }
          updatedUser.updatedAt = new Date().toISOString();
          authOutcome = {
            isNewUser: false,
            token: 'mridak-offline-verified',
            firebaseIdToken: null,
            firebaseRefreshToken: null,
            user: updatedUser
          };
        } else {
          const uid = 'cust-local-' + (await sha256Hex(cleanMobile)).slice(0, 20);
          const chosenName = optName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`;
          authOutcome = {
            isNewUser: true,
            token: 'mridak-offline-verified',
            firebaseIdToken: null,
            firebaseRefreshToken: null,
            user: {
              uid,
              userId: uid,
              mobileNumber: cleanMobile,
              mobileMasked: `+91-XXXXXX${cleanMobile.slice(-4)}`,
              dobHash: 'sha256:' + offlineDobHash,
              name: chosenName,
              fullName: chosenName,
              state: optState,
              crop: optCrop,
              crops: [optCrop],
              areaAcres: 3.5,
              landUnit: 'ACRE',
              preferredLanguage: lang,
              updatedAt: new Date().toISOString()
            }
          };
        }
      }

      deviceVault[cleanMobile] = {
        saltedDobHash: offlineDobHash,
        user: authOutcome.user
      };
      localStorage.setItem(MRIDAK_DEVICE_VAULT_KEY, JSON.stringify(deviceVault));

      const sessionObj = {
        authenticated: true,
        isNewUser: authOutcome.isNewUser,
        token: authOutcome.token,
        firebaseIdToken: authOutcome.firebaseIdToken || null,
        firebaseRefreshToken: authOutcome.firebaseRefreshToken || null,
        user: authOutcome.user,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(sessionObj));
      localStorage.setItem('krishi_b2c_crops', JSON.stringify(authOutcome.user.crops || [authOutcome.user.crop || optCrop]));

      // Reset Mitra live-answer flag so new customer's regional summary renders cleanly
      const mitraAns = document.getElementById('mitraAnswerText');
      if (mitraAns) delete mitraAns.dataset.liveAnswered;
      const mitraIn = document.getElementById('mitraQueryInput');
      if (mitraIn) delete mitraIn.dataset.userEdited;

      this.restoreCustomerSession();
      this.hydrateSavedFarmProfile();

      const targetView = (typeof pendingProtectedView !== 'undefined' && pendingProtectedView && pendingProtectedView !== 'viewAuth')
        ? pendingProtectedView
        : 'viewHome';
      if (typeof pendingProtectedView !== 'undefined') pendingProtectedView = null;
      if (typeof switchView === 'function') switchView(targetView);
    } catch (err) {
      this.showLoginMessage(err?.message || 'लॉगिन विफल रहा, कृपया पुनः प्रयास करें।', true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  },

  logoutCustomer() {
    localStorage.removeItem(MRIDAK_SESSION_KEY);
    this.customerSession = null;
    this.firebaseIdToken = null;
    window.authToken = null;
    window.currentUser = null;
    if (typeof authToken !== 'undefined') authToken = null;
    if (typeof currentUser !== 'undefined') currentUser = null;
    this.syncAuthGateUi();
    this.showLoginMessage('आप सफलतापूर्वक लॉगआउट हो गए हैं। कृपया मोबाइल नंबर व जन्मतिथि से लॉगिन करें।', false);
    const mobEl = document.getElementById('loginMobileInput');
    if (mobEl) mobEl.value = '';
    if (typeof switchView === 'function') switchView('viewAuth', false);
  },

  updateStatusBadge() {
    const el = document.getElementById('googleCloudStatusPill');
    if (!el) return;
    const isOnline = navigator.onLine;
    const masked = this.customerSession?.user?.mobileMasked;
    if (masked) {
      el.innerHTML = isOnline
        ? `<i class="fa-solid fa-mobile-screen-button"></i> ${masked} • Cloud Sync`
        : `<i class="fa-solid fa-bolt"></i> ${masked} • Offline`;
      return;
    }
    el.innerHTML = isOnline
      ? '<i class="fa-brands fa-google"></i> Cloud Free Sync'
      : '<i class="fa-solid fa-bolt"></i> Offline Ready';
  },

  async saveFarmProfilePreference() {
    const name = document.getElementById('nameInput')?.value?.trim() || 'किसान मित्र';
    const state = document.getElementById('profileStateSelect')?.value || 'Madhya Pradesh';
    const crop = document.getElementById('profileCropSelect')?.value || window.resolveMridakRegion(state).defaultCrop;
    const area = parseFloat(document.getElementById('profileAreaInput')?.value || '3.5');
    const unit = document.getElementById('profileUnitSelect')?.value || window.KRISHI_LAND_UNIT || 'ACRE';

    window.KRISHI_LAND_UNIT = unit;
    localStorage.setItem('krishi_land_unit', unit);

    const uid = this.customerSession?.user?.uid || this.anonymousFarmerId;
    const existingCrops = Array.isArray(window.KrishiB2C?.selectedCrops) ? window.KrishiB2C.selectedCrops : [crop];
    const mergedCrops = [crop, ...existingCrops.filter((c) => c !== crop)];

    const profile = {
      uid,
      name,
      fullName: name,
      mobileNumber: this.customerSession?.user?.mobileNumber || '',
      mobileMasked: this.customerSession?.user?.mobileMasked || '',
      dobHash: this.customerSession?.user?.dobHash || '',
      state,
      crop,
      crops: mergedCrops,
      areaAcres: area,
      landUnit: unit,
      preferredLanguage: window.currentLanguage || 'hi',
      language: window.currentLanguage || 'hi',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('krishi_farmer_profile_v2', JSON.stringify(profile));

    if (this.customerSession && this.customerSession.user) {
      this.customerSession.user = Object.assign({}, this.customerSession.user, profile);
      localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(this.customerSession));
      const deviceVault = JSON.parse(localStorage.getItem(MRIDAK_DEVICE_VAULT_KEY) || '{}');
      if (profile.mobileNumber && deviceVault[profile.mobileNumber]) {
        deviceVault[profile.mobileNumber].user = this.customerSession.user;
        localStorage.setItem(MRIDAK_DEVICE_VAULT_KEY, JSON.stringify(deviceVault));
      }
    }

    const mitraAns = document.getElementById('mitraAnswerText');
    if (mitraAns) delete mitraAns.dataset.liveAnswered;
    const mitraIn = document.getElementById('mitraQueryInput');
    if (mitraIn) delete mitraIn.dataset.userEdited;

    this.hydrateSavedFarmProfile();

    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      if (this.customerSession?.token && !this.customerSession.firebaseIdToken) {
        await fetch(`${apiBase}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.customerSession.token}`
          },
          body: JSON.stringify(profile)
        });
      } else if (this.firebaseIdToken && this.firebaseConfig?.projectId) {
        const pid = this.firebaseConfig.projectId;
        await fetch(
          `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/farmers/${encodeURIComponent(uid)}?updateMask.fieldPaths=name&updateMask.fieldPaths=state&updateMask.fieldPaths=crop&updateMask.fieldPaths=areaAcres&updateMask.fieldPaths=landUnit&updateMask.fieldPaths=language&updateMask.fieldPaths=updatedAt`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.firebaseIdToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                name: { stringValue: name },
                state: { stringValue: state },
                crop: { stringValue: crop },
                areaAcres: { doubleValue: Number(area || 3.5) },
                landUnit: { stringValue: unit },
                language: { stringValue: profile.language },
                updatedAt: { stringValue: profile.updatedAt }
              }
            })
          }
        );
      } else {
        await fetch(`${apiBase}/google-free/sync-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      }
    } catch {}

    if (typeof switchView === 'function') switchView('viewHome');
    if (window.KrishiB2C && typeof window.KrishiB2C.showToast === 'function') {
      const ctx = window.getFarmerContext();
      window.KrishiB2C.showToast(`✅ खेत प्रोफाइल अपडेट: ${ctx.stateLabelHi} • ${ctx.cropLabelHi}`);
    }
  },

  hydrateSavedFarmProfile() {
    try {
      window.syncAllModulesToFarmerContext();
      this.updateStatusBadge();
    } catch {}
  },

  async syncDiaryToFirestoreFree(entries) {
    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      await fetch(`${apiBase}/google-free/sync-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: this.customerSession?.user?.uid || this.anonymousFarmerId, entries: entries.slice(0, 50) })
      });
    } catch {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.KrishiGoogleCloud.init();
});
