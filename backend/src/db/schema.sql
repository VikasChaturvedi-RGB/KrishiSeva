-- =========================================================================
-- AgriScan AI (Krishi Swasthya Sahayak) Production Database Schema
-- Embedded Relational Engine with Foreign Keys & Indexes
-- =========================================================================

-- 1. Users Table (Farmers, Agri-Clinicians, KVK Agronomists, Admins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    mobile_number TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('FARMER', 'CLINIC_OPERATOR', 'AGRONOMIST', 'COMPLIANCE_ADMIN', 'SUPER_ADMIN')),
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    taluka TEXT NOT NULL,
    village TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'hi',
    is_profile_complete INTEGER NOT NULL DEFAULT 0,
    associated_clinic_id TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(state, district);

-- 2. DPDP Act 2023 Digital Consent Audit Trail
CREATE TABLE IF NOT EXISTS dpdp_consents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    privacy_policy_version TEXT NOT NULL,
    consent_timestamp TEXT NOT NULL,
    language_code TEXT NOT NULL,
    consented_purposes TEXT NOT NULL, -- JSON Array of consented purpose strings
    consent_audit_hash TEXT NOT NULL, -- SHA-256 cryptographic audit record
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dpdp_user ON dpdp_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_dpdp_hash ON dpdp_consents(consent_audit_hash);

