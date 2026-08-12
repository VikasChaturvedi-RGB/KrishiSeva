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
  FarmerActivityLogRepository 
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

    // 7. Seed CIB&RC Certified Agri-Clinic Inventory
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

    // 10. Seed Initial Farmer Login & Activity Record
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

    AuditRepository.log('SYSTEM_SEED', 'SYSTEM', 'DATABASE', 'ALL', { status: 'SUCCESS', seededRecords: 13 });
    console.log('✅ Production database successfully seeded.');
  }
}
