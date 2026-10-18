import { 
  UserRepository, 
  ConsentRepository, 
  FarmRepository, 
  SoilCardRepository, 
  CropCycleRepository, 
  DiagnosisRepository,
  EscalationRepository, 
  InventoryRepository,
  AuditRepository,
  FarmerActivityLogRepository,
  MandiPriceRepository,
  SchemeApplicationRepository,
  CommunityOutbreakRepository,
  StateAgroChallengeRepository,
  ChcMachineryBookingRepository,
  AgriGraduateLicenseRepository,
  CertifiedInputProductRepository,
  AgronomistPrescriptionRepository,
  FarmerOrderKhataRepository,
  AgriConsultationBookingRepository
} from './repositories';
import { AuthService } from '../services/auth-dpdp/authService';

export class DatabaseSeeder {
  static seedAll() {
    console.log('🌱 Seeding production database with standard agricultural datasets...');

    // 1. Seed Core User Accounts (Including Master Admin)
    const masterAdmin = UserRepository.upsert({
      id: 'admin-krishi-root-01',
      mobile_number: '9800000000',
      username: 'Admin',
      password_hash: AuthService.hashPassword('Vikas'),
      full_name: 'Vikas Chaturvedi (Admin)',
      role: 'SUPER_ADMIN',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      taluka: 'Badnagar',
      village: 'Mullapura',
      pin_code: '456006',
      preferred_language: 'hi',
      is_profile_complete: 1
    });

    const farmer = UserRepository.upsert({
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      mobile_number: '9876543210',
      username: 'ramesh_patel',
      password_hash: AuthService.hashPassword('Kisan@123'),
      full_name: 'Ramesh Patel (रमेश पटेल)',
      role: 'FARMER',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      taluka: 'Badnagar',
      village: 'Mullapura',
      pin_code: '456006',
      preferred_language: 'hi',
      is_profile_complete: 1
    });

    const clinic = UserRepository.upsert({
      id: '8a2ceb3c-2a6c-4cad-8acc-1a0c6a2dca5c',
      mobile_number: '9822012345',
      username: 'ujjain_clinic',
      password_hash: AuthService.hashPassword('Clinic@123'),
      full_name: 'Ujjain Kisan Seva Kendra (Agri-Clinic #12)',
      role: 'CLINIC_OPERATOR',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      taluka: 'Ujjain City',
      village: 'Agri Hub Market Yard',
      pin_code: '456001',
      preferred_language: 'hi',
      is_profile_complete: 1
    });

    const agronomist = UserRepository.upsert({
      id: '7f1bda2b-1b5b-3bac-7abb-0b9b5a1cba4b',
      mobile_number: '9811098765',
      username: 'dr_suresh',
      password_hash: AuthService.hashPassword('Doctor@123'),
      full_name: 'Dr. Suresh Verma (Senior Agronomist, KVK)',
      role: 'AGRONOMIST',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      taluka: 'KVK Center',
      village: 'Research Farm',
      pin_code: '456010',
      preferred_language: 'hi',
      is_profile_complete: 1
    });

    // 2. Seed DPDP Consent Record
    const consentPurposes = [
      'AGRONOMIC_DIAGNOSIS_AND_ADVISORY',
      'HYPERLOCAL_WEATHER_INTEGRATION',
      'SOIL_HEALTH_ANALYTICS',
      'AGRI_CLINIC_EXPERT_ESCALATION'
    ];
    ConsentRepository.recordConsent(
      farmer.id,
      'v2026.1',
      'hi',
      consentPurposes,
      'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      'sha256:127.0.0.1_ip_hash'
    );

    // 3. Seed Farm Parcel
    const defaultFarmId = '4fa85f64-5717-4562-b3fc-2c963f66af11';
    FarmRepository.create({
      id: defaultFarmId,
      farmer_id: farmer.id,
      farm_name: 'North Field (उत्तर वाला खेत)',
      survey_number: '142/2-Khasra',
      total_area: 4.5,
      area_unit: 'ACRE',
      soil_type: 'BLACK_COTTON',
      irrigation_type: 'DRIP',
      latitude: 23.1793,
      longitude: 75.7849,
      elevation_meters: 494.0,
      has_soil_card: 1
    });

    // 4. Seed Soil Health Card
    SoilCardRepository.upsert({
      id: '5ba85f64-5717-4562-b3fc-2c963f66af33',
      farm_id: defaultFarmId,
      test_date: '2026-05-20',
      testing_lab_name: 'KVK Soil Testing Lab, Ujjain',
      ph: 7.8,
      electrical_conductivity: 0.42,
      organic_carbon_percent: 0.51,
      nitrogen_kg_ha: 195.0,
      phosphorus_kg_ha: 22.0,
      potassium_kg_ha: 340.0,
      zinc_ppm: 0.52,
      iron_ppm: 4.8,
      boron_ppm: 0.45,
      sulphur_ppm: 9.8,
      is_deficient_zinc: 1,
      is_deficient_nitrogen: 1,
      is_deficient_potash: 0,
      nutrient_status_summary_localized: 'मृदा में जिंक (जस्ता) और सल्फर की भारी कमी है। उपलब्ध नाइट्रोजन कम तथा पोटाश पर्याप्त मात्रा में है।'
    });

    // 5. Seed Crop Cycle
    const defaultCycleId = '3ca85f64-5717-4562-b3fc-2c963f66af22';
    CropCycleRepository.create({
      id: defaultCycleId,
      farm_id: defaultFarmId,
      crop_id: 'CROP_SOYBEAN',
      crop_name: 'Soybean (सोयाबीन)',
      variety: 'JS 20-34 (Certified)',
      sowingDate: '2026-06-25',
      current_growth_stage: 'VEGETATIVE',
      expected_harvest_date: '2026-10-15',
      seed_treatment_applied: 1,
      status: 'ACTIVE',
      days_since_sowing: 40,
      sowing_date: '2026-06-25'
    } as any);

    // 6. Seed Sample Diagnosis Record (for Foreign Key integrity)
    const sampleDiagId = '1da85f64-5717-4562-b3fc-2c963f66af77';
    DiagnosisRepository.saveDiagnosis({
      id: sampleDiagId,
      user_id: farmer.id,
      farm_id: defaultFarmId,
      crop_cycle_id: defaultCycleId,
      image_url: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=600&auto=format&fit=crop&q=80',
      blur_score: 0.82,
      brightness_score: 0.79,
      is_acceptable_quality: 1,
      status: 'NEEDS_CLARIFICATION',
      confidence_score: 0.52,
      diagnosis_category: 'NUTRITIONAL_DEFICIENCY',
      primary_diagnosis: {
        diseaseCode: 'DIS_ZINC_DEFICIENCY',
        commonNameEn: 'Zinc Deficiency',
        commonNameHi: 'जिंक (जस्ता) की कमी',
        scientificName: 'Zinc (Zn) Mineral Deficiency',
        confidenceScore: 0.52
      },
      differential_diagnoses: [
        { diseaseCode: 'DIS_SOYBEAN_RUST', confidenceScore: 0.48 }
      ],
      context_data: { cropSpecies: 'SOYBEAN', farmId: defaultFarmId },
      submitted_at: new Date().toISOString(),
      completed_at: null
    });

    // 7. Seed KVK Escalation Item
    const sampleEscalationId = '9ea85f64-5717-4562-b3fc-2c963f66af99';
    EscalationRepository.create({
      id: sampleEscalationId,
      diagnosis_id: sampleDiagId,
      farmer_id: farmer.id,
      farmer_name: 'Ramesh Patel',
      farmer_mobile_masked: 'XXXXXX3210',
      crop_name: 'Soybean (JS 20-34)',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      ai_tentative_prediction: 'Zinc Deficiency vs Rust (52% ambiguous)',
      tentative_confidence: 0.52,
      image_url: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=600&auto=format&fit=crop&q=80',
      status: 'PENDING_ASSIGNMENT',
      urgency: 'URGENT',
      sla_expires_at: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
      assigned_agronomist_name: 'Dr. Suresh Verma (Senior Agronomist, KVK)',
      expert_advice_localized: null,
      submitted_at: new Date().toISOString(),
      resolved_at: null
    });

    // 8. Seed CIB&RC Certified Agri-Clinic Inventory
    const inventoryItems = [
      {
        id: 'inv-zinc-01',
        product_name: 'Chelated Zinc 12% EDTA',
        brand_name: 'IFFCO NutriZinc',
        category: 'NUTRIENT_FOLIAR' as const,
        active_ingredient: 'Zinc EDTA 12%',
        cibrc_reg_no: 'FCO-SCH-1-ZN12',
        batch_no: 'ZN-2026-B08',
        mfg_date: '2026-04-10',
        exp_date: '2028-04-09',
        mrp_inr: 280.0,
        stock_units: 85,
        unit_type: 'PACK_500G',
        is_state_restricted: 0
      },
      {
        id: 'inv-pseudomonas-01',
        product_name: 'Pseudomonas fluorescens 1.0% WP',
        brand_name: 'BioCure-F',
        category: 'BIO_PESTICIDE' as const,
        active_ingredient: 'Pseudomonas fluorescens',
        cibrc_reg_no: 'CIR-8842/2019-BIO(WP)-412',
        batch_no: 'PF-2026-K01',
        mfg_date: '2026-05-15',
        exp_date: '2027-05-14',
        mrp_inr: 240.0,
        stock_units: 42,
        unit_type: 'PACK_1KG',
        is_state_restricted: 0
      },
      {
        id: 'inv-hexaconazole-01',
        product_name: 'Hexaconazole 5% SC',
        brand_name: 'Contaf Plus',
        category: 'CHEMICAL_FUNGICIDE' as const,
        active_ingredient: 'Hexaconazole',
        cibrc_reg_no: 'CIR-2195/2014-HEXA(SC)-890',
        batch_no: 'HX-2026-09A',
        mfg_date: '2026-03-01',
        exp_date: '2028-02-28',
        mrp_inr: 450.0,
        stock_units: 30,
        unit_type: 'BOTTLE_500ML',
        is_state_restricted: 0
      },
      {
        id: 'inv-emamectin-01',
        product_name: 'Emamectin Benzoate 5% SG',
        brand_name: 'Proclaim Super',
        category: 'CHEMICAL_INSECTICIDE' as const,
        active_ingredient: 'Emamectin Benzoate',
        cibrc_reg_no: 'CIR-3412/2018-EMA(SG)-112',
        batch_no: 'EB-2026-04M',
        mfg_date: '2026-06-01',
        exp_date: '2028-05-31',
        mrp_inr: 390.0,
        stock_units: 50,
        unit_type: 'PACK_100G',
        is_state_restricted: 0
      }
    ];

    for (const item of inventoryItems) {
      InventoryRepository.seedBatch(item);
    }

    // 9. Seed Initial Farmer Login & Activity Record
    FarmerActivityLogRepository.logActivity({
      id: 'log-seed-ramesh-01',
      user_id: farmer.id,
      phone_number: '+919876543210',
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      location: 'Village Dharampuri, Dhar (M.P.) [GPS: 22.7196° N, 75.8577° E]',
      crop: 'SOYBEAN (JS 20-34)',
      health_status: '94.2% Confidence - शारीरिक पोषण विकार (Nutritional Disorder Detected)',
      deficiencies: 'जिंक की कमी (Zinc Deficiency 0.45 ppm / Interveinal Chlorosis)',
      suggestions: 'चरण 1: जिंक सल्फेट 21% @ 500g + 250g चूना प्रति 200L पानी। चरण 2: 1kg ZSB जैव उर्वरक मृदा में। चरण 3: शून्य रासायनिक कीटनाशक।',
      session_id: 'sess-init-001',
      ip_address: '127.0.0.1',
      user_agent: 'AgriScan-PWA/2026.1 (Android; Pixel 7)'
    });

    // 10. Seed Mandi Bhav, Sarkari Schemes & Community Outbreaks
    this.seedEcosystemData(farmer.id);

    AuditRepository.log('SYSTEM_SEED', 'SYSTEM', 'DATABASE', 'ALL', { status: 'SUCCESS', seededRecords: 28 });
    console.log('✅ Production database successfully seeded.');
  }

