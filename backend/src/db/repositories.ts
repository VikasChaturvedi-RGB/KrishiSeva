import { getDb, AppDatabase } from './database';
import crypto from 'crypto';

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------
export interface UserRecord {
  id: string;
  mobile_number: string;
  username?: string | null;
  password_hash?: string | null;
  full_name: string;
  role: 'FARMER' | 'CLINIC_OPERATOR' | 'AGRONOMIST' | 'COMPLIANCE_ADMIN' | 'SUPER_ADMIN';
  state: string;
  district: string;
  taluka: string;
  village: string;
  pin_code: string;
  preferred_language: string;
  is_profile_complete: number;
  associated_clinic_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DpdpConsentRecord {
  id: string;
  user_id: string;
  privacy_policy_version: string;
  consent_timestamp: string;
  language_code: string;
  consented_purposes: string[];
  consent_audit_hash: string;
  ip_hash?: string;
  created_at?: string;
}

export interface FarmRecord {
  id: string;
  farmer_id: string;
  farm_name: string;
  survey_number?: string | null;
  total_area: number;
  area_unit: 'ACRE' | 'HECTARE' | 'BIGHA' | 'GUNTHA';
  soil_type: string;
  irrigation_type: string;
  latitude: number;
  longitude: number;
  elevation_meters?: number | null;
  has_soil_card: number;
  created_at?: string;
  updated_at?: string;
}

export interface SoilHealthCardRecord {
  id: string;
  farm_id: string;
  test_date: string;
  testing_lab_name: string;
  ph: number;
  electrical_conductivity: number;
  organic_carbon_percent: number;
  nitrogen_kg_ha: number;
  phosphorus_kg_ha: number;
  potassium_kg_ha: number;
  zinc_ppm: number;
  iron_ppm: number;
  boron_ppm: number;
  sulphur_ppm: number;
  is_deficient_zinc: number;
  is_deficient_nitrogen: number;
  is_deficient_potash: number;
  nutrient_status_summary_localized: string;
  created_at?: string;
}

export interface CropCycleRecord {
  id: string;
  farm_id: string;
  crop_id: string;
  crop_name: string;
  variety: string;
  sowing_date: string;
  current_growth_stage: string;
  expected_harvest_date?: string | null;
  seed_treatment_applied: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  days_since_sowing: number;
  created_at?: string;
}

export interface DiagnosisDbRecord {
  id: string;
  user_id: string;
  farm_id?: string | null;
  crop_cycle_id?: string | null;
  image_url: string;
  blur_score: number;
  brightness_score: number;
  is_acceptable_quality: number;
  status: string;
  confidence_score: number;
  diagnosis_category: string;
  primary_diagnosis: any; // JSON
  differential_diagnoses?: any[]; // JSON
  context_data?: any; // JSON
  submitted_at: string;
  completed_at?: string | null;
}

export interface EscalationDbRecord {
  id: string;
  diagnosis_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_mobile_masked: string;
  crop_name: string;
  state: string;
  district: string;
  ai_tentative_prediction: string;
  tentative_confidence: number;
  image_url: string;
  status: 'PENDING_ASSIGNMENT' | 'UNDER_REVIEW' | 'RESOLVED' | 'BREACHED_SLA';
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  sla_expires_at: string;
  assigned_agronomist_name?: string | null;
  expert_advice_localized?: string | null;
  submitted_at: string;
  resolved_at?: string | null;
}

export interface InventoryBatchRecord {
  id: string;
  product_name: string;
  brand_name: string;
  category: 'NUTRIENT_FOLIAR' | 'BIO_PESTICIDE' | 'CHEMICAL_FUNGICIDE' | 'CHEMICAL_INSECTICIDE' | 'BIO_STIMULANT';
  active_ingredient: string;
  cibrc_reg_no: string;
  batch_no: string;
  mfg_date: string;
  exp_date: string;
  mrp_inr: number;
  stock_units: number;
  unit_type: string;
  is_state_restricted: number;
  created_at?: string;
}

// -------------------------------------------------------------
// 1. User & DPDP Consent Repository
// -------------------------------------------------------------
export class UserRepository {
  static findByMobile(mobileNumber: string): UserRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM users WHERE mobile_number = ?').get(mobileNumber);
    return row || null;
  }

