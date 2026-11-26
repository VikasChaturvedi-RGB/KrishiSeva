// ============================================================================
// KRISHI SAHAYAK — 100% NON-COMMERCIAL PURE FARMER GUIDANCE MODULES
// Zero Selling • Zero Brand Push • Self-Reliant Farming & Farmer Protection
//   1. DIY On-Farm Natural Bio-Remedies (Jeevamrut, Neemastra, Beejamrut, Trichoderma)
//   2. 2-Minute Home Fertilizer & Seed Purity Tests + Statutory Govt MRP Shield
//   3. Climate Shock 24-Hour Rescue Protocols (Rain, Heatwave, Frost, Dry Spell)
//   4. Farmer's Private Season Cost & Savings Self-Diary (Offline + Firestore Sync)
//   5. 100% Free Public Extension Helplines (1800-180-1551, KVK, Soil Labs, PMFBY)
// ============================================================================

const DIY_BIO_REMEDIES = [
  {
    id: 'diy-neemastra',
    category: 'PEST_DEFENSE',
    badgeHi: 'रसचूसक कीट व सफेद मक्खी नियंत्रण',
    badgeEn: 'Sucking Pests & Whitefly Control',
    titleHi: 'नीमास्त्र (Neemastra) — घरेलू कीट रक्षक घोल',
    titleEn: 'Neemastra — On-Farm Botanical Pest Shield',
    savingsInrPerAcre: 1350,
    prepDays: '48 घंटे (2 दिन छाया में)',
    prepDaysEn: '48 Hours (Ferment in shade)',
    pumpDose: '1.5 लीटर नीमास्त्र / 15L पंप (पानी न मिलाएं या 1:10 छानकर)',
    pumpDoseEn: '1.5L extract per 15L knapsack pump (filtered)',
    ingredientsHi: '• 5 किलो हरी नीम पत्तियां (कुचली हुई) या 5 किलो निंबोली चूर्ण\n• 5 लीटर देसी गोमूत्र + 1 किलो ताजा गोबर\n• 100 लीटर साफ पानी (प्लास्टिक ड्रम)',
    ingredientsEn: '• 5 kg crushed green Neem leaves or Neem seed kernel powder\n• 5 L cow urine + 1 kg fresh cow dung\n• 100 L clean water in plastic drum',
    stepsHi: '1. ड्रम में 100 लीटर पानी लेकर कुचली नीम पत्तियां, गोमूत्र व गोबर मिलाएं।\n2. लकड़ी के डंडे से सुबह-शाम घड़ी की दिशा में 5 मिनट घुमाएं और बोरी से ढककर छाया में रखें।\n3. 48 घंटे बाद सूती कपड़े से छानकर शाम 4–6 बजे पत्तियों के नीचे छिड़काव करें।',
    stepsEn: '1. Mix crushed neem leaves, cow urine, and dung in 100L water.\n2. Stir clockwise morning & evening for 48 hours in shade covered with gunny bag.\n3. Filter through cotton cloth and spray on leaf undersides between 4:30–6:30 PM.'
  },
  {
    id: 'diy-jeevamrut',
    category: 'SOIL_NUTRITION',
    badgeHi: 'मृदा जैविक कार्बन व सूक्ष्मजीव वर्धक',
    badgeEn: 'Soil Organic Carbon & Microbe Booster',
    titleHi: 'जीवामृत (Jeevamrut) — मिट्टी की ताकत दोगुनी करें',
    titleEn: 'Jeevamrut — Living Soil Microbial Culture (1 Acre)',
    savingsInrPerAcre: 1800,
    prepDays: '4 से 5 दिन (गर्मी) / 7 दिन (सर्दी)',
    prepDaysEn: '4–5 Days in shade',
    pumpDose: 'सिंचाई पानी के साथ 200L/एकड़ या छानकर 1.5L / 15L पंप स्प्रे',
    pumpDoseEn: '200L/acre with irrigation water or 1.5L/15L foliar spray',
    ingredientsHi: '• 10 किलो देसी गाय का ताजा गोबर + 8–10 लीटर गोमूत्र\n• 1.5 किलो पुराना गुड़ + 1.5 किलो बेसन (चना/अरहर दाल आटा)\n• 1 मुट्ठी मेड़ या पीपल/बरगद के नीचे की जीवित मिट्टी + 180 लीटर पानी',
    ingredientsEn: '• 10 kg fresh cow dung + 8–10 L cow urine\n• 1.5 kg jaggery (gud) + 1.5 kg pulse flour (besan)\n• Handful of undisturbed bund/banyan soil + 180 L water',
    stepsHi: '1. गुड़ को पानी में घोलें, बेसन की गुठलियां तोड़कर ड्रम में गोबर-गोमूत्र व मेड़ की मिट्टी मिलाएं।\n2. जूट की बोरी से ढककर रोज 2 बार लकड़ी से घुमाएं (1 ग्राम मिट्टी में करोड़ों लाभदायक जीवाणु तैयार होते हैं)।\n3. सिंचाई की नाली में बूंद-बूंद छोड़ें या नमी वाली मिट्टी में छिड़कें — यूरिया/डीएपी की जरूरत 30% घटती है।',
    stepsEn: '1. Dissolve jaggery and pulse flour without lumps; mix dung, urine, and bund soil in 180L water.\n2. Cover with breathable jute sack in shade and stir twice daily for 4–5 days.\n3. Apply with irrigation water or drench moist root zone to unlock locked soil P & Zn.'
  },
  {
    id: 'diy-beejamrut',
    category: 'SEED_SHIELD',
    badgeHi: 'जड़ गलन व उकठा (Wilt) से बीज सुरक्षा',
    badgeEn: 'Natural Seed Coating Against Root Rot',
    titleHi: 'बीजामृत + ट्राइकोडर्मा घरेलू बीजोपचार विधि',
    titleEn: 'Beejamrut & Home Trichoderma Seed/FYM Enrichment',
    savingsInrPerAcre: 950,
    prepDays: '24 घंटे (बीजामृत) / 10 दिन (गोबर संवर्धन)',
    prepDaysEn: '24 Hours',
    pumpDose: '100 किलो बीज हेतु 20 लीटर बीजामृत घोल',
    pumpDoseEn: '20L Beejamrut for 100 kg seeds',
    ingredientsHi: '• 5 किलो गोबर + 5 लीटर गोमूत्र + 50 ग्राम बुझा चूना + 20 लीटर पानी\n• वैकल्पिक: 1 किलो सरकारी KVK ट्राइकोडर्मा कल्चर को 100 किलो सड़ी गोबर खाद में 10 दिन छाया में बढ़ाएं!',
    ingredientsEn: '• 5 kg cow dung + 5 L cow urine + 50 g slaked lime + 20 L water\n• Bonus tip: Multiply 1 kg KVK Trichoderma in 100 kg moist FYM under shade for 10 days!',
    stepsHi: '1. गोबर को कपड़े में बांधकर 12 घंटे पानी में लटकाएं और निचोड़ें, फिर गोमूत्र व चूने का पानी मिलाएं।\n2. बुवाई से पहले बीज पर हल्के हाथ से परत चढ़ाएं (छिलका न टूटे) और छाया में 30 मिनट सुखाकर बोएं।\n3. सोयाबीन, चना, अरहर और गेहूं में शुरुआती जड़ गलन (Collar/Root Rot) 80% तक रुकती है।',
    stepsEn: '1. Steep dung pouch in water for 12h, squeeze extract, add urine and lime water.\n2. Gently coat seeds before sowing, dry in shade (never direct sun) for 30 min, and sow.\n3. Prevents early collar rot, damping-off, and Fusarium wilt without chemical fungicides.'
  },
  {
    id: 'diy-brahmastra',
    category: 'PEST_DEFENSE',
    badgeHi: 'इल्ली, तना छेदक व फली छेदक नियंत्रण',
    badgeEn: 'Caterpillar, Pod Borer & Bollworm Control',
    titleHi: 'ब्रह्मास्त्र + पीला/नीला चिपचिपा ट्रैप (IPM कवच)',
    titleEn: 'Brahmastra Botanical Decoction + Sticky Traps',
    savingsInrPerAcre: 1950,
    prepDays: 'उबालकर ठंडा करने के बाद 48 घंटे',
    prepDaysEn: 'Boil + 48h rest',
    pumpDose: '400 मिली ब्रह्मास्त्र / 15L पंप + 15 चिपचिपे कार्ड/एकड़',
    pumpDoseEn: '400 ml per 15L knapsack pump + 15 sticky cards/acre',
    ingredientsHi: '• नीम पत्ती 3kg + करंज पत्ती 2kg + सीताफल पत्ती 2kg + धतूरा/अरंडी पत्ती 2kg + 10L गोमूत्र\n• घरेलू पीला ट्रैप: पीले टिन/प्लास्टिक शीट पर ग्रीस या अरंडी तेल लगाएं!',
    ingredientsEn: '• Crushed leaves of Neem (3kg), Pongamia/Karanj (2kg), Custard Apple (2kg), Castor/Datura (2kg) boiled in 10L cow urine\n• DIY Sticky Trap: Coat yellow/blue tin plates with castor oil or white grease!',
    stepsHi: '1. सभी कड़वी पत्तियों की चटनी बनाकर 10 लीटर गोमूत्र में धीमी आंच पर 3–4 उबाल आने तक पकाएं।\n2. 48 घंटे ठंडा होने के बाद कपड़े से छानकर बोतल में रखें (6 महीने तक सुरक्षित रहता है)।\n3. खेत में फसल की ऊंचाई से 6 इंच ऊपर पीले ग्रीस बोर्ड लगाएं — सफेद मक्खी व थ्रिप्स बिना जहर चिपक जाएंगे।',
    stepsEn: '1. Boil crushed bitter leaves in 10L cow urine for 3–4 boils, cool for 48h, and strain.\n2. Stores safely for up to 6 months in shade; dilute 400ml per 15L pump.\n3. Hang grease-coated yellow/blue plates 6 inches above crop canopy to trap whiteflies & thrips.'
  }
];

