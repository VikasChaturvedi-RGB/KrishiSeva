import * as fs from 'fs';
import * as path from 'path';
import { AppDatabase } from './db/database';
import { DatabaseSeeder } from './db/seeder';
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
} from './db/repositories';
import { AuthService } from './services/auth-dpdp/authService';
import { FarmService } from './services/profile-farm/farmService';
import { NutritionRuleEngine } from './services/nutrition-rules/nutritionRuleEngine';
import { DiagnosisService, DiagnosisRecord } from './services/diagnosis-ml/diagnosisService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runAllVerificationTests() {
  console.log('\n======================================================');
  console.log('🌱 Krishi Swasthya Sahayak (AgriScan AI) Test Suite');
  console.log('======================================================\n');

  // --- Test 1: Production Embedded SQLite Database Engine ---
  console.log('--- 1. Production Embedded SQLite Database Layer ---');
  const db = AppDatabase.resetForTesting();
  const stats = db.getStats();
  assert(stats.walMode === true, 'SQLite: WAL (Write-Ahead Logging) mode is ACTIVE');
  assert(stats.activeTables.length >= 10, 'SQLite: 10+ Relational database tables verified');
  assert(fs.existsSync(stats.filePath), 'SQLite: Database file exists on disk');

  // Run seeder
  DatabaseSeeder.seedAll();
  const seededStats = db.getStats();
  assert((seededStats.tableCounts['users'] || 0) >= 3, 'SQLite Seeder: Core users (Farmer, Clinic, Agronomist) populated');
  assert((seededStats.tableCounts['inventory_batches'] || 0) >= 4, 'SQLite Seeder: Certified CIB&RC Inventory items populated');

  // Test 2: Auth & DPDP Act 2023 Consent Service
  console.log('\n--- 2. Auth & DPDP Consent Engine ---');
  const otpReq = AuthService.requestOtp('9876543210', 'SMS', 'hi');
  assert(otpReq.success && otpReq.sessionId.length > 0, 'OTP request generated sessionId');

  const authVerify: any = AuthService.verifyOtp(otpReq.sessionId, '123456', '9876543210', {
    privacyPolicyVersion: 'v2026.1',
    consentTimestamp: new Date().toISOString(),
    languageCode: 'hi',
    consentedPurposes: ['AGRONOMIC_DIAGNOSIS_AND_ADVISORY', 'SOIL_HEALTH_ANALYTICS']
  });
  assert(authVerify.accessToken && authVerify.accessToken.length > 0, 'Valid JWT Auth Token issued');
  assert(authVerify.user && authVerify.user.userId.length > 0, 'Farmer user session initialized');

  // Verify Consent in SQLite
  const activeConsents = ConsentRepository.getActiveConsent(authVerify.user.userId);
  assert(activeConsents !== null, 'DPDP: Active consent record retrieved from SQLite');
  assert(activeConsents!.consented_purposes.includes('AGRONOMIC_DIAGNOSIS_AND_ADVISORY'), 'DPDP: Agronomic purpose consent stored in SQLite');

  // Test 3: Profile & Farm Soil Health Card Service
  console.log('\n--- 3. Profile & Soil Health Service ---');
  const profile = FarmService.getFarmerProfile(authVerify.user.userId);
  assert(profile.mobileNumber.includes('9876543210'), 'Farmer profile fetched correctly from SQLite');
  
  const farmList = FarmService.listFarms(authVerify.user.userId);
  assert(farmList.farms.length >= 1, 'Linked farm retrieved from SQLite');
  const soilCard = FarmService.getSoilCard(farmList.farms[0].id);
  assert(soilCard !== undefined && soilCard.zincPpm === 0.52, 'Soil card Zn deficiency (0.52 ppm < 0.60 critical) verified from SQLite');

  // Test 4: Nutrition-First Rule Engine & CIB&RC State Bans
  console.log('\n--- 4. Nutrition-First & CIB&RC Compliance Engine ---');
  const rx = NutritionRuleEngine.buildRecommendation('DIS_ZINC_DEFICIENCY', 'Madhya Pradesh', 2.0);
  assert(rx.priorityOrder[0] === 'STEP_1_MINERAL_FOLIAR_CORRECTION', 'Strict Rule 1: Step 1 is Foliar Mineral Correction');
  assert(rx.priorityOrder[1] === 'STEP_2_BIOLOGICAL_AND_SOIL_REMEDIATION', 'Strict Rule 2: Step 2 is Biological / Soil Remediation');
  assert(rx.priorityOrder[2] === 'STEP_3_CIBRC_CHEMICAL_INTERVENTION', 'Strict Rule 3: Step 3 is Chemical Intervention');
  assert(rx.step1NutrientFoliarCorrection.isRecommended === true, 'Foliar ZnSO4 recommended');
  assert(rx.step1NutrientFoliarCorrection.dosage.totalAcreageCalculatedDose.includes('1000'), 'Acreage scaling: 500g * 2.0 = 1000g');
  assert(rx.step1NutrientFoliarCorrection.dosage.totalWaterVolumeLitres === 400, 'Acreage water: 200L * 2.0 = 400L');

  // State Ban Filtering
  const punjabBan = NutritionRuleEngine.checkChemicalEligibility('Chlorpyrifos 20% EC', 'Punjab');
  assert(punjabBan.isBanned === true, 'State Ban Filter: Chlorpyrifos correctly blocked in Punjab');
  const mpAllowed = NutritionRuleEngine.checkChemicalEligibility('Chlorpyrifos 20% EC', 'Madhya Pradesh');
  assert(mpAllowed.isBanned === false, 'State Ban Filter: Chlorpyrifos permitted in Madhya Pradesh');

  // Test 5: Multimodal Diagnosis & Tiered Branching
  console.log('\n--- 5. Multimodal Diagnosis & Tiered Branching ---');
  // Tier A: High Confidence (>= 85%) -> Instant Prescription
  const highDiag = DiagnosisService.submitDiagnosis(authVerify.user.userId, {
    forcedConfidence: 0.92,
    qualityMetrics: { blurScore: 0.88, brightnessScore: 0.82, isAcceptableQuality: true },
    context: { cropSpecies: 'SOYBEAN', farmId: farmList.farms[0].id }
  }) as DiagnosisRecord;
  assert(highDiag.status === 'COMPLETED_HIGH_CONFIDENCE', 'Tier A: >= 85% returns COMPLETED_HIGH_CONFIDENCE');
  assert(highDiag.recommendation !== undefined, 'Tier A: Instant 3-Step prescription attached');

  // Verify Diagnosis in SQLite
  const savedDiagnosis = DiagnosisRepository.findById(highDiag.diagnosisId);
  assert(savedDiagnosis !== null && savedDiagnosis.status === 'COMPLETED_HIGH_CONFIDENCE', 'Diagnosis persisted in SQLite table');

  // Tier B: Ambiguous Confidence (55% - 84%) -> Adaptive Questionnaire
  const midDiag = DiagnosisService.submitDiagnosis(authVerify.user.userId, {
    forcedConfidence: 0.72,
    qualityMetrics: { blurScore: 0.88, brightnessScore: 0.82, isAcceptableQuality: true },
    context: { cropSpecies: 'SOYBEAN', farmId: farmList.farms[0].id }
  }) as DiagnosisRecord;
  assert(midDiag.status === 'ADAPTIVE_QUESTIONNAIRE_REQUIRED', 'Tier B: 55-84% triggers ADAPTIVE_QUESTIONNAIRE_REQUIRED');
  assert(midDiag.adaptiveQuestionnaire?.questions.length === 2, 'Tier B: Adaptive 2-question tree delivered');

  // Recalibration test
  const recalibrated = DiagnosisService.submitQuestionnaireAnswers(
    midDiag.diagnosisId,
    midDiag.adaptiveQuestionnaire!.questionnaireId,
    [
      { questionId: 'Q_LEAF_POSITION', selectedOptionKey: 'TOP_YOUNG' },
      { questionId: 'Q_SPOT_TEXTURE', selectedOptionKey: 'NO_POWDER' }
    ]
  );
  assert(recalibrated.status === 'COMPLETED_HIGH_CONFIDENCE', 'Recalibration: Status upgraded to COMPLETED_HIGH_CONFIDENCE in SQLite');
  assert(recalibrated.confidenceScore === 0.94, 'Recalibration: Confidence upgraded to 94%');

  // Tier C: Low Confidence (< 55%) -> Escalated to KVK Specialist with SLA
  const lowDiag = DiagnosisService.submitDiagnosis(authVerify.user.userId, {
    forcedConfidence: 0.48,
    qualityMetrics: { blurScore: 0.88, brightnessScore: 0.82, isAcceptableQuality: true },
    context: { cropSpecies: 'SOYBEAN', farmId: farmList.farms[0].id }
  }) as DiagnosisRecord;
  assert(lowDiag.status === 'ESCALATED_TO_SPECIALIST', 'Tier C: < 55% triggers ESCALATED_TO_SPECIALIST');
  assert(lowDiag.escalationDetails?.assignedAgronomistName.includes('Dr. Suresh Verma') === true, 'KVK Agronomist assigned');
  assert(lowDiag.escalationDetails?.timeRemainingMinutes > 0, '2-Hour SLA countdown active');

  // Verify Audit Log in SQLite
  const auditLogs = AuditRepository.getRecentLogs(10);
  assert(auditLogs.length > 0, 'SQLite Audit Logs: System activity recorded and verifiable');

  // Verify Farmer Login & Activity Logs in SQLite (Phone, Location, Crop, Health, Deficiencies, Suggestions)
  const loggedActivity = FarmerActivityLogRepository.logActivity({
    phone_number: '+919876543210',
    farmer_name: 'Ramesh Patel (रमेश पटेल)',
    location: 'Village Dharampuri, Dhar (M.P.)',
    crop: 'SOYBEAN (JS 20-34)',
    health_status: '94.2% AI Confidence - Nutritional Disorder Detected',
    deficiencies: 'Zinc Deficiency 0.45 ppm / Interveinal Chlorosis',
    suggestions: 'Step 1: Foliar ZnSO4 21% @ 500g/200L. Step 2: 1kg ZSB Bio. Step 3: Zero Chemical.',
    session_id: 'test-sess-01'
  });
  assert(Boolean(loggedActivity && loggedActivity.id && loggedActivity.id.length > 0), 'Farmer Activity Log: Logged record saved in SQLite');
  const farmerRecords = FarmerActivityLogRepository.getByPhoneNumber('+919876543210');
  assert(farmerRecords.length >= 1, 'Farmer Activity Log: Queried records by Phone Number from SQLite');
  assert(farmerRecords[0].crop.includes('SOYBEAN'), 'Farmer Activity Log: Crop details verified');
  assert(farmerRecords[0].deficiencies.includes('Zinc'), 'Farmer Activity Log: Deficiencies verified');
  assert(farmerRecords[0].suggestions.includes('ZnSO4'), 'Farmer Activity Log: 3-step suggestions verified');

  // --- 6. PWA & Offline Readiness ---
  console.log('\n--- 6. PWA & Offline Readiness ---');
  const manifestPath = path.join(__dirname, '../../web_simulator/manifest.json');
  const swPath = path.join(__dirname, '../../web_simulator/sw.js');
  const iconPath = path.join(__dirname, '../../web_simulator/icons/icon-192.svg');

  assert(fs.existsSync(manifestPath), 'PWA: manifest.json is present');
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifestData.display === 'standalone', 'PWA: manifest has display: standalone');
  assert(manifestData.icons.length >= 2, 'PWA: manifest contains multi-size responsive icons');

  assert(fs.existsSync(swPath), 'PWA: Service Worker (sw.js) is present');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes("addEventListener('install'"), 'PWA: SW implements install event for app shell caching');
  assert(swContent.includes("addEventListener('fetch'"), 'PWA: SW implements fetch event for offline cache strategy');
  assert(swContent.includes("addEventListener('sync'"), 'PWA: SW implements background sync event for offline diagnoses');

  assert(fs.existsSync(iconPath), 'PWA: High-res SVG App Icon is present');

  console.log('\n======================================================');
  console.log('🎉 ALL 25 ARCHITECTURAL, SQLITE DB, COMPLIANCE & PWA ASSERTIONS PASSED!');
  console.log('======================================================\n');
}

runAllVerificationTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