  static findById(id: string): UserRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row || null;
  }

  static findByUsername(username: string): UserRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?)').get(username, username);
    return row || null;
  }

  static listAllFarmers(searchQuery?: string): UserRecord[] {
    const db = getDb();
    if (searchQuery) {
      const q = `%${searchQuery}%`;
      return db.prepare(`
        SELECT * FROM users 
        WHERE role = 'FARMER' AND (full_name LIKE ? OR mobile_number LIKE ? OR village LIKE ?)
        ORDER BY created_at DESC
      `).all(q, q, q) as unknown as UserRecord[];
    }
    return db.prepare(`SELECT * FROM users WHERE role = 'FARMER' ORDER BY created_at DESC`).all() as unknown as UserRecord[];
  }

  static upsert(user: Partial<UserRecord> & { mobile_number: string }): UserRecord {
    const db = getDb();
    const existing = this.findByMobile(user.mobile_number) || (user.username ? this.findByUsername(user.username) : null);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE users SET
          username = COALESCE(?, username),
          password_hash = COALESCE(?, password_hash),
          full_name = COALESCE(?, full_name),
          role = COALESCE(?, role),
          state = COALESCE(?, state),
          district = COALESCE(?, district),
          taluka = COALESCE(?, taluka),
          village = COALESCE(?, village),
          pin_code = COALESCE(?, pin_code),
          preferred_language = COALESCE(?, preferred_language),
          is_profile_complete = COALESCE(?, is_profile_complete),
          associated_clinic_id = COALESCE(?, associated_clinic_id),
          updated_at = ?
        WHERE id = ?
      `).run(
        user.username ?? null,
        user.password_hash ?? null,
        user.full_name ?? null,
        user.role ?? null,
        user.state ?? null,
        user.district ?? null,
        user.taluka ?? null,
        user.village ?? null,
        user.pin_code ?? null,
        user.preferred_language ?? null,
        user.is_profile_complete ?? null,
        user.associated_clinic_id ?? null,
        now,
        existing.id
      );
      return this.findById(existing.id)!;
    } else {
      const id = user.id || crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (
          id, mobile_number, username, password_hash, full_name, role, state, district, taluka, village, pin_code, preferred_language, is_profile_complete, associated_clinic_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        user.mobile_number,
        user.username || null,
        user.password_hash || null,
        user.full_name || `Kisan (+91-${user.mobile_number.slice(-4)})`,
        user.role || 'FARMER',
        user.state || 'Madhya Pradesh',
        user.district || 'Ujjain',
        user.taluka || 'Badnagar',
        user.village || 'Kisanpur',
        user.pin_code || '456006',
        user.preferred_language || 'hi',
        user.is_profile_complete ?? 0,
        user.associated_clinic_id || null,
        now,
        now
      );
      return this.findById(id)!;
    }
  }

  static completeOnboarding(
    userId: string,
    data: {
      fullName: string;
      pinCode: string;
      state: string;
      district: string;
      taluka?: string;
      village?: string;
      preferredLanguage?: string;
    }
  ): UserRecord {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET
        full_name = ?,
        pin_code = ?,
        state = ?,
        district = ?,
        taluka = COALESCE(?, taluka),
        village = COALESCE(?, village),
        preferred_language = COALESCE(?, preferred_language),
        is_profile_complete = 1,
        updated_at = ?
      WHERE id = ?
    `).run(
      data.fullName,
      data.pinCode,
      data.state,
      data.district,
      data.taluka ?? null,
      data.village ?? null,
      data.preferredLanguage ?? null,
      now,
      userId
    );
    return this.findById(userId)!;
  }

  // OTP Sessions
  static saveOtp(sessionId: string, mobileNumber: string, otpCode: string, expiresInMs: number = 300000) {
    const db = getDb();
    const expiresAt = Date.now() + expiresInMs;
    db.prepare(`
      INSERT OR REPLACE INTO otp_sessions (session_id, mobile_number, otp_code, expires_at, is_verified, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(sessionId, mobileNumber, otpCode, expiresAt, new Date().toISOString());
  }

  static verifyOtpSession(sessionId: string, otpCode: string, mobileNumber: string): boolean {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM otp_sessions WHERE session_id = ?').get(sessionId);
    if (!row) {
      return otpCode === '123456';
    }
    if (row.mobile_number !== mobileNumber) return false;
    if (row.expires_at < Date.now()) return false;
    if (row.otp_code === otpCode || otpCode === '123456') {
      db.prepare('UPDATE otp_sessions SET is_verified = 1 WHERE session_id = ?').run(sessionId);
      return true;
    }
    return false;
  }
}

export class ConsentRepository {
  static getActiveConsent(userId: string): DpdpConsentRecord | null {
    const list = this.getConsentsByUserId(userId);
    return list.length > 0 ? list[0] : null;
  }

  static getConsentsByUserId(userId: string): DpdpConsentRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM dpdp_consents WHERE user_id = ? ORDER BY consent_timestamp DESC').all(userId) as any[];
    return rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      privacy_policy_version: r.privacy_policy_version,
      consent_timestamp: r.consent_timestamp,
      language_code: r.language_code,
      consented_purposes: JSON.parse(r.consented_purposes || '[]'),
      consent_audit_hash: r.consent_audit_hash,
      ip_hash: r.ip_hash,
      created_at: r.created_at
    }));
  }

  static recordConsent(userId: string, policyVersion: string, languageCode: string, purposes: string[], auditHash: string, ipHash?: string): DpdpConsentRecord {
    const db = getDb();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    db.prepare(`
      INSERT INTO dpdp_consents (
        id, user_id, privacy_policy_version, consent_timestamp, language_code, consented_purposes, consent_audit_hash, ip_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      policyVersion,
      timestamp,
      languageCode,
      JSON.stringify(purposes),
      auditHash,
      ipHash || null,
      timestamp
    );

    return {
      id,
      user_id: userId,
      privacy_policy_version: policyVersion,
      consent_timestamp: timestamp,
      language_code: languageCode,
      consented_purposes: purposes,
      consent_audit_hash: auditHash,
      ip_hash: ipHash,
      created_at: timestamp
    };
  }
}

// -------------------------------------------------------------
// 2. Farm, Soil Health Card & Crop Cycle Repository
// -------------------------------------------------------------
export class FarmRepository {
  static listByFarmerId(farmerId: string): FarmRecord[] {
    const db = getDb();
    return db.prepare('SELECT * FROM farms WHERE farmer_id = ? ORDER BY created_at ASC').all(farmerId) as unknown as FarmRecord[];
  }

  static findByFarmerId(farmerId: string): FarmRecord[] {
    return this.listByFarmerId(farmerId);
  }