-- 3. OTP Authentication Sessions
CREATE TABLE IF NOT EXISTS otp_sessions (
    session_id TEXT PRIMARY KEY,
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_sessions(mobile_number);

-- 4. Farm Parcels
CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    survey_number TEXT,
    total_area REAL NOT NULL,
    area_unit TEXT NOT NULL DEFAULT 'ACRE' CHECK(area_unit IN ('ACRE', 'HECTARE', 'BIGHA', 'GUNTHA')),
    soil_type TEXT NOT NULL,
    irrigation_type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    elevation_meters REAL,
    has_soil_card INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer ON farms(farmer_id);

-- 5. Soil Health Cards (12 Diagnostic Parameters)
CREATE TABLE IF NOT EXISTS soil_health_cards (
    id TEXT PRIMARY KEY,
    farm_id TEXT UNIQUE NOT NULL,
    test_date TEXT NOT NULL,
    testing_lab_name TEXT NOT NULL,
    ph REAL NOT NULL,
    electrical_conductivity REAL NOT NULL,
    organic_carbon_percent REAL NOT NULL,
    nitrogen_kg_ha REAL NOT NULL,
    phosphorus_kg_ha REAL NOT NULL,
    potassium_kg_ha REAL NOT NULL,
    zinc_ppm REAL NOT NULL,
    iron_ppm REAL NOT NULL,
    boron_ppm REAL NOT NULL,
    sulphur_ppm REAL NOT NULL,
    is_deficient_zinc INTEGER NOT NULL DEFAULT 0,
    is_deficient_nitrogen INTEGER NOT NULL DEFAULT 0,
    is_deficient_potash INTEGER NOT NULL DEFAULT 0,
    nutrient_status_summary_localized TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_soil_farm ON soil_health_cards(farm_id);

-- 6. Crop Cycles
CREATE TABLE IF NOT EXISTS crop_cycles (
    id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL,
    crop_id TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    sowing_date TEXT NOT NULL,
    current_growth_stage TEXT NOT NULL DEFAULT 'VEGETATIVE',
    expected_harvest_date TEXT,
    seed_treatment_applied INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    days_since_sowing INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crop_farm ON crop_cycles(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_status ON crop_cycles(status);

-- 7. Diagnostic Cases & Multimodal AI Inferences
CREATE TABLE IF NOT EXISTS diagnoses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    farm_id TEXT,
    crop_cycle_id TEXT,
    image_url TEXT NOT NULL,
    blur_score REAL NOT NULL,
    brightness_score REAL NOT NULL,
    is_acceptable_quality INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK(status IN ('ANALYZING', 'DIAGNOSED', 'NEEDS_CLARIFICATION', 'ESCALATED_AGRONOMIST', 'SPECIALIST_RESOLVED', 'REJECTED_POOR_QUALITY', 'COMPLETED_HIGH_CONFIDENCE', 'ADAPTIVE_QUESTIONNAIRE_REQUIRED', 'ESCALATED_TO_SPECIALIST')),
    confidence_score REAL NOT NULL,
    diagnosis_category TEXT NOT NULL,
    primary_diagnosis TEXT NOT NULL, -- JSON Object
    differential_diagnoses TEXT, -- JSON Array of differential candidates
    context_data TEXT, -- JSON Object of environmental and crop context
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_diag_user ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diag_status ON diagnoses(status);

-- 8. Adaptive Clarification Questionnaires
CREATE TABLE IF NOT EXISTS adaptive_questionnaires (
    id TEXT PRIMARY KEY,
    diagnosis_id TEXT NOT NULL,
    questionnaire_id TEXT NOT NULL,
    target_disease_code TEXT NOT NULL,
    question_tree TEXT NOT NULL, -- JSON Array of Questions
    farmer_answers TEXT, -- JSON Object of Answered Questions
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    completed_at TEXT,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quest_diag ON adaptive_questionnaires(diagnosis_id);

-- 9. Recommendations & Prescriptions (3-Step Nutrition First)
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    diagnosis_id TEXT UNIQUE NOT NULL,
    priority_order TEXT NOT NULL, -- JSON Array: ['STEP_1_MINERAL_FOLIAR', 'STEP_2_BIO_CONTROL', 'STEP_3_CHEMICAL_INTERVENTION']
    step1_foliar TEXT, -- JSON Object
    step2_bio TEXT, -- JSON Object
    step3_chemical TEXT, -- JSON Object
    compliance_status TEXT NOT NULL, -- JSON Object (CIB&RC & State Ban audit)
    dosage_multiplier REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rec_diag ON recommendations(diagnosis_id);

-- 10. Human Agronomist Escalations (2-Hour SLA Queue)
CREATE TABLE IF NOT EXISTS escalations (
    id TEXT PRIMARY KEY,
    diagnosis_id TEXT NOT NULL,
    farmer_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    farmer_mobile_masked TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    ai_tentative_prediction TEXT NOT NULL,
    tentative_confidence REAL NOT NULL,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_ASSIGNMENT' CHECK(status IN ('PENDING_ASSIGNMENT', 'UNDER_REVIEW', 'RESOLVED', 'BREACHED_SLA')),
    urgency TEXT NOT NULL DEFAULT 'URGENT' CHECK(urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
    sla_expires_at TEXT NOT NULL,
    assigned_agronomist_name TEXT,
    expert_advice_localized TEXT,
    submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    resolved_at TEXT,
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_esc_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_esc_sla ON escalations(sla_expires_at);

-- 11. Agri-Clinic Inventory Batches (CIB&RC Certified Inputs)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('NUTRIENT_FOLIAR', 'BIO_PESTICIDE', 'CHEMICAL_FUNGICIDE', 'CHEMICAL_INSECTICIDE', 'BIO_STIMULANT')),
    active_ingredient TEXT NOT NULL,
    cibrc_reg_no TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    mfg_date TEXT NOT NULL,
    exp_date TEXT NOT NULL,
    mrp_inr REAL NOT NULL,
    stock_units INTEGER NOT NULL DEFAULT 0,
    unit_type TEXT NOT NULL DEFAULT 'BOTTLE_500ML',
    is_state_restricted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_inv_cat ON inventory_batches(category);
CREATE INDEX IF NOT EXISTS idx_inv_ing ON inventory_batches(active_ingredient);

-- 12. Immutable System Audit Logs
CREATE TABLE IF NOT EXISTS audit_trail_logs (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    user_id TEXT,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON Object
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_trail_logs(created_at);

-- 13. Farmer Login & Diagnostic Activity Telemetry Logs
CREATE TABLE IF NOT EXISTS farmer_login_activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    phone_number TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    crop TEXT NOT NULL,
    health_status TEXT NOT NULL,
    deficiencies TEXT NOT NULL,
    suggestions TEXT NOT NULL,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_phone ON farmer_login_activity_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_activity_crop ON farmer_login_activity_logs(crop);
CREATE INDEX IF NOT EXISTS idx_activity_time ON farmer_login_activity_logs(created_at);

-- 14. Real-Time e-NAM / APMC Mandi Prices & Market Intelligence
CREATE TABLE IF NOT EXISTS mandi_prices (
    id TEXT PRIMARY KEY,
    crop_code TEXT NOT NULL,
    crop_name_en TEXT NOT NULL,
    crop_name_hi TEXT NOT NULL,
    variety TEXT NOT NULL,
    mandi_name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    min_price_qtl REAL NOT NULL,
    modal_price_qtl REAL NOT NULL,
    max_price_qtl REAL NOT NULL,
    msp_price_qtl REAL NOT NULL,
    price_change_24h REAL NOT NULL DEFAULT 0,
    arrival_tonnes REAL NOT NULL DEFAULT 0,
    distance_km REAL NOT NULL DEFAULT 15,
    sell_hold_signal TEXT NOT NULL CHECK(sell_hold_signal IN ('STRONG_SELL', 'HOLD_FOR_RISE', 'SELL_AT_MSP')),
    advisory_en TEXT NOT NULL,
    advisory_hi TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_mandi_crop ON mandi_prices(crop_code);
CREATE INDEX IF NOT EXISTS idx_mandi_state ON mandi_prices(state, district);

-- 15. Government Schemes, KCC & PMFBY 72-Hour Crop Loss Claims
CREATE TABLE IF NOT EXISTS scheme_applications (
    id TEXT PRIMARY KEY,
    reference_no TEXT UNIQUE NOT NULL,
    user_id TEXT,
    farmer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    scheme_code TEXT NOT NULL,
    scheme_name TEXT NOT NULL,
    application_type TEXT NOT NULL CHECK(application_type IN ('SCHEME_ENROLLMENT', 'PMFBY_72H_CLAIM', 'KCC_CREDIT_APPLICATION', 'SOLAR_PUMP_SUBSIDY')),
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    acreage REAL NOT NULL DEFAULT 2.0,
    estimated_benefit_inr REAL NOT NULL DEFAULT 0,
    claim_reason TEXT,
    diagnosis_id TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED_UNDER_VERIFICATION',
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_scheme_mobile ON scheme_applications(mobile_number);
CREATE INDEX IF NOT EXISTS idx_scheme_code ON scheme_applications(scheme_code);

-- 16. Hyperlocal District / Tehsil Pest & Disease Outbreak Radar
CREATE TABLE IF NOT EXISTS community_outbreaks (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT NOT NULL,
    crop_code TEXT NOT NULL,
    crop_name_en TEXT NOT NULL,
    crop_name_hi TEXT NOT NULL,
    disease_name_en TEXT NOT NULL,
    disease_name_hi TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('HIGH_ALERT', 'MODERATE_WATCH', 'CONTAINED')),
    affected_farms_count INTEGER NOT NULL DEFAULT 1,
    distance_km REAL NOT NULL DEFAULT 5.0,
    preventive_step_en TEXT NOT NULL,
    preventive_step_hi TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    verified_by_kvk INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_outbreak_loc ON community_outbreaks(state, district);
CREATE INDEX IF NOT EXISTS idx_outbreak_crop ON community_outbreaks(crop_code);

-- 17. State-Wise Agro-Climatic Challenges & Technology Resolution Matrix
CREATE TABLE IF NOT EXISTS state_agro_challenges (
    id TEXT PRIMARY KEY,
    state_code TEXT UNIQUE NOT NULL,
    state_name_en TEXT NOT NULL,
    state_name_hi TEXT NOT NULL,
    agro_climatic_zone_hi TEXT NOT NULL,
    dominant_crops_hi TEXT NOT NULL,
    soil_water_challenge_hi TEXT NOT NULL,
    soil_water_challenge_en TEXT NOT NULL,
    pest_disease_challenge_hi TEXT NOT NULL,
    pest_disease_challenge_en TEXT NOT NULL,
    market_policy_challenge_hi TEXT NOT NULL,
    banned_pesticides_list TEXT NOT NULL,
    tech_solution_title_hi TEXT NOT NULL,
    tech_solution_title_en TEXT NOT NULL,
    tech_solution_steps_hi TEXT NOT NULL, -- JSON Array of actionable tech interventions
    tech_solution_steps_en TEXT NOT NULL, -- JSON Array
    chc_equipment_name_hi TEXT NOT NULL,
    chc_subsidy_pct INTEGER NOT NULL DEFAULT 50,
    chc_rent_per_acre_inr REAL NOT NULL DEFAULT 600,
    estimated_roi_per_acre_inr REAL NOT NULL DEFAULT 3500,
    state_scheme_highlight_hi TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_state_challenge_code ON state_agro_challenges(state_code);

-- 18. Custom Hiring Center (CHC), Kisan Drone & Bio-Input Tech Intervention Bookings
CREATE TABLE IF NOT EXISTS chc_machinery_bookings (
    id TEXT PRIMARY KEY,
    booking_ref TEXT UNIQUE NOT NULL,
    farmer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_name_hi TEXT NOT NULL,
    district TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    acreage REAL NOT NULL DEFAULT 2.0,
    intervention_type TEXT NOT NULL CHECK(intervention_type IN ('KISAN_DRONE_SPRAY', 'HAPPY_SEEDER_PUSA_DECOMPOSER', 'BBF_TRACTOR_PLANTER', 'BIO_IPM_KIT', 'SOLAR_DRIP_FERTIGATION', 'ANTI_HAIL_OR_LIME_KIT')),
    equipment_name_hi TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    gross_cost_inr REAL NOT NULL,
    subsidy_amount_inr REAL NOT NULL,
    net_farmer_payable_inr REAL NOT NULL,
    carbon_or_water_reward_hi TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED_CHC_ALLOCATED',
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_chc_booking_state ON chc_machinery_bookings(state_code);
CREATE INDEX IF NOT EXISTS idx_chc_booking_mobile ON chc_machinery_bookings(mobile_number);

-- 19. Agriculture Graduate Statutory Licenses & Accreditation Vault
CREATE TABLE IF NOT EXISTS agri_graduate_licenses (
    id TEXT PRIMARY KEY,
    graduate_name TEXT NOT NULL,
    qualification TEXT NOT NULL, -- e.g. 'B.Sc. (Hons) Agriculture'
    university TEXT NOT NULL,
    passing_year INTEGER NOT NULL,
    acabc_reg_no TEXT NOT NULL, -- Ministry of Agriculture / MANAGE / NABARD
    seed_license_no TEXT NOT NULL, -- Seeds Act 1966 statutory dealer license
    fertilizer_license_no TEXT NOT NULL, -- FCO 1985 license
    insecticide_license_no TEXT NOT NULL, -- Insecticides Act 1968 license
    drone_pilot_license_no TEXT NOT NULL, -- DGCA Agri-Drone RPC
    clinic_name_hi TEXT NOT NULL,
    clinic_name_en TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    digital_stamp_code TEXT NOT NULL,
    consultation_fee_inr REAL NOT NULL DEFAULT 250,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_grad_mobile ON agri_graduate_licenses(mobile_number);

-- 20. Certified Input Products (Seeds, Custom Nutrients, Bio-Control & Solution Bundles)
CREATE TABLE IF NOT EXISTS certified_input_products (
    id TEXT PRIMARY KEY,
    product_code TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('CERTIFIED_SEED', 'CUSTOM_MICRONUTRIENT', 'BIO_FERTILIZER', 'BIO_PESTICIDE', 'DISEASE_SOLUTION_KIT')),
    crop_code TEXT NOT NULL,
    product_name_hi TEXT NOT NULL,
    product_name_en TEXT NOT NULL,
    brand_or_source TEXT NOT NULL,
    composition_or_variety TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    germination_pct REAL,
    purity_pct REAL,
    unit_spec TEXT NOT NULL,
    mrp_inr REAL NOT NULL,
    farmer_price_inr REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    prescribed_dosage_per_acre TEXT NOT NULL,
    scientific_solution_note_hi TEXT NOT NULL,
    cibrc_or_fco_reg TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_prod_category ON certified_input_products(category);
CREATE INDEX IF NOT EXISTS idx_prod_crop ON certified_input_products(crop_code);

-- 21. Agronomist Digital Prescriptions (Agri-Rx / किसान कृषि पर्चा)
CREATE TABLE IF NOT EXISTS agronomist_prescriptions (
    id TEXT PRIMARY KEY,
    prescription_no TEXT UNIQUE NOT NULL,
    farmer_id TEXT,
    farmer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    village TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    acreage REAL NOT NULL,
    diagnosis_id TEXT,
    primary_diagnosis_hi TEXT NOT NULL,
    rx_items_json TEXT NOT NULL, -- JSON Array of prescribed products & dosages
    doctor_notes_hi TEXT NOT NULL,
    graduate_reg_no TEXT NOT NULL,
    digital_signature_stamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRESCRIBED' CHECK(status IN ('PRESCRIBED', 'DISPENSED', 'PARTIAL_DISPENSED')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_rx_no ON agronomist_prescriptions(prescription_no);
CREATE INDEX IF NOT EXISTS idx_rx_mobile ON agronomist_prescriptions(mobile_number);

-- 22. Farmer Orders & Pay-After-Harvest Credit Khata Ledger
CREATE TABLE IF NOT EXISTS farmer_orders_and_khata (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    prescription_no TEXT,
    farmer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    village TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_amount_inr REAL NOT NULL,
    discount_inr REAL NOT NULL DEFAULT 0,
    net_payable_inr REAL NOT NULL,
    payment_mode TEXT NOT NULL CHECK(payment_mode IN ('UPI_INSTANT', 'CASH_ON_DELIVERY', 'PAY_AFTER_HARVEST_CREDIT')),
    harvest_credit_due_date TEXT,
    credit_settled_amount_inr REAL NOT NULL DEFAULT 0,
    invoice_docket TEXT NOT NULL,
    order_status TEXT NOT NULL DEFAULT 'CONFIRMED_DISPATCH' CHECK(order_status IN ('CONFIRMED_DISPATCH', 'DELIVERED', 'SETTLED', 'CANCELLED')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_no ON farmer_orders_and_khata(order_no);
CREATE INDEX IF NOT EXISTS idx_order_mobile ON farmer_orders_and_khata(mobile_number);

-- 23. Tele-Agronomy & Seasonal Crop Care Consultation Bookings
CREATE TABLE IF NOT EXISTS agri_consultation_bookings (
    id TEXT PRIMARY KEY,
    booking_ref TEXT UNIQUE NOT NULL,
    farmer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    acreage REAL NOT NULL,
    consultation_type TEXT NOT NULL CHECK(consultation_type IN ('TELE_VIDEO_CALL', 'IN_PERSON_FIELD_AUDIT', 'SEASONAL_CROP_CARE_CONTRACT')),
    scheduled_slot TEXT NOT NULL,
    fee_inr REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PAID',
    agronomist_notes TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_consult_ref ON agri_consultation_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_consult_mobile ON agri_consultation_bookings(mobile_number);