  static seedEcosystemData(defaultUserId: string = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d') {
    const mandiItems = [
      {
        id: 'mandi-ujjain-soybean',
        crop_code: 'SOYBEAN',
        crop_name_en: 'Soybean',
        crop_name_hi: 'सोयाबीन (Yellow)',
        variety: 'JS 20-34 / FAQ',
        mandi_name: 'Ujjain Chimanganj APMC Mandi',
        state: 'Madhya Pradesh',
        district: 'Ujjain',
        min_price_qtl: 4680,
        modal_price_qtl: 5120,
        max_price_qtl: 5410,
        msp_price_qtl: 4892,
        price_change_24h: 145,
        arrival_tonnes: 840,
        distance_km: 12,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Modal price is ₹228/qtl above Govt MSP (₹4,892) with strong solvent plant buying. Sell graded dry lot (<10% moisture).',
        advisory_hi: 'मंडी भाव सरकारी MSP (₹4,892) से ₹228/क्विंटल ऊपर है और प्लांट की मांग तेज है। 10% से कम नमी वाला साफ माल बेचने का उत्तम समय।'
      },
      {
        id: 'mandi-indore-soybean',
        crop_code: 'SOYBEAN',
        crop_name_en: 'Soybean',
        crop_name_hi: 'सोयाबीन (Graded)',
        variety: 'RVS 2001-4 / Seed Grade',
        mandi_name: 'Indore Laxmibai Nagar APMC',
        state: 'Madhya Pradesh',
        district: 'Indore',
        min_price_qtl: 4750,
        modal_price_qtl: 5240,
        max_price_qtl: 5580,
        msp_price_qtl: 4892,
        price_change_24h: 180,
        arrival_tonnes: 1120,
        distance_km: 54,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Highest regional realization (+₹120/qtl over Ujjain). Profitable if transporting >25 quintals.',
        advisory_hi: 'इंदौर मंडी में उज्जैन से ₹120/क्विंटल अधिक भाव है। 25 क्विंटल से अधिक माल होने पर इंदौर ले जाना अधिक लाभकारी।'
      },
      {
        id: 'mandi-khanna-paddy',
        crop_code: 'PADDY',
        crop_name_en: 'Paddy (Rice)',
        crop_name_hi: 'धान (Pusa Basmati / PR-126)',
        variety: 'PR-126 / Basmati 1509',
        mandi_name: 'Khanna Grain Market APMC',
        state: 'Punjab',
        district: 'Ludhiana',
        min_price_qtl: 2300,
        modal_price_qtl: 2890,
        max_price_qtl: 3450,
        msp_price_qtl: 2320,
        price_change_24h: 65,
        arrival_tonnes: 2150,
        distance_km: 18,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Export demand lifting Basmati & PR-126 above MSP. Ensure moisture <17% at procurement gate.',
        advisory_hi: 'निर्यात मांग के कारण धान का भाव MSP से ऊपर है। तौल से पहले नमी 17% से कम रखें।'
      },
      {
        id: 'mandi-akola-cotton',
        crop_code: 'COTTON',
        crop_name_en: 'Cotton (Kapas)',
        crop_name_hi: 'कपास (Long Staple)',
        variety: 'H-4 / Bunny Bt',
        mandi_name: 'Akola Cotton APMC Yard',
        state: 'Maharashtra',
        district: 'Akola',
        min_price_qtl: 7150,
        modal_price_qtl: 7680,
        max_price_qtl: 8120,
        msp_price_qtl: 7521,
        price_change_24h: -40,
        arrival_tonnes: 620,
        distance_km: 24,
        sell_hold_signal: 'HOLD_FOR_RISE' as const,
        advisory_en: 'High new arrivals temporarily softened prices. Hold 1st picking white lint for 10-14 days or sell to CCI center.',
        advisory_hi: 'नई आवक बढ़ने से भाव में मामूली नरमी है। पहली चुनाई का साफ कपास 10-14 दिन रोककर बेचें या CCI केंद्र पर पंजीकरण करें।'
      },
      {
        id: 'mandi-jalgaon-banana',
        crop_code: 'BANANA',
        crop_name_en: 'Banana',
        crop_name_hi: 'केला (Grand Naine Export)',
        variety: 'Grand Naine (G-9)',
        mandi_name: 'Jalgaon Raver Banana e-NAM Hub',
        state: 'Maharashtra',
        district: 'Jalgaon',
        min_price_qtl: 1450,
        modal_price_qtl: 1920,
        max_price_qtl: 2350,
        msp_price_qtl: 1600,
        price_change_24h: 110,
        arrival_tonnes: 490,
        distance_km: 22,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Festive North India cold-chain dispatch active. Spotless bunches (free from Sigatoka) command ₹350/qtl premium.',
        advisory_hi: 'त्योहारी मांग से उत्तर भारत के लिए लदान तेज है। बेदाग घार को ₹350/क्विंटल अतिरिक्त प्रीमियम मिल रहा है।'
      },
      {
        id: 'mandi-sehore-wheat',
        crop_code: 'WHEAT',
        crop_name_en: 'Wheat',
        crop_name_hi: 'गेहूँ (Sharbati / Lokwan)',
        variety: 'MP Sharbati / HI-1544',
        mandi_name: 'Sehore Krishi Upaj Mandi',
        state: 'Madhya Pradesh',
        district: 'Sehore',
        min_price_qtl: 2650,
        modal_price_qtl: 3180,
        max_price_qtl: 3690,
        msp_price_qtl: 2425,
        price_change_24h: 95,
        arrival_tonnes: 530,
        distance_km: 35,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Roller flour mill demand strong ahead of festive season; trading ₹755/qtl above MSP.',
        advisory_hi: 'त्योहारी सीजन से पहले फ्लोर मिलों की मांग मजबूत है; भाव MSP (₹2,425) से ₹755/क्विंटल ऊपर चल रहा है।'
      },
      {
        id: 'mandi-kolar-tomato',
        crop_code: 'TOMATO',
        crop_name_en: 'Tomato',
        crop_name_hi: 'टमाटर (Hybrid)',
        variety: 'Arka Rakshak / Abhinav',
        mandi_name: 'Kolar APMC Tomato Market',
        state: 'Karnataka',
        district: 'Kolar',
        min_price_qtl: 1800,
        modal_price_qtl: 2650,
        max_price_qtl: 3200,
        msp_price_qtl: 1500,
        price_change_24h: 240,
        arrival_tonnes: 390,
        distance_km: 19,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Rains in competing belts disrupted supply; harvest breaker-stage firm fruits immediately.',
        advisory_hi: 'अन्य राज्यों में बारिश से आवक घटी है; अधपके (Breaker stage) टमाटर तुरंत तुड़ाई कर मंडी भेजें।'
      },
      {
        id: 'mandi-guntur-chilli',
        crop_code: 'CHILLI',
        crop_name_en: 'Chilli (Red Dry)',
        crop_name_hi: 'लाल मिर्च (Teja S-17)',
        variety: 'Guntur Sannam / Teja',
        mandi_name: 'Guntur Mirchi Yard e-NAM',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        min_price_qtl: 14200,
        modal_price_qtl: 17400,
        max_price_qtl: 19800,
        msp_price_qtl: 13500,
        price_change_24h: 350,
        arrival_tonnes: 710,
        distance_km: 28,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Oleoresin & export buyers active for bright red low-aflatoxin lots.',
        advisory_hi: 'निर्यातकों की मांग तेज है। चमकदार लाल एवं बिना नमी वाली मिर्च को उच्चतम भाव मिल रहा है।'
      },
      {
        id: 'mandi-chhindwara-maize',
        crop_code: 'MAIZE',
        crop_name_en: 'Maize (Corn)',
        crop_name_hi: 'मक्का (Yellow Feed/Ethanol)',
        variety: 'Hybrid Yellow',
        mandi_name: 'Chhindwara APMC Mandi',
        state: 'Madhya Pradesh',
        district: 'Chhindwara',
        min_price_qtl: 2180,
        modal_price_qtl: 2410,
        max_price_qtl: 2590,
        msp_price_qtl: 2225,
        price_change_24h: 55,
        arrival_tonnes: 680,
        distance_km: 31,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Ethanol distilleries & poultry feed units procuring aggressively above ₹2,225 MSP.',
        advisory_hi: 'एथेनॉल प्लांट और पोल्ट्री फीड कंपनियों की खरीद से मक्का MSP (₹2,225) से ऊपर बिक रहा है।'
      },
      {
        id: 'mandi-agra-potato',
        crop_code: 'POTATO',
        crop_name_en: 'Potato',
        crop_name_hi: 'आलू (Kufri Jyoti / 3797)',
        variety: 'Kufri Bahar / 3797',
        mandi_name: 'Agra Sikandra APMC Yard',
        state: 'Uttar Pradesh',
        district: 'Agra',
        min_price_qtl: 1350,
        modal_price_qtl: 1780,
        max_price_qtl: 2050,
        msp_price_qtl: 1250,
        price_change_24h: 70,
        arrival_tonnes: 910,
        distance_km: 16,
        sell_hold_signal: 'STRONG_SELL' as const,
        advisory_en: 'Cold storage release fetches strong table-potato rates. Offload 50% stored stock now.',
        advisory_hi: 'कोल्ड स्टोरेज से निकासी पर अच्छा भाव मिल रहा है। अपने भंडारित आलू का 50% हिस्सा अभी बेचें।'
      }
    ];

    for (const m of mandiItems) {
      MandiPriceRepository.upsert(m);
    }

    const outbreaks = [
      {
        id: 'outbreak-mp-ujjain-01',
        state: 'Madhya Pradesh',
        district: 'Ujjain',
        village: 'Badnagar & Barnagar Cluster (14 Villages)',
        crop_code: 'SOYBEAN',
        crop_name_en: 'Soybean',
        crop_name_hi: 'सोयाबीन',
        disease_name_en: 'Soybean Rust & Yellow Mosaic (YMV) Vector Wave',
        disease_name_hi: 'सोयाबीन गेरूई (Rust) एवं पीला मोज़ेक अलर्ट',
        severity: 'HIGH_ALERT' as const,
        affected_farms_count: 38,
        distance_km: 4.2,
        preventive_step_en: 'Step 1 Cuticle Shield: Spray Potassium Silicate 2ml/L + SOP 5g/L immediately; install 10 Yellow Sticky Traps/acre.',
        preventive_step_hi: 'सुरक्षा कवच (चरण 1): पोटेशियम सिलिकेट 2 मिली/लीटर + घुलनशील पोटाश (00:00:50) 5 ग्राम/लीटर छिड़कें और 10 पीले चिपचिपे ट्रैप लगाएं।',
        reported_by: 'KVK Ujjain Plant Protection Unit',
        verified_by_kvk: 1
      },
      {
        id: 'outbreak-mp-dhar-02',
        state: 'Madhya Pradesh',
        district: 'Dhar',
        village: 'Dharampuri & Manawar Belt',
        crop_code: 'COTTON',
        crop_name_en: 'Cotton',
        crop_name_hi: 'कपास',
        disease_name_en: 'Pink Bollworm Moth Trap Surge (>8 moths/trap)',
        disease_name_hi: 'कपास में गुलाबी सुंडी (Pink Bollworm) प्रकोप चेतावनी',
        severity: 'HIGH_ALERT' as const,
        affected_farms_count: 27,
        distance_km: 9.5,
        preventive_step_en: 'Install 8 Pheromone Traps/acre + release Trichogramma bactrae cards (50,000 eggs/acre) + Boron 1g/L spray.',
        preventive_step_hi: '8 फेरोमोन ट्रैप/एकड़ लगाएं + ट्राइकोग्रामा परजीवी कार्ड छोड़ें और बोरॉन 20% @ 1 ग्राम/लीटर का छिड़काव करें।',
        reported_by: 'ATMA Field Scout Team, Dhar',
        verified_by_kvk: 1
      },
      {
        id: 'outbreak-mh-jalgaon-03',
        state: 'Maharashtra',
        district: 'Jalgaon',
        village: 'Raver & Yawal Banana Pocket',
        crop_code: 'BANANA',
        crop_name_en: 'Banana',
        crop_name_hi: 'केला',
        disease_name_en: 'Sigatoka Leaf Spot Fungal Spore Surge',
        disease_name_hi: 'केले का सिगाटोका पर्ण धब्बा रोग प्रसार',
        severity: 'MODERATE_WATCH' as const,
        affected_farms_count: 19,
        distance_km: 14.0,
        preventive_step_en: 'De-leaf lower necrotic blades and spray Bacillus subtilis 5g/L + Chelated Zinc 1g/L.',
        preventive_step_hi: 'नीचे की सूखी धब्बेदार पत्तियां काटकर हटाएं तथा बैसिलस सबटिलिस 5 ग्राम/लीटर + चिलेटेड जिंक 1 ग्राम/लीटर छिड़कें।',
        reported_by: 'NRC Banana Advisory Cell',
        verified_by_kvk: 1
      },
      {
        id: 'outbreak-pb-ludhiana-04',
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Khanna & Samrala Block',
        crop_code: 'PADDY',
        crop_name_en: 'Paddy',
        crop_name_hi: 'धान',
        disease_name_en: 'Paddy Neck Blast & Khaira Zinc Deficiency',
        disease_name_hi: 'धान का गर्दन तोड़ झुलसा (Blast) व खैरा रोग',
        severity: 'HIGH_ALERT' as const,
        affected_farms_count: 31,
        distance_km: 11.8,
        preventive_step_en: 'Stop top-dressing Urea immediately! Spray Ortho-Silicic Acid 2ml/L + ZnSO4 2.5g/L.',
        preventive_step_hi: 'यूरिया का छिड़काव तुरंत रोकें! ऑर्थो-सिलिकिक एसिड 2 मिली/लीटर + जिंक सल्फेट 2.5 ग्राम/लीटर का स्प्रे करें।',
        reported_by: 'PAU Krishi Vigyan Kendra',
        verified_by_kvk: 1
      }
    ];

    for (const o of outbreaks) {
      CommunityOutbreakRepository.upsert(o);
    }

    SchemeApplicationRepository.create({
      id: 'scheme-seed-pmkisan-01',
      reference_no: 'KSS-2026-884120',
      user_id: defaultUserId,
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      mobile_number: '9876543210',
      scheme_code: 'PM_KISAN',
      scheme_name: 'PM-KISAN Samman Nidhi (18th Installment)',
      application_type: 'SCHEME_ENROLLMENT',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      crop_name: 'SOYBEAN',
      acreage: 3.5,
      estimated_benefit_inr: 6000,
      claim_reason: 'Annual Direct Benefit Transfer (₹2,000 x 3 installments) - eKYC & Land Seeding Verified',
      diagnosis_id: '1da85f64-5717-4562-b3fc-2c963f66af77',
      status: 'APPROVED_DBT_ACTIVE'
    });

    // Seed State-Wise Agro-Climatic Challenges & Tech Resolution Matrix (8 Major Indian State Clusters)
    const stateChallenges = [
      {
        id: 'STATE_CH_01_MP',
        state_code: 'MP',
        state_name_en: 'Madhya Pradesh (Malwa & Nimar Belt)',
        state_name_hi: 'मध्य प्रदेश (मालवा एवं निमाड़ काली मिट्टी क्षेत्र)',
        agro_climatic_zone_hi: 'काली चिकनी मिट्टी (Deep Black Vertisol, pH 7.6 - 8.2)',
        dominant_crops_hi: 'सोयाबीन (JS 20-34), शरबती गेहूँ, चना, लहसुन, मक्का',
        soil_water_challenge_hi: 'क्षारीय काली मिट्टी (pH > 7.6) में जिंक (0.45 ppm) व सल्फर लॉक हो जाता है तथा अतिवृष्टि में जलभराव से जड़ गलन (Root Rot) होती है।',
        soil_water_challenge_en: 'Alkaline Vertisols (pH 7.6-8.2) lock up soil Zinc (<0.45 ppm) and poor drainage causes severe monsoon waterlogging root rot.',
        pest_disease_challenge_hi: 'जिंक की कमी से होने वाले पीलापन (Chlorosis) को स्थानीय डीलर पीला मोज़ेक वायरस (YMV) समझकर ₹2,200/एकड़ के अनावश्यक कीटनाशक बिकवा देते हैं।',
        pest_disease_challenge_en: 'Dealers misdiagnose Zinc deficiency chlorosis as Yellow Mosaic Virus (YMV), pushing ₹2,200/acre of ineffective synthetic insecticides.',
        market_policy_challenge_hi: 'कटाई के समय सोयाबीन में >12% नमी होने पर मंडी में ₹300-₹450/क्विंटल की कटौती।',
        banned_pesticides_list: 'Monocrotophos (Vegetables), Endosulfan, Methyl Parathion',
        tech_solution_title_hi: 'AI पीलापन विभेदक + चिलेटेड जिंक-EDTA स्प्रे + BBF (चौड़ी क्यारी-नाली) प्लांटर',
        tech_solution_title_en: 'AI Chlorosis vs YMV Differentiator + Chelated Zn-EDTA Foliar + BBF Planter',
        tech_solution_steps_hi: [
          '1. AI पत्ती स्कैन: सममित शिरा-मध्य पीलापन (Zinc कमी) और विषम मोज़ेक (YMV) को 3 सेकंड में अलग कर अनावश्यक कीटनाशक खर्च रोकता है।',
          '2. क्षारीय मृदा बाईपास: मिट्टी में साधारण जिंक लॉक होने के कारण पत्तियों पर चिलेटेड जिंक (Zn-EDTA 12% @ 1g/L) + ZSB जैव-उर्वरक का किसान ड्रोन से स्प्रे।',
          '3. जल निकासी तकनीक: बुवाई में BBF (Broad-Bed Furrow) ट्रैक्टर प्लांटर का उपयोग कर अतिवृष्टि जल निकासी एवं 25% बीज बचत।'
        ],
        tech_solution_steps_en: [
          '1. AI Leaf Scan separates symmetrical interveinal Zinc chlorosis from asymmetrical YMV virus in 3 seconds.',
          '2. Alkaline Soil Bypass: Foliar Kisan Drone spray of Chelated Zn-EDTA 12% (1g/L) + ZSB bio-inoculant.',
          '3. Broad-Bed Furrow (BBF) planter drains excess monsoon water and saves 25% soybean seed.'
        ],
        chc_equipment_name_hi: 'किसान ड्रोन स्प्रे + BBF (चौड़ी क्यारी) ट्रैक्टर प्लांटर',
        chc_subsidy_pct: 50,
        chc_rent_per_acre_inr: 450,
        estimated_roi_per_acre_inr: 3450,
        state_scheme_highlight_hi: 'म.प्र. ई-कृषि यंत्र अनुदान (50% सब्सिडी) + मुख्यमंत्री किसान कल्याण योजना (₹6,000 अतिरिक्त)'
      },
      {
        id: 'STATE_CH_02_PB_HR',
        state_code: 'PB_HR',
        state_name_en: 'Punjab & Haryana (Indo-Gangetic Plains)',
        state_name_hi: 'पंजाब एवं हरियाणा (सिंचित धान-गेहूँ पट्टी)',
        agro_climatic_zone_hi: 'जलोढ़ सिंचित मैदान (Trans-Gangetic Alluvial Plains)',
        dominant_crops_hi: 'धान (PR-126 / बासमती 1121), गेहूँ (HD-3086), सरसों, आलू',
        soil_water_challenge_hi: '78% ब्लॉकों में भूजल स्तर प्रतिवर्ष >1 मीटर गिर रहा है; यूरिया के अत्यधिक प्रयोग से NPK अनुपात 31:8:1 हो गया है व जैविक कार्बन <0.35% है।',
        soil_water_challenge_en: 'Groundwater dropping >1m/year in 78% blocks; skewed 31:8:1 NPK ratio from excessive Urea and low organic carbon (<0.35%).',
        pest_disease_challenge_hi: 'धान कटाई व गेहूँ बुवाई के बीच मात्र 18 दिन मिलने से पराली (Stubble) संकट; बासमती में 10 प्रतिबंधित कीटनाशकों के अवशेष (MRL) से निर्यात रिजेक्शन।',
        pest_disease_challenge_en: '18-day window between paddy harvest and wheat sowing triggers stubble burning; 10 banned chemicals cause EU/US Basmati MRL rejection.',
        market_policy_challenge_hi: 'बासमती में ट्राइसाइक्लाजोल व ब्यूप्रोफेजिन अवशेष (MRL > 0.01 ppm) मिलने पर ₹600/क्विंटल निर्यात प्रीमियम का नुकसान।',
        banned_pesticides_list: 'Tricyclazole, Buprofezin, Acephate, Chlorpyrifos, Propiconazole, Thiamethoxam, Profenofos, Carbendazim, Triazophos, Methomyl (Punjab Basmati Ban)',
        tech_solution_title_hi: 'हैप्पी सीडर / पूसा डीकंपोजर CHC बुकिंग + बासमती MRL-सुरक्षित बायो प्रोटोकॉल + DSR',
        tech_solution_title_en: 'Happy Seeder / Pusa Decomposer CHC + Basmati MRL-Safe Guardrail + DSR Water Saver',
        tech_solution_steps_hi: [
          '1. CIB&RC पंजाब ऑटो-गार्डरेल: बासमती में प्रतिबंधित सभी 10 रसायनों को ब्लॉक कर ट्राइकोडर्मा + स्यूडोमोनास + ऑर्थो-सिलिकिक एसिड सुझाता है।',
          '2. पराली समाधान: ऐप से नजदीकी कस्टम हायरिंग सेंटर (CHC) से सुपर सीडर / हैप्पी सीडर व पूसा बायो-डीकंपोजर कैप्सूल बुकिंग + कार्बन क्रेडिट लाभ।',
          '3. भूजल बचत: धान की सीधी बुवाई (DSR) एवं AWD पाइप तकनीक से 35% पानी बचत व ₹1,500/एकड़ सरकारी प्रोत्साहन।'
        ],
        tech_solution_steps_en: [
          '1. Auto-blocks all 10 Punjab-banned Basmati molecules to protect export MRL compliance.',
          '2. Instant CHC booking for Super Seeder / Happy Seeder + Pusa Bio-Decomposer with carbon credit tracking.',
          '3. Direct Seeded Rice (DSR) & AWD irrigation scheduler saving 35% water + ₹1,500/acre state incentive.'
        ],
        chc_equipment_name_hi: 'सुपर सीडर / हैप्पी सीडर + पूसा बायो-डीकंपोजर स्प्रे',
        chc_subsidy_pct: 65,
        chc_rent_per_acre_inr: 550,
        estimated_roi_per_acre_inr: 4800,
        state_scheme_highlight_hi: 'पंजाब/हरियाणा DSR ₹1,500/एकड़ प्रोत्साहन + CRM पराली प्रबंधन मशीनरी पर 50%-80% सब्सिडी'
      },
      {
        id: 'STATE_CH_03_MH',
        state_code: 'MH',
        state_name_en: 'Maharashtra (Vidarbha, Marathwada & Khandesh)',
        state_name_hi: 'महाराष्ट्र (विदर्भ, मराठवाड़ा एवं खानदेश क्षेत्र)',
        agro_climatic_zone_hi: 'वर्षा आधारित शुष्क एवं मध्यम काली मिट्टी (Semi-Arid Deccan Plateau)',
        dominant_crops_hi: 'बीटी कपास (Bt Cotton), सोयाबीन, तुअर (अरहर), केला (जलगाँव), प्याज, गन्ना',
        soil_water_challenge_hi: 'मानसून के बीच 15-25 दिन का सूखा अंतराल (Dry Spell) आने से कपास के टिंडे व तुअर के 40% फूल झड़ जाते हैं।',
        soil_water_challenge_en: 'Mid-monsoon 15-25 day dry spells cause severe moisture stress and 40% flower/boll shedding in rainfed Cotton and Tur.',
        pest_disease_challenge_hi: 'बीटी कपास में 60 दिन बाद गुलाबी सुंडी (Pink Bollworm) का प्रतिरोध और जलगाँव केले में सिगाटोका पत्ती धब्बा रोग।',
        pest_disease_challenge_en: 'Bt Cotton Pink Bollworm resistance after 60 DAS and Jalgaon Banana Sigatoka leaf spot.',
        market_policy_challenge_hi: 'प्याज व टमाटर में अचानक आवक बढ़ने से मंडी भाव में भारी उतार-चढ़ाव।',
        banned_pesticides_list: 'Monocrotophos, Acephate, Diafenthiuron (Restricted Tank-Mix after Yavatmal Safety Norms)',
        tech_solution_title_hi: 'सूखा-रोधी पोटाश नाइट्रेट (13:00:45) + सिलिकेट कवच + फेरोमोन ETL ट्रैप रडार',
        tech_solution_title_en: 'Dry-Spell Osmoprotectant (13:00:45 + Silicate) + Pink Bollworm Pheromone ETL Radar',
        tech_solution_steps_hi: [
          '1. सूखा-तनाव अलर्ट: 10+ दिन बारिश रुकने पर पोटेशियम नाइट्रेट (13:00:45 @ 10g/L) + काओलिन/सिलिकेट का पर्णीय स्प्रे, जो पत्तियों से नमी उड़ना 40% कम करता है।',
          '2. गुलाबी सुंडी रडार: गोसीप्लुर फेरोमोन ट्रैप में >8 पतंगे दिखते ही नीम अज़ादिराच्टिन 10000 ppm + मेटिंग डिसरप्शन पेस्ट प्रोब।',
          '3. महा-डीबीटी (MahaDBT) एवं पोकरा (PoCRA) फार्म पॉन्ड (शेततळे) व ड्रिप सब्सिडी लिंकेज।'
        ],
        tech_solution_steps_en: [
          '1. Dry-Spell Osmoprotectant: Foliar KNO3 (13:00:45 @ 10g/L) + Potassium Silicate reduces transpiration loss by 40%.',
          '2. Gossyplure Pheromone Trap ETL Counter (>8 moths/trap) triggering Neem 10000 ppm + PBW mating disruption.',
          '3. MahaDBT / PoCRA farm pond lining and micro-irrigation subsidy integration.'
        ],
        chc_equipment_name_hi: 'किसान ड्रोन सूखा-रोधी स्प्रे + गुलाबी सुंडी फेरोमोन IPM किट',
        chc_subsidy_pct: 55,
        chc_rent_per_acre_inr: 420,
        estimated_roi_per_acre_inr: 5200,
        state_scheme_highlight_hi: 'नमो शेतकरी महासन्मान निधि (₹6,000 अतिरिक्त = कुल ₹12,000/वर्ष) + नानाजी देशमुख कृषि संजीवनी (PoCRA)'
      },
      {
        id: 'STATE_CH_04_UP_BR',
        state_code: 'UP_BR',
        state_name_en: 'Uttar Pradesh & Bihar (Gangetic Alluvial Belt)',
        state_name_hi: 'उत्तर प्रदेश एवं बिहार (गंगा का मैदानी क्षेत्र)',
        agro_climatic_zone_hi: 'उपजाऊ जलोढ़ मैदान, छोटी जोत (<0.6 हेक्टेयर) व तराई क्षेत्र',
        dominant_crops_hi: 'गेहूँ, धान, गन्ना (Co-0238), आलू, मक्का, दलहन',
        soil_water_challenge_hi: 'मार्च में अचानक तापमान >35°C (Terminal Heat Wave) होने से गेहूँ का दाना सिकुड़कर वजन 15-20% घट जाता है; डीजल पंप से सिंचाई महंगी (₹220/घंटा)।',
        soil_water_challenge_en: 'March terminal heat wave (>35°C) shrivels wheat grain by 15-20%; fragmented <0.6 ha holdings face expensive diesel pumping.',
        pest_disease_challenge_hi: 'उ.प्र. में गन्ने की मुख्य किस्म Co-0238 में लाल सड़न रोग (Red Rot - गन्ने का कैंसर) और धान में खैरा (जिंक कमी) रोग।',
        pest_disease_challenge_en: 'Widespread Sugarcane Red Rot in Co-0238 variety and Khaira Zinc deficiency in transplanted paddy.',
        market_policy_challenge_hi: 'छोटे किसानों द्वारा नमी व भंडारण अभाव में गाँव के व्यापारियों को MSP से ₹300 कम पर धान/मक्का की मजबूरी में बिक्री।',
        banned_pesticides_list: 'Carbofuran 50% SP, Phorate, Triazophos (Restricted in Basmati Belt)',
        tech_solution_title_hi: 'गेहूँ टर्मिनल हीट-शील्ड (00:52:34) अलर्ट + गन्ना ट्राइकोडर्मा सेट-उपचार + सोलर पंप',
        tech_solution_title_en: 'Wheat Terminal Heat-Shield (00:52:34) + Sugarcane Red-Rot Bio-Protocol + Solar Pump',
        tech_solution_steps_hi: [
          '1. हीट-वेव सुरक्षा कवच: मार्च में तापमान >32°C होने से 48 घंटे पहले 00:52:34 (10g/L) + सैलिसिलिक एसिड का स्प्रे कर गेहूँ के दाने का वजन बचाना।',
          '2. गन्ना लाल सड़न रोकथाम: ट्राइकोडर्मा हरजियानम (10g/L) से गन्ना टुकड़ों (Setts) का उपचार एवं नई रोग-रोधी किस्म (Co-0118 / CoLk-14201) चयन।',
          '3. पीएम-कुसुम 60% सब्सिडी सोलर पंप व साझा किसान ड्रोन बुकिंग से सिंचाई व छिड़काव खर्च में 70% बचत।'
        ],
        tech_solution_steps_en: [
          '1. Terminal Heat-Shield: Spray 00:52:34 (10g/L) + Salicylic Acid 48h before March heat spikes to protect wheat grain weight.',
          '2. Sugarcane Red-Rot Bio-Sett treatment with Trichoderma harzianum + varietal transition to Co-0118 / CoLk-14201.',
          '3. PM-KUSUM 60% subsidized solar irrigation and shared village Kisan Drone spraying.'
        ],
        chc_equipment_name_hi: 'साझा किसान ड्रोन हीट-शील्ड स्प्रे + गन्ना ट्राइकोडर्मा बायो-किट',
        chc_subsidy_pct: 60,
        chc_rent_per_acre_inr: 380,
        estimated_roi_per_acre_inr: 3900,
        state_scheme_highlight_hi: 'उ.प्र. निःशुल्क बोरवेल/ट्यूबवेल बिजली छूट + पीएम-कुसुम 60% सोलर पंप अनुदान + बिहार कृषि इनपुट सब्सिडी'
      },
      {
        id: 'STATE_CH_05_SOUTH',
        state_code: 'SOUTH',
        state_name_en: 'Andhra Pradesh, Telangana & Karnataka (Deccan Belt)',
        state_name_hi: 'आंध्र प्रदेश, तेलंगाना एवं कर्नाटक (दक्षिणी मिर्च व बागवानी क्षेत्र)',
        agro_climatic_zone_hi: 'लाल एवं काली मिट्टी (Red Alfisols & Deccan Vertisols, Borewell Belt)',
        dominant_crops_hi: 'लाल मिर्च (गुंटूर/ब्याडगी), टमाटर (कोलार), धान, कपास, मक्का, हल्दी',
        soil_water_challenge_hi: 'गहरे बोरवेल के पानी में अधिक खारापन (EC > 2.5 dS/m) और फ्लोराइड से जड़ों में जलन व पोटाश/कैल्शियम अवशोषण बाधित।',
        soil_water_challenge_en: 'Deep borewell water salinity (EC > 2.5 dS/m) and chloride scorching root tips in horticulture crops.',
        pest_disease_challenge_hi: 'मिर्च में विदेशी ब्लैक थ्रिप्स (Thrips parvispinus) एवं मुरड़िया (Leaf Curl) से 60% फूल झड़ना; महंगे रसायनों का बेअसर होना।',
        pest_disease_challenge_en: 'Invasive Black Thrips (Thrips parvispinus) and Leaf Curl devastating Chilli flowers; heavy chemical sprays fail and breach export MRLs.',
        market_policy_challenge_hi: 'निर्यात मिर्च में कीटनाशक अवशेष (MRL) फेल होने का जोखिम एवं टमाटर में ग्रेडिंग/कोल्ड-चेन की कमी।',
        banned_pesticides_list: 'Chlorpyrifos, Monocrotophos, Acephate, Fipronil (Restricted in Export Chilli)',
        tech_solution_title_hi: 'ब्लैक थ्रिप्स बायो-रेशनल IPM (ब्यूवेरिया + नीला/पीला ट्रैप) + खारा पानी ड्रिप न्यूट्रलाइज़र',
        tech_solution_title_en: 'Black Thrips Bio-Rational IPM Stack + Saline Borewell Drip Fertigation Neutralizer',
        tech_solution_steps_hi: [
          '1. ब्लैक थ्रिप्स बायो-स्टैक: प्रति एकड़ 25 नीले + पीले चिपचिपे ट्रैप + ब्यूवेरिया बेसियाना व लेकेनिसिलियम लेकानी (5g/L) + पोटेशियम सिलिकेट कवच।',
          '2. खारा पानी सुधार: क्लोराइड-युक्त MOP पोटाश बंद कर सल्फेट ऑफ पोटाश (00:00:50) व जिप्सम बेड उपचार से जड़ों की सुरक्षा।',
          '3. ई-नाम (e-NAM) गुंटूर/कोलार लाइव ग्रेडिंग व कोल्ड-रूम क्रेट स्लॉट बुकिंग।'
        ],
        tech_solution_steps_en: [
          '1. Black Thrips Bio-Stack: 25 Blue + Yellow Sticky Traps/acre + Beauveria bassiana & Lecanicillium lecanii + Potassium Silicate.',
          '2. Saline Water Fix: Replace chloride MOP with Sulfate of Potash (00:00:50) and Gypsum root-zone conditioning.',
          '3. Guntur/Kolar e-NAM export grading and solar cold-room crate booking.'
        ],
        chc_equipment_name_hi: 'ब्लैक थ्रिप्स बायो-IPM किट + किसान ड्रोन माइक्रो-स्प्रे',
        chc_subsidy_pct: 55,
        chc_rent_per_acre_inr: 500,
        estimated_roi_per_acre_inr: 7500,
        state_scheme_highlight_hi: 'रायथु भरोसा / अन्नदाता सुखीभव + सूक्ष्म सिंचाई (Drip) पर 80% तक राज्य अनुदान'
      },
      {
        id: 'STATE_CH_06_GJ_RJ',
        state_code: 'GJ_RJ',
        state_name_en: 'Gujarat & Rajasthan (Arid & Semi-Arid Oilseed/Spice Belt)',
        state_name_hi: 'गुजरात एवं राजस्थान (शुष्क तिलहन एवं जीरा/मसाला क्षेत्र)',
        agro_climatic_zone_hi: 'रेतीली दोमट एवं लवणीय मिट्टी (Arid Sandy Loam, High EC > 3.0 dS/m)',
        dominant_crops_hi: 'मूंगफली, जीरा (Cumin), सरसों, कपास, अरंडी, बाजरा, ईसबगोल',
        soil_water_challenge_hi: 'अत्यधिक कम वर्षा, रेतीली मिट्टी में नमी न रुकना और खारे भूजल (High EC) से अंकुरण व जड़ वृद्धि रुकना।',
        soil_water_challenge_en: 'Severe aridity, low water-holding sandy soils, and saline groundwater (EC > 3.0 dS/m).',
        pest_disease_challenge_hi: 'मूंगफली में सफेद लट (White Grub) व तना गलन, तथा जीरे (Cumin) में बेमौसम ओस/बादल से रातों-रात झुलसा (Alternaria Blight) रोग।',
        pest_disease_challenge_en: 'Groundnut White Grub (Holotrichia) root destruction and overnight Cumin (Jeera) Alternaria Blight during winter dew/clouds.',
        market_policy_challenge_hi: 'जीरा व मूंगफली में अफलाटॉक्सिन व नमी के कारण निर्यात भाव में अंतर।',
        banned_pesticides_list: 'Phorate 10% CG, Methyl Parathion, Carbofuran',
        tech_solution_title_hi: '48-घंटे जीरा ओस/झुलसा पूर्व-चेतावनी + सफेद लट मेटाराइजियम बायो-ड्रेंच + सोलर ड्रिप',
        tech_solution_title_en: '48h Cumin Dew-Blight Early Warning + White Grub Metarhizium Bio-Drench + Solar Drip',
        tech_solution_steps_hi: [
          '1. जीरा झुलसा रडार: आर्द्रता >80% या बादल आने से 48 घंटे पहले अलर्ट देकर पोटेशियम फॉस्फोनेट + स्यूडोमोनास का सुरक्षा स्प्रे करवाना।',
          '2. सफेद लट जड़ सुरक्षा: प्रतिबंधित फोरेट की जगह मेटाराइजियम एनीसोप्ली (Metarhizium anisopliae @ 2 kg/एकड़) + नीम खली का प्रयोग।',
          '3. रेगिस्तानी सिंचाई: PMKSY 75%-80% सब्सिडी पर सोलर ड्रिप व मल्चिंग शीट से 50% पानी की बचत।'
        ],
        tech_solution_steps_en: [
          '1. 48-Hour Dew & Cloud Blight Warning for Cumin triggering preventive Potassium Phosphonate + Pseudomonas spray.',
          '2. Replace banned Phorate with Metarhizium anisopliae (2 kg/acre) + Neem Cake against Groundnut White Grub.',
          '3. 75%-80% subsidized Solar Drip + Silver Mulching reducing water requirement by 50%.'
        ],
        chc_equipment_name_hi: 'मूंगफली सफेद लट बायो-ड्रेंच किट + ऑटोमेटिक ड्रिप फर्टिगेशन',
        chc_subsidy_pct: 75,
        chc_rent_per_acre_inr: 400,
        estimated_roi_per_acre_inr: 6100,
        state_scheme_highlight_hi: 'राजस्थान तारबंदी व फार्म पॉन्ड (डिग्गी) अनुदान + गुजरात सूर्योदय किसान सोलर योजना (दिन में बिजली)'
      },
      {
        id: 'STATE_CH_07_EAST',
        state_code: 'EAST',
        state_name_en: 'West Bengal, Odisha & Assam (Eastern High-Rainfall Belt)',
        state_name_hi: 'पश्चिम बंगाल, ओडिशा एवं असम (पूर्वी तटीय एवं अम्लीय मृदा क्षेत्र)',
        agro_climatic_zone_hi: 'अम्लीय जलोढ़ एवं तटीय मृदा (Strongly Acidic Soils, pH 4.8 - 5.5)',
        dominant_crops_hi: 'धान (अमन/बोरो), आलू (हुगली/बर्दवान), जूट, सब्जियां, दालें',
        soil_water_challenge_hi: 'अत्यधिक अम्लीय मिट्टी (pH < 5.4) के कारण बोरॉन व मॉलिब्डेनम की भारी कमी तथा निचले खेतों में आयरन विषाक्तता (Iron Toxicity) व बाढ़ जलभराव।',
        soil_water_challenge_en: 'Strongly acidic soils (pH 4.8-5.5) causing acute Boron deficiency, Phosphorus fixation, Iron toxicity, and cyclone submergence.',
        pest_disease_challenge_hi: 'आलू में कोहरे के दौरान पछेती झुलसा (Late Blight) का महामारी प्रकोप और धान में भूरा फुदका (BPH)।',
        pest_disease_challenge_en: 'Devastating Potato Late Blight (Phytophthora infestans) during winter fog and Paddy Brown Plant Hopper (BPH).',
        market_policy_challenge_hi: 'चक्रवात व बेमौसम बारिश से कटाई के समय पकी धान की फसल का भीगना एवं आलू कोल्ड-स्टोरेज बॉन्ड संकट।',
        banned_pesticides_list: 'Endosulfan, Triazophos, Monocrotophos (Restricted on Vegetables)',
        tech_solution_title_hi: 'अम्लीय मृदा डोलोमाइट चूना + बोरॉन सुधार गणक + 48-घंटे चक्रवात/झुलसा अलर्ट',
        tech_solution_title_en: 'Acid-Soil Dolomite Lime & Boron Calculator + 48h Cyclone & Late Blight Radar',
        tech_solution_steps_hi: [
          '1. अम्लीय मृदा सुधार: pH < 5.5 होने पर 200 किग्रा/एकड़ डोलोमाइट चूना / पेपर मिल स्लज + पत्तियों पर बोरॉन 20% (1.5g/L) का स्प्रे।',
          '2. जलमग्नता रोधी बीज: बाढ़ प्रभावित क्षेत्रों के लिए स्वर्णा-सब1 (Swarna-Sub1) व CR धान-801 (14 दिन पानी में डूबने पर भी सुरक्षित)।',
          '3. आलू झुलसा पूर्व-चेतावनी: कोहरा बढ़ने पर मैंकोजेब/मेटालैक्सिल से पहले ट्राइकोडर्मा + पोटेशियम सिलिकेट कवच।'
        ],
        tech_solution_steps_en: [
          '1. Acid-Soil Correction: 200 kg/acre Dolomite Lime / Paper-mill sludge + foliar Boron 20% (1.5g/L).',
          '2. Submergence-Tolerant Varieties: Swarna-Sub1 & CR Dhan-801 surviving 14 days of flash-flood submergence.',
          '3. Potato Late Blight Fog Radar + Solar Micro-Cold Storage booking.'
        ],
        chc_equipment_name_hi: 'डोलोमाइट चूना स्प्रेडर + आलू झुलसा सुरक्षा ड्रोन स्प्रे',
        chc_subsidy_pct: 60,
        chc_rent_per_acre_inr: 390,
        estimated_roi_per_acre_inr: 4100,
        state_scheme_highlight_hi: 'ओडिशा कालिया (KALIA) एवं पश्चिम बंगाल कृषक बंधु (₹10,000/वर्ष सहायता + निःशुल्क फसल बीमा)'
      },
      {
        id: 'STATE_CH_08_HILLS',
        state_code: 'HILLS',
        state_name_en: 'Kerala & Himachal Pradesh (Spices, Plantation & Hill Horticulture)',
        state_name_hi: 'केरल एवं हिमाचल प्रदेश (मसाला बागान एवं पर्वतीय सेब/सब्जी क्षेत्र)',
        agro_climatic_zone_hi: 'पर्वतीय ढलान एवं लेटेराइट उच्च वर्षा क्षेत्र (Hill Slopes & Western Ghats Laterite)',
        dominant_crops_hi: 'काली मिर्च, इलायची, केला, नारियल (केरल) | सेब, मटर, टमाटर (हिमाचल)',
        soil_water_challenge_hi: 'तेज ढलान पर भारी वर्षा से ऊपरी उपजाऊ मिट्टी एवं कैल्शियम/मैग्नीशियम का बह जाना (Leaching) तथा ओलावृष्टि से सेब को नुकसान।',
        soil_water_challenge_en: 'Steep slope nutrient leaching of Calcium/Magnesium in heavy rain and devastating hailstorms on ripening Apple orchards.',
        pest_disease_challenge_hi: 'केरल में काली मिर्च का फाइटोफ्थोरा तना गलन (Quick Wilt) और हिमाचल में सेब का स्कैब (Apple Scab) व समय से पहले पत्ती झड़ना।',
        pest_disease_challenge_en: 'Black Pepper Phytophthora Quick Wilt in Kerala and Apple Scab / Premature Leaf Fall in Himachal Pradesh.',
        market_policy_challenge_hi: 'केरल में कठोर जैविक/कीटनाशक-मुक्त मानक (ग्लाइफोसेट, क्लोरपायरीफॉस आदि पूर्ण प्रतिबंधित)।',
        banned_pesticides_list: 'Glyphosate, Chlorpyrifos, Carbofuran, Phorate, Atrazine, Paraquat (Kerala Strict State Ban)',
        tech_solution_title_hi: 'केरल 100% बायो-कैप्सूल (IIHR ट्राइकोडर्मा) गाइड + हिमाचल एंटी-हेल नेट व स्कैब अलर्ट',
        tech_solution_title_en: 'Kerala 100% Bio-Capsule Guardrail + Himachal Anti-Hail Net & Scab Mills-Predictor',
        tech_solution_steps_hi: [
          '1. केरल जीरो-केमिकल गार्डरेल: सभी प्रतिबंधित रसायनों को ब्लॉक कर IIHR ट्राइकोडर्मा बायो-कैप्सूल + स्यूडोमोनास फ्लोरेसेंस + 1% बोर्डो मिश्रण सुझाता है।',
          '2. सेब स्कैब एवं कैल्शियम पोषण: पत्ती की नमी (Leaf Wetness Hours) से स्कैब की भविष्यवाणी एवं कैल्शियम क्लोराइड/बोरॉन का छिड़काव।',
          '3. ओलावृष्टि सुरक्षा: बागवानी मिशन के तहत 80% सब्सिडी पर एंटी-हेल नेट (Anti-Hail Net) की बुकिंग।'
        ],
        tech_solution_steps_en: [
          '1. Kerala Zero-Banned-Chemical Guardrail prescribing IIHR Trichoderma Bio-Capsules + Pseudomonas + 1% Bordeaux.',
          '2. Himachal Leaf-Wetness Apple Scab Predictor + foliar Calcium/Boron bitter-pit prevention.',
          '3. 80% subsidized Anti-Hail Net structure booking under Hill Horticulture Mission.'
        ],
        chc_equipment_name_hi: 'IIHR बायो-कैप्सूल किट / 80% सब्सिडी एंटी-हेल नेट (Anti-Hail Net)',
        chc_subsidy_pct: 80,
        chc_rent_per_acre_inr: 600,
        estimated_roi_per_acre_inr: 8200,
        state_scheme_highlight_hi: 'हिमाचल एंटी-हेल नेट 80% सब्सिडी + केरल सुभिक्षा केरलम एवं मसाला बोर्ड बायो-इनपुट अनुदान'
      }
    ];

    for (const sc of stateChallenges) {
      StateAgroChallengeRepository.upsert(sc);
    }

    ChcMachineryBookingRepository.create({
      id: 'chc-seed-booking-01',
      booking_ref: 'CHC-MP-849201',
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      mobile_number: '9876543210',
      state_code: 'MP',
      state_name_hi: 'मध्य प्रदेश (मालवा क्षेत्र)',
      district: 'Ujjain',
      crop_name: 'SOYBEAN',
      acreage: 3.5,
      intervention_type: 'KISAN_DRONE_SPRAY',
      equipment_name_hi: 'किसान ड्रोन स्प्रे (चिलेटेड जिंक-EDTA + ZSB घोल)',
      scheduled_date: '2026-10-19 (सुबह 07:30 बजे)',
      gross_cost_inr: 3150,
      subsidy_amount_inr: 1575,
      net_farmer_payable_inr: 1575,
      carbon_or_water_reward_hi: '90% पानी बचत (मात्र 10 लीटर/एकड़) + ₹2,200 कीटनाशक खर्च बचाया',
      status: 'CONFIRMED_CHC_ALLOCATED'
    });

    // 13. Seed Licensed Agri-Graduate Accreditation, Certified Seeds & Clinic Store Data
    this.seedAgriGraduateCommerceData();
  }