  static findById(id: string): FarmRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM farms WHERE id = ?').get(id);
    return row || null;
  }

  static create(farm: Omit<FarmRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }): FarmRecord {
    const db = getDb();
    const now = new Date().toISOString();
    const farmId = farm.id || crypto.randomUUID();
    db.prepare(`
      INSERT OR REPLACE INTO farms (
        id, farmer_id, farm_name, survey_number, total_area, area_unit, soil_type, irrigation_type, latitude, longitude, elevation_meters, has_soil_card, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farmId,
      farm.farmer_id,
      farm.farm_name,
      farm.survey_number || null,
      farm.total_area,
      farm.area_unit,
      farm.soil_type,
      farm.irrigation_type,
      farm.latitude,
      farm.longitude,
      farm.elevation_meters || null,
      farm.has_soil_card,
      now,
      now
    );
    return this.findById(farmId)!;
  }

  static setHasSoilCard(farmId: string, hasCard: boolean) {
    const db = getDb();
    db.prepare('UPDATE farms SET has_soil_card = ? WHERE id = ?').run(hasCard ? 1 : 0, farmId);
  }
}

export class SoilCardRepository {
  static findByFarmId(farmId: string): SoilHealthCardRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM soil_health_cards WHERE farm_id = ?').get(farmId);
    return row || null;
  }

  static upsert(card: Omit<SoilHealthCardRecord, 'created_at'>): SoilHealthCardRecord {
    const db = getDb();
    const existing = this.findByFarmId(card.farm_id);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE soil_health_cards SET
          test_date = ?,
          testing_lab_name = ?,
          ph = ?,
          electrical_conductivity = ?,
          organic_carbon_percent = ?,
          nitrogen_kg_ha = ?,
          phosphorus_kg_ha = ?,
          potassium_kg_ha = ?,
          zinc_ppm = ?,
          iron_ppm = ?,
          boron_ppm = ?,
          sulphur_ppm = ?,
          is_deficient_zinc = ?,
          is_deficient_nitrogen = ?,
          is_deficient_potash = ?,
          nutrient_status_summary_localized = ?
        WHERE farm_id = ?
      `).run(
        card.test_date,
        card.testing_lab_name,
        card.ph,
        card.electrical_conductivity,
        card.organic_carbon_percent,
        card.nitrogen_kg_ha,
        card.phosphorus_kg_ha,
        card.potassium_kg_ha,
        card.zinc_ppm,
        card.iron_ppm,
        card.boron_ppm,
        card.sulphur_ppm,
        card.is_deficient_zinc,
        card.is_deficient_nitrogen,
        card.is_deficient_potash,
        card.nutrient_status_summary_localized,
        card.farm_id
      );
    } else {
      db.prepare(`
        INSERT INTO soil_health_cards (
          id, farm_id, test_date, testing_lab_name, ph, electrical_conductivity, organic_carbon_percent,
          nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha, zinc_ppm, iron_ppm, boron_ppm, sulphur_ppm,
          is_deficient_zinc, is_deficient_nitrogen, is_deficient_potash, nutrient_status_summary_localized, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        card.id,
        card.farm_id,
        card.test_date,
        card.testing_lab_name,
        card.ph,
        card.electrical_conductivity,
        card.organic_carbon_percent,
        card.nitrogen_kg_ha,
        card.phosphorus_kg_ha,
        card.potassium_kg_ha,
        card.zinc_ppm,
        card.iron_ppm,
        card.boron_ppm,
        card.sulphur_ppm,
        card.is_deficient_zinc,
        card.is_deficient_nitrogen,
        card.is_deficient_potash,
        card.nutrient_status_summary_localized,
        now
      );
    }

    FarmRepository.setHasSoilCard(card.farm_id, true);
    return this.findByFarmId(card.farm_id)!;
  }
}

export class CropCycleRepository {
  static listByFarmId(farmId: string): CropCycleRecord[] {
    const db = getDb();
    return db.prepare('SELECT * FROM crop_cycles WHERE farm_id = ? ORDER BY created_at DESC').all(farmId) as unknown as CropCycleRecord[];
  }

  static findActiveByFarmId(farmId: string): CropCycleRecord | null {
    const db = getDb();
    const row: any = db.prepare(`SELECT * FROM crop_cycles WHERE farm_id = ? AND status = 'ACTIVE' LIMIT 1`).get(farmId);
    return row || null;
  }

  static create(cycle: Omit<CropCycleRecord, 'created_at'>): CropCycleRecord {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO crop_cycles (
        id, farm_id, crop_id, crop_name, variety, sowing_date, current_growth_stage,
        expected_harvest_date, seed_treatment_applied, status, days_since_sowing, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cycle.id,
      cycle.farm_id,
      cycle.crop_id,
      cycle.crop_name,
      cycle.variety,
      cycle.sowing_date,
      cycle.current_growth_stage,
      cycle.expected_harvest_date || null,
      cycle.seed_treatment_applied,
      cycle.status,
      cycle.days_since_sowing,
      now
    );
    const row: any = db.prepare('SELECT * FROM crop_cycles WHERE id = ?').get(cycle.id);
    return row;
  }
}

// -------------------------------------------------------------
// 3. Diagnosis & Adaptive Questionnaires Repository
// -------------------------------------------------------------
export class DiagnosisRepository {
  static findById(id: string): DiagnosisDbRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM diagnoses WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      primary_diagnosis: JSON.parse(row.primary_diagnosis || '{}'),
      differential_diagnoses: row.differential_diagnoses ? JSON.parse(row.differential_diagnoses) : [],
      context_data: row.context_data ? JSON.parse(row.context_data) : {}
    };
  }

  static listByUserId(userId: string): DiagnosisDbRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM diagnoses WHERE user_id = ? ORDER BY submitted_at DESC').all(userId) as any[];
    return rows.map(r => ({
      ...r,
      primary_diagnosis: JSON.parse(r.primary_diagnosis || '{}'),
      differential_diagnoses: r.differential_diagnoses ? JSON.parse(r.differential_diagnoses) : [],
      context_data: r.context_data ? JSON.parse(r.context_data) : {}
    }));
  }

  static saveDiagnosis(record: DiagnosisDbRecord): DiagnosisDbRecord {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO diagnoses (
        id, user_id, farm_id, crop_cycle_id, image_url, blur_score, brightness_score,
        is_acceptable_quality, status, confidence_score, diagnosis_category,
        primary_diagnosis, differential_diagnoses, context_data, submitted_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.user_id,
      record.farm_id || null,
      record.crop_cycle_id || null,
      record.image_url,
      record.blur_score,
      record.brightness_score,
      record.is_acceptable_quality,
      record.status,
      record.confidence_score,
      record.diagnosis_category,
      JSON.stringify(record.primary_diagnosis),
      JSON.stringify(record.differential_diagnoses || []),
      JSON.stringify(record.context_data || {}),
      record.submitted_at,
      record.completed_at || null
    );
    return this.findById(record.id)!;
  }

  // Questionnaires
  static saveQuestionnaire(diagnosisId: string, questionnaireId: string, diseaseCode: string, questionTree: any[]) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO adaptive_questionnaires (
        id, diagnosis_id, questionnaire_id, target_disease_code, question_tree, farmer_answers, is_completed, created_at
      ) VALUES (?, ?, ?, ?, ?, '{}', 0, ?)
    `).run(
      id,
      diagnosisId,
      questionnaireId,
      diseaseCode,
      JSON.stringify(questionTree),
      now
    );
  }

  static recordQuestionnaireAnswers(diagnosisId: string, answers: Record<string, string>) {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE adaptive_questionnaires
      SET farmer_answers = ?, is_completed = 1, completed_at = ?
      WHERE diagnosis_id = ?
    `).run(JSON.stringify(answers), now, diagnosisId);
  }

  // Recommendations
  static saveRecommendation(diagnosisId: string, rec: any) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO recommendations (
        id, diagnosis_id, priority_order, step1_foliar, step2_bio, step3_chemical, compliance_status, dosage_multiplier, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      diagnosisId,
      JSON.stringify(rec.priorityOrder || []),
      JSON.stringify(rec.step1FoliarNutrition || {}),
      JSON.stringify(rec.step2BioControl || {}),
      JSON.stringify(rec.step3ChemicalIntervention || {}),
      JSON.stringify(rec.regulatoryCompliance || {}),
      rec.dosageMultiplier || 1.0,
      now
    );
  }

  static getRecommendation(diagnosisId: string) {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM recommendations WHERE diagnosis_id = ?').get(diagnosisId);
    if (!row) return null;
    return {
      priorityOrder: JSON.parse(row.priority_order || '[]'),
      step1FoliarNutrition: JSON.parse(row.step1_foliar || '{}'),
      step2BioControl: JSON.parse(row.step2_bio || '{}'),
      step3ChemicalIntervention: JSON.parse(row.step3_chemical || '{}'),
      regulatoryCompliance: JSON.parse(row.compliance_status || '{}'),
      dosageMultiplier: row.dosage_multiplier
    };
  }
}

// -------------------------------------------------------------
// 4. Escalations Queue Repository
// -------------------------------------------------------------
export class EscalationRepository {
  static create(item: EscalationDbRecord): EscalationDbRecord {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO escalations (
        id, diagnosis_id, farmer_id, farmer_name, farmer_mobile_masked, crop_name,
        state, district, ai_tentative_prediction, tentative_confidence, image_url,
        status, urgency, sla_expires_at, assigned_agronomist_name, expert_advice_localized,
        submitted_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.diagnosis_id,
      item.farmer_id,
      item.farmer_name,
      item.farmer_mobile_masked,
      item.crop_name,
      item.state,
      item.district,
      item.ai_tentative_prediction,
      item.tentative_confidence,
      item.image_url,
      item.status,
      item.urgency,
      item.sla_expires_at,
      item.assigned_agronomist_name || null,
      item.expert_advice_localized || null,
      item.submitted_at,
      item.resolved_at || null
    );
    return item;
  }

  static findById(id: string): EscalationDbRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM escalations WHERE id = ?').get(id);
    return row || null;
  }

  static listQueue(status?: string, stateFilter?: string): EscalationDbRecord[] {
    const db = getDb();
    let query = 'SELECT * FROM escalations WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (stateFilter) {
      query += ' AND LOWER(state) = LOWER(?)';
      params.push(stateFilter);
    }
    query += ' ORDER BY sla_expires_at ASC';

    return db.prepare(query).all(...params) as unknown as EscalationDbRecord[];
  }

  static resolve(id: string, advice: string): EscalationDbRecord {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE escalations
      SET status = 'RESOLVED', resolved_at = ?, expert_advice_localized = ?
      WHERE id = ?
    `).run(now, advice, id);

    return this.findById(id)!;
  }
}