const INPUT_PURITY_TESTS = [
  {
    id: 'test-dap',
    inputNameHi: 'डी.ए.पी. (DAP 18:46:0) असली-नकली परीक्षण',
    inputNameEn: 'DAP (18:46:0) 2-Minute Home Purity Test',
    govtMrp: '₹1,350 प्रति 50 kg बोरी (अधिकतम सरकारी मूल्य)',
    govtMrpEn: 'Govt Statutory MRP: ₹1,350 per 50 kg bag',
    fraudRiskHi: 'नकली डीएपी में केवल मिट्टी/जिप्सम के दाने बनाकर काला रंग चढ़ाया जाता है।',
    fraudRiskEn: 'Counterfeit DAP often containsgranulated clay/gypsum dyed dark grey/black.',
    testStepsHi: '1. चूना रगड़ परीक्षण: हथेली पर 4–5 दाने डीएपी लेकर थोड़ा तंबाकू खाने वाला चूना मिलाएं और अंगूठे से रगड़ें — यदि तेज तीखी अमोनिया की गंध आए जिससे नाक के पास रखना मुश्किल हो, तो डीएपी असली है।\n2. तवा गर्म परीक्षण: लोहे के तवे पर दाने गर्म करने पर असली डीएपी के दाने फूलकर दोगुने हो जाते हैं।',
    testStepsEn: '1. Lime Rub Test: Rub 4–5 DAP granules on your palm with a pinch of slaked lime — genuine DAP releases a strong, pungent ammonia smell immediately.\n2. Hot Pan Test: Heat granules on an iron tawa — real DAP swells to nearly double its size; fake clay granules stay hard and flat.'
  },
  {
    id: 'test-zinc',
    inputNameHi: 'जिंक सल्फेट (ZnSO4 21% / 33%) मिलावट जांच',
    inputNameEn: 'Zinc Sulphate (ZnSO4) Adulteration Test',
    govtMrp: 'FCO मानक लेबल अनिवार्य (मैग्नीशियम सल्फेट की मिलावट से बचें)',
    govtMrpEn: 'Must carry FCO Registration (Watch out for cheap MgSO4 adulteration)',
    fraudRiskHi: 'सस्ते मैग्नीशियम सल्फेट (Epsom Salt) को जिंक सल्फेट बताकर बेचने का सबसे बड़ा धोखा होता है।',
    fraudRiskEn: 'Cheap Magnesium Sulphate crystals look identical to Zinc Sulphate and are widely used for adulteration.',
    testStepsHi: '1. डीएपी घोल परीक्षण: एक साफ कांच के गिलास में थोड़ा असली डीएपी पानी में घोलें और दूसरे गिलास में जिंक सल्फेट पानी में घोलें।\n2. दोनों घोल मिलाने पर यदि गाढ़ा सफेद दही जैसा थक्का (Precipitate) तुरंत बन जाए, तो जिंक सल्फेट 100% असली है! मैग्नीशियम सल्फेट में थक्का नहीं जमता।',
    testStepsEn: '1. DAP Reaction Test: Dissolve a spoon of genuine DAP in water in one glass, and Zinc Sulphate in another.\n2. Mix both clear solutions — genuine Zinc Sulphate immediately forms a thick, curdy white precipitate. Adulterated Magnesium Sulphate remains watery.'
  },
  {
    id: 'test-urea-mop',
    inputNameHi: 'नीम कोटेड यूरिया एवं पोटाश (MOP) जांच व MRP हक',
    inputNameEn: 'Neem-Coated Urea & MOP Potash Purity + MRP Rights',
    govtMrp: 'यूरिया: ₹266.50 / 45kg बोरी • पोटाश (MOP): सरकारी अनुदानित दर',
    govtMrpEn: 'Urea Statutory MRP: ₹266.50 / 45kg bag (No compulsory tagging allowed!)',
    fraudRiskHi: 'यूरिया के साथ जबरन अन्य अनचाहे टॉनिक/जाइम बांधना (Tagging) कानूनन अपराध है; नकली पोटाश में नमक रंगा जाता है।',
    fraudRiskEn: 'Forcing farmers to buy unrequested tonics with Urea (tagging) is illegal under Fertilizer Control Order; fake MOP is dyed salt.',
    testStepsHi: '1. यूरिया जांच: गिलास के पानी में यूरिया पूरी तरह घुल जाता है और गिलास बाहर से बर्फ जैसा ठंडा हो जाता है।\n2. पोटाश (MOP) जांच: थोड़े पोटाश पर पानी छिड़कें — असली पोटाश के दाने आपस में चिपकते नहीं हैं और पानी में डालने पर लाल भाग ऊपर तैरता है।',
    testStepsEn: '1. Urea Test: Real Urea dissolves completely in water and turns the glass noticeably cold (endothermic reaction).\n2. MOP Test: Moisten granules slightly — real MOP granules do not clump together, while dyed salt sticks and loses color immediately.'
  },
  {
    id: 'test-seed-germ',
    inputNameHi: 'बुवाई से पहले 100-बीज घरेलू अंकुरण परीक्षण',
    inputNameEn: 'Pre-Sowing 100-Seed Wet Newspaper Germination Test',
    govtMrp: 'हमेशा पक्का बिल व लॉट नंबर (Lot No.) संभाल कर रखें',
    govtMrpEn: 'Always keep Lot Number tag & receipt (Soybean min 70%, Wheat/Paddy 85% germination)',
    fraudRiskHi: 'कम अंकुरण वाला बीज बोने पर पूरी बोनी, डीजल व खाद दोबारा लगानी पड़ती है।',
    fraudRiskEn: 'Poor seed germination wastes tractor, labor, and critical monsoon moisture window.',
    testStepsHi: '1. बुवाई से 5 दिन पहले बोरी के अलग-अलग हिस्सों से गिनकर 100 बीज निकालें।\n2. गीले अखबार या जूट की बोरी पर कतार में रखकर मोड़ें और छाया में नमी बनाए रखें।\n3. 4–5 दिन बाद मजबूत अंकुरित बीज गिनें — यदि सोयाबीन में 75+ गिनती है तो सामान्य बीज दर रखें; 60–70 होने पर बीज मात्रा 15% बढ़ाएं; 60 से कम हो तो वह बीज खेत में न बोएं!',
    testStepsEn: '1. 5 days before sowing, pick 100 random seeds and place them spaced apart on a damp newspaper/gunny cloth.\n2. Roll gently, keep moist in shade for 4–5 days, and count healthy sprouts.\n3. If <70% in Soybean or <80% in Wheat/Paddy, adjust seed rate or replace seed lot before risking the whole field!'
  }
];