  static seedAgriGraduateCommerceData() {
    console.log('🎓 Seeding Licensed Agriculture Graduate Accreditation & Input Commerce Hub...');

    // A. Statutory Licenses & Accreditations (B.Sc. Agriculture Graduate - Vikas Chaturvedi)
    AgriGraduateLicenseRepository.upsert({
      id: 'AGRI_GRAD_VIKAS_01',
      graduate_name: 'Vikas Chaturvedi, B.Sc. (Hons) Agriculture',
      qualification: 'B.Sc. (Hons) Agriculture, M.Sc. Agronomy & Seed Technology',
      university: 'Jawaharlal Nehru Krishi Vishwa Vidyalaya (JNKVV), Jabalpur',
      passing_year: 2021,
      acabc_reg_no: 'MANAGE/ACABC/MP-UJ/2022/9481',
      seed_license_no: 'MP/UJJ/SEED-LIC/1966/ACT-8420',
      fertilizer_license_no: 'MP/UJJ/FCO-1985/DEALER-4910',
      insecticide_license_no: 'MP/UJJ/INSECT-1968/CIBRC-6021',
      drone_pilot_license_no: 'DGCA/RPC/ROTOR-AGRI/2024/0932',
      clinic_name_hi: 'विकास कृषि क्लिनिक एवं अधिकृत बीज-समाधान केंद्र',
      clinic_name_en: 'Vikas Agri-Clinic & Licensed Input Solutions Center',
      state: 'Madhya Pradesh',
      district: 'Ujjain',
      mobile_number: '9800000000',
      digital_stamp_code: 'DIGI-STAMP-JNKVV-AGRI-GRAD-7749',
      consultation_fee_inr: 0
    });

    // B. Certified Input Catalog (Seeds, Custom Micronutrients, Bio-agents & Curative Kits)
    const certifiedProducts = [
      {
        id: 'PROD_SEED_SOY_JS2034',
        product_code: 'SEED-SOY-JS2034',
        category: 'CERTIFIED_SEED' as const,
        crop_code: 'SOYBEAN',
        product_name_hi: 'प्रमाणित सोयाबीन बीज (JS 20-34) - ब्लू टैग',
        product_name_en: 'Certified Soybean Seed (JS 20-34) - Blue Tag',
        brand_or_source: 'JNKVV / MP State Seeds Dev Corp',
        composition_or_variety: 'JS 20-34 (कम वर्षा व तना मक्खी प्रतिरोधी, 85 दिन परिपक्वता)',
        lot_number: 'MP-UJ-2026-SOY-901',
        germination_pct: 88.5,
        purity_pct: 99.2,
        unit_spec: '30 kg Bag',
        mrp_inr: 3200,
        farmer_price_inr: 2850,
        stock_quantity: 120,
        prescribed_dosage_per_acre: '25-30 किग्रा प्रति एकड़ (बीजोपचार उपरांत)',
        scientific_solution_note_hi: 'बीज विकास निगम द्वारा प्रमाणित। 88% से अधिक अंकुरण गारंटी। तना मक्खी व चारकोल रॉट प्रतिरोधी।',
        cibrc_or_fco_reg: 'Seeds Act 1966 Sec 7 / MP-SCA-8420'
      },
      {
        id: 'PROD_SEED_WHT_HI1544',
        product_code: 'SEED-WHT-HI1544',
        category: 'CERTIFIED_SEED' as const,
        crop_code: 'WHEAT',
        product_name_hi: 'प्रमाणित गेहूं बीज (पूर्णा HI-1544) - आधार/प्रमाणित',
        product_name_en: 'Certified Wheat Seed (HI-1544 Purna)',
        brand_or_source: 'IARI Regional Station Indore / NSC',
        composition_or_variety: 'HI-1544 Purna (मध्य भारत चपाती श्रेष्ठ, रस्ट प्रतिरोधी)',
        lot_number: 'MP-UJ-2026-WHT-410',
        germination_pct: 93.0,
        purity_pct: 99.6,
        unit_spec: '40 kg Bag',
        mrp_inr: 1800,
        farmer_price_inr: 1650,
        stock_quantity: 250,
        prescribed_dosage_per_acre: '40 किग्रा प्रति एकड़ (सिंचित मध्य मालवा)',
        scientific_solution_note_hi: 'उत्कृष्ट चमक व प्रोटीन सामग्री। भूरा व पीला रतुआ प्रतिरोधी। औसत उपज 22-25 क्विंटल/एकड़।',
        cibrc_or_fco_reg: 'Seeds Act 1966 Sec 7 / NSC-7712'
      },
      {
        id: 'PROD_SEED_CHL_TEJA17',
        product_code: 'SEED-CHL-TEJA17',
        category: 'CERTIFIED_SEED' as const,
        crop_code: 'CHILLI',
        product_name_hi: 'हाइब्रिड तीखी मिर्च बीज (तेजा S-17)',
        product_name_en: 'High Pungency Hybrid Chilli Seed (Teja S-17)',
        brand_or_source: 'Andhra AP Seeds Corp / Certified Lot',
        composition_or_variety: 'Teja S-17 F1 Hybrid (एक्सपोर्ट ग्रेड, लीफ कर्ल सहनशील)',
        lot_number: 'AP-GNT-2026-CHL-108',
        germination_pct: 91.0,
        purity_pct: 99.8,
        unit_spec: '100 gm Pack',
        mrp_inr: 1100,
        farmer_price_inr: 950,
        stock_quantity: 80,
        prescribed_dosage_per_acre: '80-100 ग्राम प्रति एकड़ (नर्सरी रोपाई)',
        scientific_solution_note_hi: 'गहरा लाल रंग और 75,000 SHU तीखापन। चूसक कीटों एवं मरोड़िया रोग के प्रति उच्च सहनशीलता।',
        cibrc_or_fco_reg: 'Seeds Act 1966 Sec 6 / LIC-4410'
      },
      {
        id: 'PROD_NUT_ZN_BORON',
        product_code: 'NUT-ZN-BORON-01',
        category: 'CUSTOM_MICRONUTRIENT' as const,
        crop_code: 'ALL',
        product_name_hi: 'चिलेटेड जिंक 12% (Zn-EDTA) + बोरॉन 20% कॉम्बो पैक',
        product_name_en: 'Chelated Zinc 12% (Zn-EDTA) + Boron 20% Chelate',
        brand_or_source: 'Krishi Graduate Custom Formulation (FCO Grade)',
        composition_or_variety: 'Zn-EDTA 12% (250g) + Disodium Octaborate Tetrahydrate 20% (250g)',
        lot_number: 'MN-2026-ZB-402',
        germination_pct: null,
        purity_pct: 99.0,
        unit_spec: '500 gm Combo',
        mrp_inr: 550,
        farmer_price_inr: 450,
        stock_quantity: 300,
        prescribed_dosage_per_acre: '1.0 ग्राम जिंक + 0.75 ग्राम बोरॉन प्रति लीटर पानी (200L/एकड़)',
        scientific_solution_note_hi: 'काली मिट्टी में जिंक लॉक-अप को 100% बायपास करता है। फूलों का झड़ना रोकता है एवं फली भराई में 18% वृद्धि।',
        cibrc_or_fco_reg: 'Fertilizer (Control) Order 1985 Schedule I(f) Reg: MP-FCO-4910'
      },
      {
        id: 'PROD_BIO_ZSB_RHIZO',
        product_code: 'BIO-ZSB-RHIZO-01',
        category: 'BIO_FERTILIZER' as const,
        crop_code: 'SOYBEAN',
        product_name_hi: 'जिंक सोल्यूबिलाइजिंग बायो-कल्चर (ZSB) + राइजोबियम कल्चर',
        product_name_en: 'Zinc Solubilizing Bio-Culture + Rhizobium Consortium',
        brand_or_source: 'ICAR-IISR Indore Technology Transfer / Agri-Clinic Lab',
        composition_or_variety: 'Pseudomonas striata (ZSB) + Bradyrhizobium japonicum (1x10^9 CFU/ml)',
        lot_number: 'BIO-2026-ZSB-882',
        germination_pct: null,
        purity_pct: 99.5,
        unit_spec: '1000 ml Bottle',
        mrp_inr: 450,
        farmer_price_inr: 360,
        stock_quantity: 150,
        prescribed_dosage_per_acre: '500 मिली प्रति एकड़ (ड्रिप / स्प्रे) अथवा 10 मिली/किग्रा बीज उपचार',
        scientific_solution_note_hi: 'मिट्टी में फिक्स जिंक को घुलनशील बनाकर जड़ों को उपलब्ध कराता है। रासायनिक जिंक पर निर्भरता 40% कम करता है।',
        cibrc_or_fco_reg: 'FCO 1985 Biofertilizer Specs Cl. 28B'
      },
      {
        id: 'PROD_BIO_TRICHO_WP',
        product_code: 'BIO-TRICHO-WP-01',
        category: 'BIO_PESTICIDE' as const,
        crop_code: 'ALL',
        product_name_hi: 'ट्राइकोडर्मा विरिडी 1% WP (बायो-फंगीसाइड)',
        product_name_en: 'Trichoderma viride 1% WP Bio-Fungicide',
        brand_or_source: 'IIHR Formula / CIB&RC Licensed',
        composition_or_variety: 'Trichoderma viride strain 2x10^8 cfu/gm',
        lot_number: 'TRI-2026-WP-312',
        germination_pct: null,
        purity_pct: 98.5,
        unit_spec: '1 kg Foil Pack',
        mrp_inr: 280,
        farmer_price_inr: 220,
        stock_quantity: 200,
        prescribed_dosage_per_acre: '1-2 किग्रा/एकड़ गोबर खाद के साथ अथवा 5 ग्राम/ली पानी छिड़काव',
        scientific_solution_note_hi: 'जड़ सड़न, उकठा (Wilt) और कॉलर रॉट के विरुद्ध 100% जैविक सुरक्षा। जड़ तंत्र को मजबूत करता है।',
        cibrc_or_fco_reg: 'Insecticides Act 1968 / CIB-CIR-9921'
      },
      {
        id: 'PROD_KIT_SOY_YMV',
        product_code: 'KIT-SOY-YMV-01',
        category: 'DISEASE_SOLUTION_KIT' as const,
        crop_code: 'SOYBEAN',
        product_name_hi: 'सोयाबीन पीला मोजेक वायरस (YMV) डॉक्टर क्योर किट',
        product_name_en: 'Soybean Yellow Mosaic Virus Vector Control Doctor Kit',
        brand_or_source: 'Dr. Vikas Agri-Clinic Tailored Curative Pack',
        composition_or_variety: 'इमिडाक्लोप्रिड 17.8% SL (100ml) + बायो-शील्ड नीम 10000 PPM (250ml) + चिलेटेड जिंक व सूक्ष्म पोषक तत्व (250g)',
        lot_number: 'KIT-2026-SYMV-012',
        germination_pct: null,
        purity_pct: 100,
        unit_spec: '1 Complete Acre Kit',
        mrp_inr: 1050,
        farmer_price_inr: 850,
        stock_quantity: 90,
        prescribed_dosage_per_acre: '1 किट प्रति एकड़ (150-200 लीटर पानी में मिलाकर सुबह छिड़काव)',
        scientific_solution_note_hi: 'व्हाइटफ्लाई (सफेद मक्खी) वाहक का तुरंत नियंत्रण + पत्तियों में क्लोरोफिल पुनर्जनन हेतु संपूर्ण 3-इन-1 क्लीनिकल किट।',
        cibrc_or_fco_reg: 'Approved by Registered Agronomist under FCO & CIB&RC'
      },
      {
        id: 'PROD_KIT_COTTON_PBW',
        product_code: 'KIT-COT_PBW-01',
        category: 'DISEASE_SOLUTION_KIT' as const,
        crop_code: 'COTTON',
        product_name_hi: 'कपास गुलाबी सुंडी व रसचूसक सुरक्षा डॉक्टर किट',
        product_name_en: 'Cotton Pink Bollworm & Whitefly Doctor Pack',
        brand_or_source: 'Dr. Vikas Agri-Clinic Tailored Curative Pack',
        composition_or_variety: 'क्लोरांट्रानिलीप्रोल 18.5% SC (60ml) + 5 फेरोमोन डेल्टा ट्रैप (Pectino-Lure) + बोरॉन 20% (200g)',
        lot_number: 'KIT-2026-CPBW-007',
        germination_pct: null,
        purity_pct: 100,
        unit_spec: '1 Complete Acre Kit',
        mrp_inr: 1350,
        farmer_price_inr: 1150,
        stock_quantity: 65,
        prescribed_dosage_per_acre: '1 किट प्रति एकड़ (ट्रैप खेत में लगाएं + शाम को 60ml कीटनाशक व बोरॉन स्प्रे)',
        scientific_solution_note_hi: 'गुलाबी सुंडी के अंडों व लार्वा का सफाया। बत्ती व फूल गिरने से रोककर टिंडे का आकार 15% बढ़ाता है।',
        cibrc_or_fco_reg: 'Approved by Registered Agronomist under FCO & CIB&RC'
      },
      {
        id: 'PROD_KIT_CHILLI_CURE',
        product_code: 'KIT-CHL-DIEBACK-01',
        category: 'DISEASE_SOLUTION_KIT' as const,
        crop_code: 'CHILLI',
        product_name_hi: 'मिर्च डाईबैक व पाउडरी मिल्ड्यू डॉक्टर किट',
        product_name_en: 'Chilli Dieback & Powdery Mildew Doctor Pack',
        brand_or_source: 'Dr. Vikas Agri-Clinic Tailored Curative Pack',
        composition_or_variety: 'एजोक्सीस्ट्रोबिन 18.2% + डिफेनोकोनाजोल 11.4% SC (100ml) + चिलेटेड बोरॉन 20% (100g) + सिलिकॉन स्प्रेडर (50ml)',
        lot_number: 'KIT-2026-CDIE-003',
        germination_pct: null,
        purity_pct: 100,
        unit_spec: '1 Complete Acre Kit',
        mrp_inr: 1250,
        farmer_price_inr: 990,
        stock_quantity: 75,
        prescribed_dosage_per_acre: '1 किट प्रति एकड़ (200 लीटर पानी में घोल बनाकर पूरे पौधे पर स्प्रे करें)',
        scientific_solution_note_hi: 'मिर्च की टहनियों का ऊपर से सूखना (डाईबैक) व फल सड़न तुरंत नियंत्रित। फूलों की संख्या बढ़ाता है।',
        cibrc_or_fco_reg: 'Approved by Registered Agronomist under FCO & CIB&RC'
      }
    ];

    for (const prod of certifiedProducts) {
      CertifiedInputProductRepository.upsert(prod);
    }

    // C. Demo Official Agri-Prescription (Agri-Rx)
    AgronomistPrescriptionRepository.create({
      id: 'rx-seed-demo-01',
      prescription_no: 'AGRI-RX-2026-0814',
      farmer_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      mobile_number: '9876543210',
      village: 'Mullapura, Badnagar, Ujjain',
      crop_name: 'SOYBEAN',
      acreage: 3.5,
      diagnosis_id: 'diag-demo-01',
      primary_diagnosis_hi: 'सोयाबीन पीला मोजेक वायरस (YMV) एवं तीव्र जिंक-आयरन कमी',
      rx_items_json: [
        {
          product_code: 'KIT-SOY-YMV-01',
          product_name: 'सोयाबीन पीला मोजेक डॉक्टर किट (3-इन-1 क्लीनिकल पैक)',
          quantity: 3,
          dosage_instructions: '1 किट प्रति एकड़ (150-200 लीटर पानी में घोलकर सुबह स्प्रे करें)',
          rate_inr: 850
        },
        {
          product_code: 'NUT-ZN-BORON-01',
          product_name: 'चिलेटेड जिंक 12% + बोरॉन 20% कॉम्बो पैक',
          quantity: 2,
          dosage_instructions: '500 ग्राम प्रति 200 लीटर पानी (फली भराई से पहले)',
          rate_inr: 450
        }
      ],
      doctor_notes_hi: 'दिन की तेज धूप में छिड़काव कदापि न करें। सुबह 07:00 से 10:00 बजे के मध्य सिलिकॉन स्प्रेडर के साथ स्प्रे करें। 7 दिन बाद क्लिनिक में फॉलो-अप दें।',
      graduate_reg_no: 'MANAGE/ACABC/MP-UJ/2022/9481',
      digital_signature_stamp: 'DIGI-STAMP-JNKVV-AGRI-GRAD-7749',
      status: 'DISPENSED'
    });

    // D. Demo Farmer Order & Pay-After-Harvest Bahi-Khata Ledger
    FarmerOrderKhataRepository.create({
      id: 'order-khata-seed-01',
      order_no: 'ORD-KHATA-2026-1049',
      prescription_no: 'AGRI-RX-2026-0814',
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      mobile_number: '9876543210',
      village: 'Mullapura, Badnagar, Ujjain',
      items_json: [
        { product_code: 'KIT-SOY-YMV-01', name: 'सोयाबीन पीला मोजेक डॉक्टर किट', qty: 3, rate: 850, amount: 2550 },
        { product_code: 'NUT-ZN-BORON-01', name: 'चिलेटेड जिंक 12% + बोरॉन 20% कॉम्बो', qty: 2, rate: 450, amount: 900 }
      ],
      total_amount_inr: 3450,
      discount_inr: 250,
      net_payable_inr: 3200,
      payment_mode: 'PAY_AFTER_HARVEST_CREDIT',
      harvest_credit_due_date: '2026-11-20 (सोयाबीन मंडी विक्रय उपरांत)',
      credit_settled_amount_inr: 1000,
      invoice_docket: 'INV-MP-UJJ-2026-88321',
      order_status: 'CONFIRMED_DISPATCH'
    });

    // E. Demo Tele-Agronomy / Field Audit Consultation Booking
    AgriConsultationBookingRepository.create({
      id: 'consult-seed-01',
      booking_ref: 'CONS-VID-2026-4412',
      farmer_name: 'Ramesh Patel (रमेश पटेल)',
      mobile_number: '9876543210',
      crop_name: 'SOYBEAN',
      acreage: 3.5,
      consultation_type: 'TELE_VIDEO_CALL',
      scheduled_slot: '2026-10-19 शाम 05:30 बजे (WhatsApp HD Video)',
      fee_inr: 0,
      payment_status: 'FREE_KVK_ACABC_SPONSORED',
      agronomist_notes: 'सोयाबीन फली भरने की अवस्था में इल्ली व फफूंद सुरक्षा पर 15 मिनट लाइव वीडियो मार्गदर्शन।',
      status: 'CONFIRMED'
    });
  }
}