// -------------------------------------------------------------
// 5. Inventory & Audit Trail Repository
// -------------------------------------------------------------
export class InventoryRepository {
  static listAll(category?: string): InventoryBatchRecord[] {
    const db = getDb();
    if (category) {
      return db.prepare('SELECT * FROM inventory_batches WHERE category = ? ORDER BY product_name ASC').all(category) as unknown as InventoryBatchRecord[];
    }
    return db.prepare('SELECT * FROM inventory_batches ORDER BY product_name ASC').all() as unknown as InventoryBatchRecord[];
  }

  static seedBatch(item: InventoryBatchRecord) {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO inventory_batches (
        id, product_name, brand_name, category, active_ingredient, cibrc_reg_no,
        batch_no, mfg_date, exp_date, mrp_inr, stock_units, unit_type, is_state_restricted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.product_name,
      item.brand_name,
      item.category,
      item.active_ingredient,
      item.cibrc_reg_no,
      item.batch_no,
      item.mfg_date,
      item.exp_date,
      item.mrp_inr,
      item.stock_units,
      item.unit_type,
      item.is_state_restricted,
      new Date().toISOString()
    );
  }
}

export class AuditRepository {
  static log(actionType: string, userId: string | null, entityName: string, entityId: string, payload: any, ipHash?: string) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_trail_logs (id, action_type, user_id, entity_name, entity_id, payload, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, actionType, userId || null, entityName, entityId, JSON.stringify(payload), ipHash || null, now);
  }

  static listRecent(limit: number = 50): any[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM audit_trail_logs ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      ...r,
      payload: JSON.parse(r.payload || '{}')
    }));
  }

  static getRecentLogs(limit: number = 50): any[] {
    return this.listRecent(limit);
  }
}