const CLIMATE_SHOCK_GUIDES = [
  {
    id: 'shock-rain',
    icon: 'fa-cloud-showers-heavy text-blue',
    titleHi: 'अतिवृष्टि एवं खेत में जलभराव (Waterlogging) — प्रथम 24 घंटे',
    titleEn: 'Sudden Heavy Rain & Field Waterlogging — First 24h Rescue',
    stepsHi: [
      'खेत के निचले कोने में तुरंत जल-निकासी नाली खोलें — सोयाबीन/दलहन की जड़ें 48 घंटे से ज्यादा पानी रुकने पर गलने लगती हैं।',
      'पानी निकलने के बाद पीलापन दिखे तो यूरिया बिल्कुल न फेंकें; इसके बजाय 100 ग्राम 19:19:19 (NPK घुलनशील) प्रति 15L पंप पत्तियों पर स्प्रे करें ताकि पत्तियों से तुरंत भोजन मिले।',
      'जड़ गलन रोकने हेतु नमी कम होते ही ट्राइकोडर्मा समृद्ध गोबर खाद मेड़/कतार में भुरकाव करें व फसल क्षति होने पर 72 घंटे के भीतर 14447 पर PMFBY सूचना दें।'
    ],
    stepsEn: [
      'Open drainage trenches at the lowest field corner immediately — pulse/soybean roots suffocate after 48h standing water.',
      'Avoid broadcasting soil Urea on waterlogged roots; instead apply foliar NPK 19:19:19 @ 75–100g per 15L pump once foliage dries.',
      'Apply Trichoderma-enriched FYM against root rot and log PMFBY intimation on 14447 within 72 hours if inundation persists.'
    ]
  },
  {
    id: 'shock-heat',
    icon: 'fa-temperature-arrow-up text-red',
    titleHi: 'तेज गर्मी / मार्च हीटवेव (>35°C) से दाना सिकुड़ने से बचाव',
    titleEn: 'Terminal Heatwave (>35°C) Grain Shriveling Protection',
    stepsHi: [
      'गेहूं/चना में दूधिया अवस्था पर तापमान अचानक 34°C पार करे तो शाम के समय (हवा शांत होने पर) हल्की सिंचाई करें — तेज हवा में दिन में पानी न लगाएं वरना फसल गिर सकती है।',
      'पोटेशियम और फॉस्फोरस रक्षक स्प्रे: 00:52:34 (मोनो पोटेशियम फॉस्फेट) 150 ग्राम प्रति 15 लीटर पंप सुबह-शाम छिड़कें — यह दाने का वजन 12–15% घटने से बचाता है।'
    ],
    stepsEn: [
      'Apply light evening irrigation only when wind speed is calm (<8 km/h) to cool canopy microclimate by 2–3°C without lodging.',
      'Foliar spray Mono Potassium Phosphate (00:52:34) @ 150g per 15L knapsack pump to maintain grain turgor and test weight.'
    ]
  },
  {
    id: 'shock-frost',
    icon: 'fa-snowflake text-blue',
    titleHi: 'पाला एवं शीतलहर (Frost <4°C) — सरसों, आलू, चना व सब्जी बचाव',
    titleEn: 'Winter Frost (<4°C) Night Rescue for Mustard, Potato & Gram',
    stepsHi: [
      'जिस रात पाला पड़ने की संभावना हो (आसमान साफ और हवा बिल्कुल बंद हो), खेत में हल्की सिंचाई अवश्य करें — गीली मिट्टी का तापमान सूखी मिट्टी से 1.5°C–2°C अधिक रहता है।',
      'घुलनशील गंधक (Wettable Sulphur 80% WP) 30 ग्राम प्रति 15 लीटर पंप का छिड़काव पौधों की कोशिकाओं को जमने से बचाता है। (पराली या कचरा कभी न जलाएं, केवल नमी व मल्चिंग अपनाएं)।'
    ],
    stepsEn: [
      'Apply light irrigation on clear, windless frost-warning nights — moist soil retains heat and keeps canopy 1.5–2°C warmer.',
      'Spray Wettable Sulphur 80% WP @ 30g per 15L pump to boost plant cell sap concentration against freezing injury.'
    ]
  },
  {
    id: 'shock-dryspell',
    icon: 'fa-sun-plant-wilt text-amber',
    titleHi: 'मानसून के बीच 15–20 दिन बारिश रुकना (Dry Spell) — फूल झड़ना रोकें',
    titleEn: 'Mid-Monsoon 15–20 Day Dry Spell — Stop Flower & Pod Drop',
    stepsHi: [
      'कतारों के बीच कोल्पा/डोरा (हल्की गुड़ाई) चलाएं — इससे मिट्टी की दरारें बंद होती हैं और नीचे की नमी भाप बनकर नहीं उड़ती (Dust Mulching)।',
      'पोटेशियम नाइट्रेट (13:00:45) 150 ग्राम प्रति 15 लीटर पंप का स्प्रे पत्तियों के रंध्र नियंत्रित कर सूखा सहने की क्षमता 10 दिन बढ़ा देता है।'
    ],
    stepsEn: [
      'Run shallow inter-row hoeing (Dora/Kolpa) to seal soil cracks and create a dust mulch that locks subsoil moisture.',
      'Spray Potassium Nitrate (13:00:45) @ 150g per 15L pump to regulate stomatal water loss and prevent flower shedding.'
    ]
  }
];