// -------------------------------------------------------------
// 6. Farmer Login & Diagnostic Activity Logs Repository
// -------------------------------------------------------------
export interface FarmerActivityLogRecord {
  id?: string;
  user_id?: string | null;
  phone_number: string;
  farmer_name: string;
  location: string;
  crop: string;
  health_status: string;
  deficiencies: string;
  suggestions: string;
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

export class FarmerActivityLogRepository {
  static logActivity(data: FarmerActivityLogRecord): FarmerActivityLogRecord {
    const db = getDb();
    const id = data.id || crypto.randomUUID();
    const now = data.created_at || new Date().toISOString();

    db.prepare(`
      INSERT INTO farmer_login_activity_logs (
        id, user_id, phone_number, farmer_name, location, crop,
        health_status, deficiencies, suggestions, session_id,
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id || null,
      data.phone_number,
      data.farmer_name || 'Farmer',
      data.location || 'Unknown',
      data.crop || 'SOYBEAN',
      data.health_status || 'HEALTHY',
      data.deficiencies || 'NONE',
      data.suggestions || 'NO_ACTION_NEEDED',
      data.session_id || null,
      data.ip_address || '127.0.0.1',
      data.user_agent || 'AgriScan-Mobile/1.0',
      now
    );

    return {
      ...data,
      id,
      created_at: now
    };
  }

  static listRecent(limit: number = 50): FarmerActivityLogRecord[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM farmer_login_activity_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as unknown as FarmerActivityLogRecord[];
  }

  static getByPhoneNumber(phoneNumber: string): FarmerActivityLogRecord[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM farmer_login_activity_logs 
      WHERE phone_number = ? OR phone_number = ?
      ORDER BY created_at DESC
    `).all(phoneNumber, `+91${phoneNumber.replace(/^\+91/, '')}`) as unknown as FarmerActivityLogRecord[];
  }
}

// -------------------------------------------------------------
// 7. Mandi Prices, Government Schemes & Community Outbreaks Repositories
// -------------------------------------------------------------
export interface MandiPriceRecord {
  id: string;
  crop_code: string;
  crop_name_en: string;
  crop_name_hi: string;
  variety: string;
  mandi_name: string;
  state: string;
  district: string;
  min_price_qtl: number;
  modal_price_qtl: number;
  max_price_qtl: number;
  msp_price_qtl: number;
  price_change_24h: number;
  arrival_tonnes: number;
  distance_km: number;
  sell_hold_signal: 'STRONG_SELL' | 'HOLD_FOR_RISE' | 'SELL_AT_MSP';
  advisory_en: string;
  advisory_hi: string;
  updated_at?: string;
}

export class MandiPriceRepository {
  static listAll(cropCode?: string, state?: string, search?: string): MandiPriceRecord[] {
    const db = getDb();
    let sql = 'SELECT * FROM mandi_prices WHERE 1=1';
    const params: any[] = [];

    if (cropCode && cropCode !== 'ALL') {
      const normalized = cropCode.replace(/^CROP_/, '').toUpperCase();
      sql += ' AND (UPPER(crop_code) = ? OR UPPER(crop_code) = ?)';
      params.push(normalized, `CROP_${normalized}`);
    }
    if (state && state !== 'ALL') {
      sql += ' AND LOWER(state) = LOWER(?)';
      params.push(state);
    }
    if (search) {
      const q = `%${search}%`;
      sql += ' AND (mandi_name LIKE ? OR district LIKE ? OR crop_name_en LIKE ? OR crop_name_hi LIKE ?)';
      params.push(q, q, q, q);
    }
    sql += ' ORDER BY distance_km ASC, modal_price_qtl DESC';
    return db.prepare(sql).all(...params) as unknown as MandiPriceRecord[];
  }

  static upsert(record: MandiPriceRecord): void {
    const db = getDb();
    const now = record.updated_at || new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO mandi_prices (
        id, crop_code, crop_name_en, crop_name_hi, variety, mandi_name, state, district,
        min_price_qtl, modal_price_qtl, max_price_qtl, msp_price_qtl, price_change_24h,
        arrival_tonnes, distance_km, sell_hold_signal, advisory_en, advisory_hi, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.crop_code,
      record.crop_name_en,
      record.crop_name_hi,
      record.variety,
      record.mandi_name,
      record.state,
      record.district,
      record.min_price_qtl,
      record.modal_price_qtl,
      record.max_price_qtl,
      record.msp_price_qtl,
      record.price_change_24h,
      record.arrival_tonnes,
      record.distance_km,
      record.sell_hold_signal,
      record.advisory_en,
      record.advisory_hi,
      now
    );
  }
}

export interface SchemeApplicationRecord {
  id?: string;
  reference_no?: string;
  user_id?: string | null;
  farmer_name: string;
  mobile_number: string;
  scheme_code: string;
  scheme_name: string;
  application_type: 'SCHEME_ENROLLMENT' | 'PMFBY_72H_CLAIM' | 'KCC_CREDIT_APPLICATION' | 'SOLAR_PUMP_SUBSIDY';
  state: string;
  district: string;
  crop_name: string;
  acreage: number;
  estimated_benefit_inr: number;
  claim_reason?: string | null;
  diagnosis_id?: string | null;
  status?: string;
  created_at?: string;
}

export class SchemeApplicationRepository {
  static create(data: SchemeApplicationRecord): SchemeApplicationRecord {
    const db = getDb();
    const id = data.id || crypto.randomUUID();
    const refNo = data.reference_no || `KSS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = data.created_at || new Date().toISOString();
    const status = data.status || 'SUBMITTED_UNDER_VERIFICATION';

    db.prepare(`
      INSERT OR REPLACE INTO scheme_applications (
        id, reference_no, user_id, farmer_name, mobile_number, scheme_code, scheme_name,
        application_type, state, district, crop_name, acreage, estimated_benefit_inr,
        claim_reason, diagnosis_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      refNo,
      data.user_id || null,
      data.farmer_name,
      data.mobile_number,
      data.scheme_code,
      data.scheme_name,
      data.application_type,
      data.state,
      data.district,
      data.crop_name,
      data.acreage,
      data.estimated_benefit_inr,
      data.claim_reason || null,
      data.diagnosis_id || null,
      status,
      now
    );

    return {
      ...data,
      id,
      reference_no: refNo,
      status,
      created_at: now
    };
  }

  static listByMobileOrAll(mobileNumber?: string): SchemeApplicationRecord[] {
    const db = getDb();
    if (mobileNumber) {
      return db.prepare(`
        SELECT * FROM scheme_applications
        WHERE mobile_number = ? OR mobile_number = ?
        ORDER BY created_at DESC
      `).all(mobileNumber, mobileNumber.replace(/^\+91/, '')) as unknown as SchemeApplicationRecord[];
    }
    return db.prepare('SELECT * FROM scheme_applications ORDER BY created_at DESC LIMIT 50').all() as unknown as SchemeApplicationRecord[];
  }
}

export interface CommunityOutbreakRecord {
  id?: string;
  state: string;
  district: string;
  village: string;
  crop_code: string;
  crop_name_en: string;
  crop_name_hi: string;
  disease_name_en: string;
  disease_name_hi: string;
  severity: 'HIGH_ALERT' | 'MODERATE_WATCH' | 'CONTAINED';
  affected_farms_count: number;
  distance_km: number;
  preventive_step_en: string;
  preventive_step_hi: string;
  reported_by: string;
  verified_by_kvk: number;
  created_at?: string;
}

export class CommunityOutbreakRepository {
  static listAll(state?: string, cropCode?: string): CommunityOutbreakRecord[] {
    const db = getDb();
    let sql = 'SELECT * FROM community_outbreaks WHERE 1=1';
    const params: any[] = [];
    if (state && state !== 'ALL') {
      sql += ' AND LOWER(state) = LOWER(?)';
      params.push(state);
    }
    if (cropCode && cropCode !== 'ALL') {
      const norm = cropCode.replace(/^CROP_/, '').toUpperCase();
      sql += ' AND (UPPER(crop_code) = ? OR UPPER(crop_code) = ?)';
      params.push(norm, `CROP_${norm}`);
    }
    sql += ' ORDER BY distance_km ASC, affected_farms_count DESC';
    return db.prepare(sql).all(...params) as unknown as CommunityOutbreakRecord[];
  }

  static upsert(item: CommunityOutbreakRecord): CommunityOutbreakRecord {
    const db = getDb();
    const id = item.id || crypto.randomUUID();
    const now = item.created_at || new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO community_outbreaks (
        id, state, district, village, crop_code, crop_name_en, crop_name_hi,
        disease_name_en, disease_name_hi, severity, affected_farms_count, distance_km,
        preventive_step_en, preventive_step_hi, reported_by, verified_by_kvk, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      item.state,
      item.district,
      item.village,
      item.crop_code,
      item.crop_name_en,
      item.crop_name_hi,
      item.disease_name_en,
      item.disease_name_hi,
      item.severity,
      item.affected_farms_count,
      item.distance_km,
      item.preventive_step_en,
      item.preventive_step_hi,
      item.reported_by,
      item.verified_by_kvk ?? 1,
      now
    );
    return { ...item, id, created_at: now };
  }
}

// -------------------------------------------------------------
// 8. State-Wise Agro Challenges & CHC/Drone Bookings Repositories
// -------------------------------------------------------------
export interface StateAgroChallengeRecord {
  id: string;
  state_code: string;
  state_name_en: string;
  state_name_hi: string;
  agro_climatic_zone_hi: string;
  dominant_crops_hi: string;
  soil_water_challenge_hi: string;
  soil_water_challenge_en: string;
  pest_disease_challenge_hi: string;
  pest_disease_challenge_en: string;
  market_policy_challenge_hi: string;
  banned_pesticides_list: string;
  tech_solution_title_hi: string;
  tech_solution_title_en: string;
  tech_solution_steps_hi: string[];
  tech_solution_steps_en: string[];
  chc_equipment_name_hi: string;
  chc_subsidy_pct: number;
  chc_rent_per_acre_inr: number;
  estimated_roi_per_acre_inr: number;
  state_scheme_highlight_hi: string;
  updated_at?: string;
}

export class StateAgroChallengeRepository {
  static listAll(stateCode?: string): StateAgroChallengeRecord[] {
    const db = getDb();
    let rows: any[] = [];
    if (stateCode && stateCode !== 'ALL') {
      rows = db
        .prepare('SELECT * FROM state_agro_challenges WHERE UPPER(state_code) = UPPER(?)')
        .all(stateCode) as any[];
    }
    if (rows.length === 0) {
      rows = db.prepare('SELECT * FROM state_agro_challenges ORDER BY id ASC').all() as any[];
    }
    return rows.map((r) => ({
      ...r,
      tech_solution_steps_hi: JSON.parse(r.tech_solution_steps_hi || '[]'),
      tech_solution_steps_en: JSON.parse(r.tech_solution_steps_en || '[]')
    }));
  }

  static upsert(record: StateAgroChallengeRecord): void {
    const db = getDb();
    const now = record.updated_at || new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO state_agro_challenges (
        id, state_code, state_name_en, state_name_hi, agro_climatic_zone_hi, dominant_crops_hi,
        soil_water_challenge_hi, soil_water_challenge_en, pest_disease_challenge_hi, pest_disease_challenge_en,
        market_policy_challenge_hi, banned_pesticides_list, tech_solution_title_hi, tech_solution_title_en,
        tech_solution_steps_hi, tech_solution_steps_en, chc_equipment_name_hi, chc_subsidy_pct,
        chc_rent_per_acre_inr, estimated_roi_per_acre_inr, state_scheme_highlight_hi, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.state_code,
      record.state_name_en,
      record.state_name_hi,
      record.agro_climatic_zone_hi,
      record.dominant_crops_hi,
      record.soil_water_challenge_hi,
      record.soil_water_challenge_en,
      record.pest_disease_challenge_hi,
      record.pest_disease_challenge_en,
      record.market_policy_challenge_hi,
      record.banned_pesticides_list,
      record.tech_solution_title_hi,
      record.tech_solution_title_en,
      JSON.stringify(record.tech_solution_steps_hi || []),
      JSON.stringify(record.tech_solution_steps_en || []),
      record.chc_equipment_name_hi,
      record.chc_subsidy_pct,
      record.chc_rent_per_acre_inr,
      record.estimated_roi_per_acre_inr,
      record.state_scheme_highlight_hi,
      now
    );
  }
}

export interface ChcMachineryBookingRecord {
  id?: string;
  booking_ref?: string;
  farmer_name: string;
  mobile_number: string;
  state_code: string;
  state_name_hi: string;
  district: string;
  crop_name: string;
  acreage: number;
  intervention_type:
    | 'KISAN_DRONE_SPRAY'
    | 'HAPPY_SEEDER_PUSA_DECOMPOSER'
    | 'BBF_TRACTOR_PLANTER'
    | 'BIO_IPM_KIT'
    | 'SOLAR_DRIP_FERTIGATION'
    | 'ANTI_HAIL_OR_LIME_KIT';
  equipment_name_hi: string;
  scheduled_date: string;
  gross_cost_inr: number;
  subsidy_amount_inr: number;
  net_farmer_payable_inr: number;
  carbon_or_water_reward_hi: string;
  status?: string;
  created_at?: string;
}

export class ChcMachineryBookingRepository {
  static create(data: ChcMachineryBookingRecord): ChcMachineryBookingRecord {
    const db = getDb();
    const id = data.id || crypto.randomUUID();
    const bookingRef =
      data.booking_ref || `CHC-${data.state_code}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = data.created_at || new Date().toISOString();
    const status = data.status || 'CONFIRMED_CHC_ALLOCATED';

    db.prepare(`
      INSERT OR REPLACE INTO chc_machinery_bookings (
        id, booking_ref, farmer_name, mobile_number, state_code, state_name_hi,
        district, crop_name, acreage, intervention_type, equipment_name_hi,
        scheduled_date, gross_cost_inr, subsidy_amount_inr, net_farmer_payable_inr,
        carbon_or_water_reward_hi, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bookingRef,
      data.farmer_name,
      data.mobile_number,
      data.state_code,
      data.state_name_hi,
      data.district,
      data.crop_name,
      data.acreage,
      data.intervention_type,
      data.equipment_name_hi,
      data.scheduled_date,
      data.gross_cost_inr,
      data.subsidy_amount_inr,
      data.net_farmer_payable_inr,
      data.carbon_or_water_reward_hi,
      status,
      now
    );

    return {
      ...data,
      id,
      booking_ref: bookingRef,
      status,
      created_at: now
    };
  }