const FREE_PUBLIC_HELPLINES = [
  {
    nameHi: 'किसान कॉल सेंटर (भारत सरकार — कृषि मंत्रालय)',
    nameEn: 'Kisan Call Centre (Govt of India — Ministry of Agriculture)',
    phone: '18001801551',
    displayPhone: '1800-180-1551',
    hoursHi: 'सुबह 6:00 से रात 10:00 बजे (सभी 7 दिन • 22 भारतीय भाषाएं • पूर्णतः निःशुल्क)',
    hoursEn: '6:00 AM – 10:00 PM Daily • All 22 Indian Languages • 100% Toll-Free',
    descHi: 'सीधे कृषि स्नातक एवं वरिष्ठ ICAR/KVK विशेषज्ञों से अपनी मातृभाषा में रोग, मौसम व सरकारी योजना पूछें।'
  },
  {
    nameHi: 'प्रधानमंत्री फसल बीमा राष्ट्रीय हेल्पलाइन (PMFBY)',
    nameEn: 'National Crop Insurance Helpline (PMFBY 72h Loss Intimation)',
    phone: '14447',
    displayPhone: '14447',
    hoursHi: 'ओलावृष्टि/जलभराव के 72 घंटे के भीतर सीधा नुकसान दर्ज कराएं (बिना किसी दलाल के)',
    hoursEn: 'Direct 72-hour crop damage intimation without middlemen',
    descHi: 'बीमा पॉलिसी स्थिति, प्रीमियम और फसल खराबी की सीधी शिकायत एवं डॉकेट नंबर प्राप्त करें।'
  },
  {
    nameHi: 'नजदीकी कृषि विज्ञान केंद्र (ICAR - KVK) निःशुल्क मिट्टी व पौध जांच',
    nameEn: 'District Krishi Vigyan Kendra (ICAR - KVK) Free Plant & Soil Lab',
    phone: '18001801551',
    displayPhone: 'kvk.icar.gov.in / 1800-180-1551',
    hoursHi: 'सोमवार–शनिवार (सुबह 10:00 – शाम 5:00) • ₹0 परामर्श शुल्क',
    hoursEn: 'Mon–Sat • Free Scientist Field Advisory & Breeder Seed Info',
    descHi: 'रोगग्रस्त पौधा जड़ सहित अखबार में लपेटकर जिले के KVK पादप रोग वैज्ञानिक को निःशुल्क दिखाएं।'
  }
];