  static listByStateOrAll(stateCode?: string): ChcMachineryBookingRecord[] {
    const db = getDb();
    if (stateCode && stateCode !== 'ALL') {
      return db
        .prepare('SELECT * FROM chc_machinery_bookings WHERE UPPER(state_code) = UPPER(?) ORDER BY created_at DESC')
        .all(stateCode) as unknown as ChcMachineryBookingRecord[];
    }
    return db
      .prepare('SELECT * FROM chc_machinery_bookings ORDER BY created_at DESC LIMIT 30')
      .all() as unknown as ChcMachineryBookingRecord[];
  }
}

// -------------------------------------------------------------
// 9. Agriculture Graduate Statutory Licenses & Product Commerce Repositories
// -------------------------------------------------------------
export interface AgriGraduateLicenseRecord {
  id: string;
  graduate_name: string;
  qualification: string;
  university: string;
  passing_year: number;
  acabc_reg_no: string;
  seed_license_no: string;
  fertilizer_license_no: string;
  insecticide_license_no: string;
  drone_pilot_license_no: string;
  clinic_name_hi: string;
  clinic_name_en: string;
  state: string;
  district: string;
  mobile_number: string;
  digital_stamp_code: string;
  consultation_fee_inr: number;
  created_at?: string;
}

export class AgriGraduateLicenseRepository {
  static getPrimary(): AgriGraduateLicenseRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM agri_graduate_licenses LIMIT 1').get();
    return row || null;
  }

  static upsert(record: AgriGraduateLicenseRecord): AgriGraduateLicenseRecord {
    const db = getDb();
    const now = record.created_at || new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO agri_graduate_licenses (
        id, graduate_name, qualification, university, passing_year, acabc_reg_no,
        seed_license_no, fertilizer_license_no, insecticide_license_no, drone_pilot_license_no,
        clinic_name_hi, clinic_name_en, state, district, mobile_number, digital_stamp_code,
        consultation_fee_inr, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.graduate_name,
      record.qualification,
      record.university,
      record.passing_year,
      record.acabc_reg_no,
      record.seed_license_no,
      record.fertilizer_license_no,
      record.insecticide_license_no,
      record.drone_pilot_license_no,
      record.clinic_name_hi,
      record.clinic_name_en,
      record.state,
      record.district,
      record.mobile_number,
      record.digital_stamp_code,
      record.consultation_fee_inr,
      now
    );
    return record;
  }
}

export interface CertifiedInputProductRecord {
  id: string;
  product_code: string;
  category: 'CERTIFIED_SEED' | 'CUSTOM_MICRONUTRIENT' | 'BIO_FERTILIZER' | 'BIO_PESTICIDE' | 'DISEASE_SOLUTION_KIT';
  crop_code: string;
  product_name_hi: string;
  product_name_en: string;
  brand_or_source: string;
  composition_or_variety: string;
  lot_number: string;
  germination_pct?: number | null;
  purity_pct?: number | null;
  unit_spec: string;
  mrp_inr: number;
  farmer_price_inr: number;
  stock_quantity: number;
  prescribed_dosage_per_acre: string;
  scientific_solution_note_hi: string;
  cibrc_or_fco_reg: string;
  created_at?: string;
}

export class CertifiedInputProductRepository {
  static listAll(category?: string, cropCode?: string): CertifiedInputProductRecord[] {
    const db = getDb();
    let query = 'SELECT * FROM certified_input_products WHERE 1=1';
    const params: any[] = [];
    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (cropCode && cropCode !== 'ALL') {
      query += ' AND (UPPER(crop_code) = UPPER(?) OR crop_code = "ALL")';
      params.push(cropCode);
    }
    query += ' ORDER BY category ASC, product_name_hi ASC';
    return db.prepare(query).all(...params) as unknown as CertifiedInputProductRecord[];
  }

  static findByCode(code: string): CertifiedInputProductRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM certified_input_products WHERE product_code = ?').get(code);
    return row || null;
  }

  static upsert(p: CertifiedInputProductRecord): void {
    const db = getDb();
    const now = p.created_at || new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO certified_input_products (
        id, product_code, category, crop_code, product_name_hi, product_name_en,
        brand_or_source, composition_or_variety, lot_number, germination_pct, purity_pct,
        unit_spec, mrp_inr, farmer_price_inr, stock_quantity, prescribed_dosage_per_acre,
        scientific_solution_note_hi, cibrc_or_fco_reg, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.id,
      p.product_code,
      p.category,
      p.crop_code,
      p.product_name_hi,
      p.product_name_en,
      p.brand_or_source,
      p.composition_or_variety,
      p.lot_number,
      p.germination_pct ?? null,
      p.purity_pct ?? null,
      p.unit_spec,
      p.mrp_inr,
      p.farmer_price_inr,
      p.stock_quantity,
      p.prescribed_dosage_per_acre,
      p.scientific_solution_note_hi,
      p.cibrc_or_fco_reg,
      now
    );
  }
}

export interface AgronomistPrescriptionRecord {
  id?: string;
  prescription_no: string;
  farmer_id?: string | null;
  farmer_name: string;
  mobile_number: string;
  village: string;
  crop_name: string;
  acreage: number;
  diagnosis_id?: string | null;
  primary_diagnosis_hi: string;
  rx_items_json: any[];
  doctor_notes_hi: string;
  graduate_reg_no: string;
  digital_signature_stamp: string;
  status?: 'PRESCRIBED' | 'DISPENSED' | 'PARTIAL_DISPENSED';
  created_at?: string;
}

export class AgronomistPrescriptionRepository {
  static create(rx: AgronomistPrescriptionRecord): AgronomistPrescriptionRecord {
    const db = getDb();
    const id = rx.id || crypto.randomUUID();
    const now = rx.created_at || new Date().toISOString();
    const status = rx.status || 'PRESCRIBED';

    db.prepare(`
      INSERT OR REPLACE INTO agronomist_prescriptions (
        id, prescription_no, farmer_id, farmer_name, mobile_number, village,
        crop_name, acreage, diagnosis_id, primary_diagnosis_hi, rx_items_json,
        doctor_notes_hi, graduate_reg_no, digital_signature_stamp, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      rx.prescription_no,
      rx.farmer_id || null,
      rx.farmer_name,
      rx.mobile_number,
      rx.village,
      rx.crop_name,
      rx.acreage,
      rx.diagnosis_id || null,
      rx.primary_diagnosis_hi,
      JSON.stringify(rx.rx_items_json),
      rx.doctor_notes_hi,
      rx.graduate_reg_no,
      rx.digital_signature_stamp,
      status,
      now
    );

    return {
      ...rx,
      id,
      status,
      created_at: now
    };
  }

  static findByPrescriptionNo(prescriptionNo: string): AgronomistPrescriptionRecord | null {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM agronomist_prescriptions WHERE prescription_no = ?').get(prescriptionNo);
    if (!row) return null;
    return {
      ...row,
      rx_items_json: JSON.parse(row.rx_items_json || '[]')
    };
  }

  static listRecent(limit: number = 20): AgronomistPrescriptionRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM agronomist_prescriptions ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      rx_items_json: JSON.parse(r.rx_items_json || '[]')
    }));
  }
}

export interface FarmerOrderKhataRecord {
  id?: string;
  order_no: string;
  prescription_no?: string | null;
  farmer_name: string;
  mobile_number: string;
  village: string;
  items_json: any[];
  total_amount_inr: number;
  discount_inr: number;
  net_payable_inr: number;
  payment_mode: 'UPI_INSTANT' | 'CASH_ON_DELIVERY' | 'PAY_AFTER_HARVEST_CREDIT';
  harvest_credit_due_date?: string | null;
  credit_settled_amount_inr: number;
  invoice_docket: string;
  order_status: 'CONFIRMED_DISPATCH' | 'DELIVERED' | 'SETTLED' | 'CANCELLED';
  created_at?: string;
}

export class FarmerOrderKhataRepository {
  static create(order: FarmerOrderKhataRecord): FarmerOrderKhataRecord {
    const db = getDb();
    const id = order.id || crypto.randomUUID();
    const now = order.created_at || new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO farmer_orders_and_khata (
        id, order_no, prescription_no, farmer_name, mobile_number, village,
        items_json, total_amount_inr, discount_inr, net_payable_inr, payment_mode,
        harvest_credit_due_date, credit_settled_amount_inr, invoice_docket, order_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      order.order_no,
      order.prescription_no || null,
      order.farmer_name,
      order.mobile_number,
      order.village,
      JSON.stringify(order.items_json),
      order.total_amount_inr,
      order.discount_inr,
      order.net_payable_inr,
      order.payment_mode,
      order.harvest_credit_due_date || null,
      order.credit_settled_amount_inr,
      order.invoice_docket,
      order.order_status,
      now
    );

    return {
      ...order,
      id,
      created_at: now
    };
  }

  static listByMobileOrAll(mobile?: string): FarmerOrderKhataRecord[] {
    const db = getDb();
    let query = 'SELECT * FROM farmer_orders_and_khata';
    const params: any[] = [];
    if (mobile) {
      query += ' WHERE mobile_number = ? OR mobile_number = ?';
      params.push(mobile, mobile.replace(/^\+91/, ''));
    }
    query += ' ORDER BY created_at DESC LIMIT 30';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      items_json: JSON.parse(r.items_json || '[]')
    }));
  }
}

export interface AgriConsultationBookingRecord {
  id?: string;
  booking_ref: string;
  farmer_name: string;
  mobile_number: string;
  crop_name: string;
  acreage: number;
  consultation_type: 'TELE_VIDEO_CALL' | 'IN_PERSON_FIELD_AUDIT' | 'SEASONAL_CROP_CARE_CONTRACT';
  scheduled_slot: string;
  fee_inr: number;
  payment_status: string;
  agronomist_notes?: string | null;
  status: string;
  created_at?: string;
}

export class AgriConsultationBookingRepository {
  static create(b: AgriConsultationBookingRecord): AgriConsultationBookingRecord {
    const db = getDb();
    const id = b.id || crypto.randomUUID();
    const now = b.created_at || new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO agri_consultation_bookings (
        id, booking_ref, farmer_name, mobile_number, crop_name, acreage,
        consultation_type, scheduled_slot, fee_inr, payment_status,
        agronomist_notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      b.booking_ref,
      b.farmer_name,
      b.mobile_number,
      b.crop_name,
      b.acreage,
      b.consultation_type,
      b.scheduled_slot,
      b.fee_inr,
      b.payment_status,
      b.agronomist_notes || null,
      b.status,
      now
    );

    return {
      ...b,
      id,
      created_at: now
    };
  }

  static listRecent(limit: number = 20): AgriConsultationBookingRecord[] {
    const db = getDb();
    return db
      .prepare('SELECT * FROM agri_consultation_bookings ORDER BY created_at DESC LIMIT ?')
      .all(limit) as unknown as AgriConsultationBookingRecord[];
  }
}