const DIARY_STORAGE_KEY = 'krishi_private_farm_diary_v1';

function getPrivateFarmDiary() {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { id: 'd1', date: '2026-10-12', type: 'EXPENSE', categoryHi: 'बीज एवं बुवाई (Seed & Sowing)', amountInr: 4200, noteHi: 'सोयाबीन JS 20-34 बुवाई व ट्रैक्टर' },
    { id: 'd2', date: '2026-10-28', type: 'EXPENSE', categoryHi: 'संतुलित खाद (DAP + ZSB)', amountInr: 2845, noteHi: 'मृदा कार्ड अनुसार संतुलित मात्रा' },
    { id: 'd3', date: '2026-11-08', type: 'SAVING', categoryHi: 'घरेलू नीमास्त्र व अनावश्यक स्प्रे बचत', amountInr: 2200, noteHi: 'गलत YMV कीटनाशक न खरीदकर शुद्ध बचत!' }
  ];
}

function savePrivateFarmDiary(entries) {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {}
  if (window.KrishiGoogleCloud && typeof window.KrishiGoogleCloud.syncDiaryToFirestoreFree === 'function') {
    window.KrishiGoogleCloud.syncDiaryToFirestoreFree(entries);
  }
}

window.switchGuidanceTab = function(tabKey, btnEl) {
  document.querySelectorAll('#viewClinic .clinic-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  const panes = {
    diy: 'guidePaneDiy',
    purity: 'guidePanePurity',
    climate: 'guidePaneClimate',
    diary: 'guidePaneDiary',
    helpline: 'guidePaneHelpline'
  };
  Object.entries(panes).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', k !== tabKey);
  });
};

window.renderSelfReliantGuidanceHub = function() {
  const isEn = (window.currentLanguage || 'hi') === 'en';

  // 1. DIY Bio-Remedies
  const diyBox = document.getElementById('diyRemediesList');
  if (diyBox) {
    diyBox.innerHTML = DIY_BIO_REMEDIES.map(r => {
      const title = isEn ? r.titleEn : r.titleHi;
      const badge = isEn ? r.badgeEn : r.badgeHi;
      const prep = isEn ? r.prepDaysEn : r.prepDays;
      const dose = isEn ? r.pumpDoseEn : r.pumpDose;
      const ing = isEn ? r.ingredientsEn : r.ingredientsHi;
      const steps = isEn ? r.stepsEn : r.stepsHi;
      const speechPayload = `${title}. ${ing}. ${steps}`.replace(/'/g, '');
      return `
        <div class="agri-product-card guidance-pure-card">
          <div class="prod-card-top">
            <div class="prod-title-group">
              <span class="prod-badge bio"><i class="fa-solid fa-leaf"></i> <span data-translatable="true">${badge}</span></span>
              <h5 data-translatable="true">${title}</h5>
            </div>
            <button type="button" class="card-listen-chip" onclick="window.speakInFarmerLanguage('${speechPayload.replace(/\\n/g, ' ')}')">
              <i class="fa-solid fa-volume-high"></i> <span>${gp('listenBtn', 'सुनें')}</span>
            </button>
          </div>
          <div class="prod-meta-tags">
            <span class="quality-pill"><i class="fa-solid fa-piggy-bank"></i> ${isEn ? 'Est. Saving:' : 'अनुमानित बचत:'} ₹${r.savingsInrPerAcre}/${isEn ? 'acre' : 'एकड़'}</span>
            <span class="lot-pill"><i class="fa-regular fa-clock"></i> <span data-translatable="true">${prep}</span></span>
            <span class="lot-pill"><i class="fa-solid fa-spray-can-sparkles"></i> <span data-translatable="true">${dose}</span></span>
          </div>
          <div class="prod-solution-note" style="white-space:pre-line; margin-bottom:8px;" data-translatable="true"><strong>${isEn ? 'Ingredients:' : 'आवश्यक घरेलू सामग्री:'}</strong>\n${ing}</div>
          <div class="prod-solution-note" style="background:#f0fdf4; border-left:3px solid #16a34a; white-space:pre-line;" data-translatable="true"><strong>${isEn ? 'Step-by-Step Method:' : 'बनाने व प्रयोग की विधि:'}</strong>\n${steps}</div>
        </div>
      `;
    }).join('');
  }

  // 2. Fake Fertilizer & Seed Purity Tests
  const purityBox = document.getElementById('purityTestsList');
  if (purityBox) {
    purityBox.innerHTML = INPUT_PURITY_TESTS.map(item => {
      const title = isEn ? item.inputNameEn : item.inputNameHi;
      const mrp = isEn ? item.govtMrpEn : item.govtMrp;
      const risk = isEn ? item.fraudRiskEn : item.fraudRiskHi;
      const steps = isEn ? item.testStepsEn : item.testStepsHi;
      const speechPayload = `${title}. ${mrp}. ${steps}`.replace(/'/g, '');
      return `
        <div class="agri-product-card guidance-pure-card">
          <div class="prod-card-top">
            <div class="prod-title-group">
              <span class="prod-badge nutrient"><i class="fa-solid fa-shield-halved"></i> <span data-translatable="true">${mrp}</span></span>
              <h5 data-translatable="true">${title}</h5>
            </div>
            <button type="button" class="card-listen-chip" onclick="window.speakInFarmerLanguage('${speechPayload.replace(/\\n/g, ' ')}')">
              <i class="fa-solid fa-volume-high"></i> <span>${gp('listenBtn', 'सुनें')}</span>
            </button>
          </div>
          <p style="font-size:12px; color:#b91c1c; background:#fef2f2; padding:8px 10px; border-radius:8px; margin:8px 0;" data-translatable="true">⚠️ ${risk}</p>
          <div class="prod-solution-note" style="white-space:pre-line;" data-translatable="true">${steps}</div>
        </div>
      `;
    }).join('');
  }

  // 3. Climate Shock Rescue Guides
  const climateBox = document.getElementById('climateRescueList');
  if (climateBox) {
    climateBox.innerHTML = CLIMATE_SHOCK_GUIDES.map(c => {
      const title = isEn ? c.titleEn : c.titleHi;
      const steps = isEn ? c.stepsEn : c.stepsHi;
      const speechPayload = `${title}. ${steps.join(' ')}`.replace(/'/g, '');
      return `
        <div class="agri-product-card guidance-pure-card">
          <div class="prod-card-top">
            <h5 style="display:flex; align-items:center; gap:8px;"><i class="fa-solid ${c.icon}"></i> <span data-translatable="true">${title}</span></h5>
            <button type="button" class="card-listen-chip" onclick="window.speakInFarmerLanguage('${speechPayload}')">
              <i class="fa-solid fa-volume-high"></i> <span>${gp('listenBtn', 'सुनें')}</span>
            </button>
          </div>
          <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
            ${steps.map((s, idx) => `<div class="prod-solution-note" data-translatable="true"><strong>${idx + 1}.</strong> ${s}</div>`).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Farmer's Private Cost & Savings Self-Diary
  window.renderPrivateDiaryEntries();

  // 5. Free Public Extension Helplines
  const helpBox = document.getElementById('freeHelplinesList');
  if (helpBox) {
    helpBox.innerHTML = FREE_PUBLIC_HELPLINES.map(h => {
      const name = isEn ? h.nameEn : h.nameHi;
      const hrs = isEn ? h.hoursEn : h.hoursHi;
      return `
        <div class="agri-product-card guidance-pure-card">
          <span class="prod-badge bio"><i class="fa-solid fa-landmark"></i> 100% ${isEn ? 'Free Govt Service' : 'निःशुल्क सरकारी सेवा'}</span>
          <h5 style="margin-top:6px;" data-translatable="true">${name}</h5>
          <p style="font-size:12px; color:#047857; font-weight:600; margin:4px 0;" data-translatable="true"><i class="fa-regular fa-clock"></i> ${hrs}</p>
          <p style="font-size:12px; color:#334155; margin-bottom:10px;" data-translatable="true">${h.descHi}</p>
          <a href="tel:${h.phone}" class="btn btn-primary btn-block" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
            <i class="fa-solid fa-phone-volume"></i> <span>${isEn ? 'Call Free:' : 'निःशुल्क कॉल करें:'} ${h.displayPhone}</span>
          </a>
        </div>
      `;
    }).join('');
  }

  if (typeof window.translateVisibleDynamicCards === 'function') {
    window.translateVisibleDynamicCards();
  }
};

window.renderPrivateDiaryEntries = function() {
  const entries = getPrivateFarmDiary();
  const isEn = (window.currentLanguage || 'hi') === 'en';
  let totalSpent = 0;
  let totalSaved = 0;
  entries.forEach(e => {
    if (e.type === 'SAVING') totalSaved += Number(e.amountInr || 0);
    else totalSpent += Number(e.amountInr || 0);
  });

  const spentEl = document.getElementById('diaryTotalSpent');
  const savedEl = document.getElementById('diaryTotalSaved');
  const listEl = document.getElementById('privateDiaryEntriesList');
  if (spentEl) spentEl.innerText = `₹${totalSpent.toLocaleString('en-IN')}`;
  if (savedEl) savedEl.innerText = `₹${totalSaved.toLocaleString('en-IN')}`;

  if (listEl) {
    listEl.innerHTML = entries.map(e => `
      <div class="khata-entry-card">
        <div class="khata-entry-info">
          <h6 data-translatable="true">${e.categoryHi} <span class="badge-credit-mode" style="background:${e.type === 'SAVING' ? '#dcfce7' : '#e0f2fe'}; color:${e.type === 'SAVING' ? '#166534' : '#0369a1'};">${e.type === 'SAVING' ? (isEn ? 'Saved' : 'बचत') : (isEn ? 'Cost' : 'लागत')}</span></h6>
          <p data-translatable="true">${e.noteHi || ''} • <small>${e.date}</small></p>
        </div>
        <div class="khata-entry-amt">
          <strong class="${e.type === 'SAVING' ? 'text-green' : ''}">₹${Number(e.amountInr).toLocaleString('en-IN')}</strong>
        </div>
      </div>
    `).join('');
  }
};

window.addPrivateDiaryEntry = function() {
  const typeEl = document.getElementById('diaryEntryType');
  const catEl = document.getElementById('diaryEntryCategory');
  const amtEl = document.getElementById('diaryEntryAmount');
  const noteEl = document.getElementById('diaryEntryNote');
  const amt = Number(amtEl ? amtEl.value : 0);
  if (!amt || amt <= 0) return;

  const entries = getPrivateFarmDiary();
  entries.unshift({
    id: 'd-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: typeEl ? typeEl.value : 'EXPENSE',
    categoryHi: catEl ? catEl.value : 'खेत कार्य',
    amountInr: amt,
    noteHi: noteEl ? noteEl.value.trim() : ''
  });
  savePrivateFarmDiary(entries);
  if (amtEl) amtEl.value = '';
  if (noteEl) noteEl.value = '';
  window.renderPrivateDiaryEntries();
};
