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

  // --- 6. Leaf-Based Plant Identification ML Verification ---
  console.log('\n--- 6. Leaf-Based Plant Identification Engine ---');
  // 6a. Banana (Musa acuminata) - Penni-parallel venation
  const bananaLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PENNI_PARALLEL',
    leafMargin: 'ENTIRE',
    leafArrangement: 'PADDLE_BLADE'
  });
  assert(bananaLeaf.identifiedCropCode === 'CROP_BANANA', 'Leaf Classifier: Banana identified from penni-parallel paddle-blade morphology');
  assert(bananaLeaf.confidence >= 0.95, `Leaf Classifier: Banana confidence score ${bananaLeaf.confidence} >= 0.95`);
  assert(bananaLeaf.leafValidationPassed === true, 'Leaf Classifier: Botanical leaf validation passed for Banana');

  // 6b. Banana from filename heuristic
  const bananaFromFilename = DiagnosisService.identifyCropFromLeafMorphology({}, 'banana_leaf_sigatoka_field_01.jpg');
  assert(bananaFromFilename.identifiedCropCode === 'CROP_BANANA', 'Leaf Classifier: Banana identified via filename heuristic');
  assert(bananaFromFilename.confidence >= 0.98, 'Leaf Classifier: Banana filename heuristic confidence >= 0.98');

  // 6c. Sugarcane
  const sugarcaneLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PARALLEL_LINEAR',
    leafMargin: 'SERRULATE',
    leafArrangement: 'ALTERNATE_SHEATH'
  });
  assert(sugarcaneLeaf.identifiedCropCode === 'CROP_SUGARCANE', 'Leaf Classifier: Sugarcane identified from parallel linear serrulate morphology');
  assert(sugarcaneLeaf.confidence >= 0.95, 'Leaf Classifier: Sugarcane confidence >= 0.95');

  // 6d. Maize
  const maizeLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PARALLEL_BROAD',
    leafMargin: 'WAVY_UNDULATE'
  });
  assert(maizeLeaf.identifiedCropCode === 'CROP_MAIZE', 'Leaf Classifier: Maize identified from parallel broad undulate leaf morphology');
  assert(maizeLeaf.confidence >= 0.95, 'Leaf Classifier: Maize confidence >= 0.95');

  // 6e. Potato
  const potatoLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PINNATE_OVATE',
    leafArrangement: 'INTERRUPTED_PINNATE'
  });
  assert(potatoLeaf.identifiedCropCode === 'CROP_POTATO', 'Leaf Classifier: Potato identified from interrupted pinnate ovate leaf morphology');
  assert(potatoLeaf.confidence >= 0.95, 'Leaf Classifier: Potato confidence >= 0.95');

  // 6f. Soybean
  const soybeanLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'RETICULATE_TRIFOLIATE',
    leafMargin: 'ENTIRE',
    leafArrangement: 'TRIFOLIATE'
  });
  assert(soybeanLeaf.identifiedCropCode === 'CROP_SOYBEAN', 'Leaf Classifier: Soybean identified from trifoliate reticulate leaf morphology');
  assert(soybeanLeaf.confidence >= 0.95, `Leaf Classifier: Soybean confidence score ${soybeanLeaf.confidence} >= 0.95`);
  assert(soybeanLeaf.leafValidationPassed === true, 'Leaf Classifier: Botanical leaf validation passed for Soybean');

  // 6g. Cotton
  const cottonLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PALMATE_LOBED',
    leafMargin: 'LOBED'
  });
  assert(cottonLeaf.identifiedCropCode === 'CROP_COTTON', 'Leaf Classifier: Cotton identified from palmate lobed leaf morphology');
  assert(cottonLeaf.confidence >= 0.95, `Leaf Classifier: Cotton confidence score ${cottonLeaf.confidence} >= 0.95`);

  // 6h. Paddy
  const paddyLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'PARALLEL_LINEAR',
    leafArrangement: 'PARALLEL_SHEATH'
  });
  assert(paddyLeaf.identifiedCropCode === 'CROP_PADDY', 'Leaf Classifier: Paddy/Rice identified from parallel linear sheath morphology');
  assert(paddyLeaf.confidence >= 0.95, `Leaf Classifier: Paddy confidence score ${paddyLeaf.confidence} >= 0.95`);

  // 6i. Tomato
  const tomatoLeaf = DiagnosisService.identifyCropFromLeafMorphology({
    veinArchitecture: 'COMPOUND_SERRATED',
    leafMargin: 'SERRATED'
  });
  assert(tomatoLeaf.identifiedCropCode === 'CROP_TOMATO', 'Leaf Classifier: Tomato identified from compound serrated leaf morphology');
  assert(tomatoLeaf.confidence >= 0.95, `Leaf Classifier: Tomato confidence score ${tomatoLeaf.confidence} >= 0.95`);

  // 6j. Full Diagnosis Pipeline with Banana Image & Sigatoka Diagnosis
  const bananaDiag = DiagnosisService.submitDiagnosis(authVerify.user.userId, {
    mediaFileName: 'banana_field_leaf_sigatoka_02.jpg',
    forcedConfidence: 0.94,
    qualityMetrics: { blurScore: 0.92, brightnessScore: 0.86, isAcceptableQuality: true },
    context: {
      cropSpecies: 'BANANA',
      cropVariety: 'Grand Naine (G9)',
      affectedPlantPart: 'LEAF',
      leafMorphology: 'PENNI_PARALLEL'
    }
  }) as DiagnosisRecord;
  assert(bananaDiag.status === 'COMPLETED_HIGH_CONFIDENCE', 'Banana Pipeline: High confidence diagnosis generated');
  assert(bananaDiag.primaryDiagnosis.code === 'DIS_BANANA_SIGATOKA', 'Banana Pipeline: Correctly diagnosed DIS_BANANA_SIGATOKA (Black Sigatoka)');
  assert(bananaDiag.botanicalValidation?.cropIdentified === 'BANANA', 'Banana Pipeline: Botanical validation verified Banana');
  assert(bananaDiag.botanicalValidation?.speciesName === 'Musa acuminata', 'Banana Pipeline: Botanical species identified as Musa acuminata');
  assert(bananaDiag.recommendation !== undefined, 'Banana Pipeline: 3-step recommendation attached');
  assert(bananaDiag.recommendation.step3ChemicalIntervention.isPermitted === true, 'Banana Pipeline: CIB&RC Chemical fungicide permitted for Sigatoka');
  assert(bananaDiag.recommendation.step3ChemicalIntervention.approvedMolecules.some((m: any) => m.moleculeName.includes('Azoxystrobin') || m.moleculeName.includes('Propiconazole')), 'Banana Pipeline: Azoxystrobin/Propiconazole in CIB&RC list');
  assert(bananaDiag.aiHealthReport !== undefined, 'Banana Pipeline: AI Health Report attached to diagnosis');
  assert(bananaDiag.aiHealthReport?.plantPart.identifiedPart === 'LEAF', 'Banana Pipeline: Organ identified as LEAF');

  // Test full diagnosis pipeline with isolated leaf scan flag
  const leafDiag = DiagnosisService.submitDiagnosis(authVerify.user.userId, {
    isLeafOnlyScan: true,
    qualityMetrics: { blurScore: 0.90, brightnessScore: 0.85, isAcceptableQuality: true },
    context: { affectedPlantPart: 'LEAF', cropSpecies: 'COTTON' }
  }) as DiagnosisRecord;
  assert(leafDiag.status === 'COMPLETED_HIGH_CONFIDENCE', 'Leaf Pipeline: Isolated leaf scan produces COMPLETED_HIGH_CONFIDENCE');
  assert(leafDiag.confidenceScore >= 0.95, `Leaf Pipeline: High-confidence score ${leafDiag.confidenceScore} >= 0.95`);
  assert(leafDiag.context.leafBotanicalIdentification !== undefined, 'Leaf Pipeline: Botanical marker metadata attached');

  // --- 6. Plant Part Morphology, Video Analysis & Location-Aware Deficiency Engine ---
  console.log('\n--- 6. Botanical Parts, Video Analysis & Hyperlocal Deficiency Engine ---');

  // 6a. Plant Part Organ Identification
  const leafPart = DiagnosisService.identifyPlantOrganAndCrop({ plantPart: 'LEAF', veinArchitecture: 'PENNI_PARALLEL', fileNameOrMediaHint: 'banana_leaf.jpg' });
  assert(leafPart.plantOrgan.identifiedPart === 'LEAF', 'Part Classifier: Correctly identified LEAF organ');
  assert(leafPart.cropSpecies.cropCode === 'CROP_BANANA', 'Crop Classifier: Correctly identified Banana (Musa acuminata)');

  const stemPart = DiagnosisService.identifyPlantOrganAndCrop({ plantPart: 'STEM', stemStructure: 'Segmented culm', fileNameOrMediaHint: 'sugarcane_stalk.jpg' });
  assert(stemPart.plantOrgan.identifiedPart === 'STEM', 'Part Classifier: Correctly identified STEM organ');
  assert(stemPart.cropSpecies.cropCode === 'CROP_SUGARCANE', 'Crop Classifier: Correctly identified Sugarcane from stalk hint');

  const fruitPart = DiagnosisService.identifyPlantOrganAndCrop({ plantPart: 'FRUIT', fruitType: 'Ear with silks', fileNameOrMediaHint: 'corn_cob.jpg' });
  assert(fruitPart.plantOrgan.identifiedPart === 'FRUIT', 'Part Classifier: Correctly identified FRUIT/EAR organ');
  assert(fruitPart.cropSpecies.cropCode === 'CROP_MAIZE', 'Crop Classifier: Correctly identified Maize/Corn from cob hint');

  // 6b. Multi-Frame Video Stream & Temporal Stability Analysis
  const videoResult = DiagnosisService.analyzeVideoMedia({
    fileName: 'banana_field_inspection_video.mp4',
    durationSeconds: 8.0,
    morphologicalHint: {
      plantPart: 'LEAF',
      veinArchitecture: 'PENNI_PARALLEL'
    }
  });
  assert(videoResult.totalFramesAnalyzed === 5, 'Video Engine: Sampled 5 keyframes across clip');
  assert(videoResult.usableFramesCount >= 4, 'Video Engine: Filtered motion blur and selected usable high-clarity frames');
  assert(videoResult.temporalStabilityScore >= 80, `Video Engine: High temporal stability score (${videoResult.temporalStabilityScore} >= 80)`);
  assert(videoResult.selectedBestFrame.qualityScore > 0.8, 'Video Engine: Selected optimal highest-sharpness keyframe');
  assert(videoResult.videoDiagnosticSummary.dominantCrop === 'Banana', 'Video Engine: Consensus crop species determined as Banana');

  // 6c. AI Health Report Generation & Deficiency Diagnosis
  const healthRep = leafPart.healthReport;
  assert(healthRep.healthIndexScore > 0 && healthRep.healthIndexScore <= 100, `Health Report: Health index score computed (${healthRep.healthIndexScore}/100)`);
  assert(healthRep.visualBiomarkers.chlorosisSeverityPct > 0, 'Health Report: Visual chlorosis biomarker quantified');
  assert(healthRep.summaryEn.length > 20 && healthRep.summaryHi.length > 20, 'Health Report: Bilingual summary (En/Hi) generated');

  // 6d. Hyperlocal Location & Soil-Aware Deficiency Solver with Exact Metric Dosages
  const zincSol = DiagnosisService.solveNutrientDeficiency('CROP_BANANA', 'DEF_ZN', {
    state: 'Madhya Pradesh',
    district: 'Ujjain',
    soilType: 'Black Cotton Soil (काली मिट्टी)',
    landAreaAcres: 2.0
  });
  assert(zincSol.deficiencyCode === 'DEF_ZN', 'Deficiency Solver: Zinc deficiency identified');
  assert(zincSol.locationDetails.soilType.includes('Black Cotton'), 'Deficiency Solver: Location soil type registered as Black Cotton');
  assert(zincSol.soilChemistryRationale.en.includes('bypasses soil lockup') || zincSol.soilChemistryRationale.en.includes('fixed'), 'Deficiency Solver: Soil chemistry explains Zn fixation in high pH Black Cotton soil');
  assert(zincSol.step1MineralCorrection.dosage.dilutionGramsOrMlPerLiter === 1.5, 'Deficiency Solver: Chelated Zn-EDTA dilution is 1.5 g/L');
  assert(zincSol.step1MineralCorrection.dosage.waterVolumePerAcreLitres === 200, 'Deficiency Solver: Water volume is 200 L/acre');
  assert(zincSol.step1MineralCorrection.dosage.totalCalculatedWaterLitres === 400, 'Deficiency Solver: Scaled water volume is 400 L for 2.0 acres');
  assert(zincSol.step2BiologicalAndSoilRemediation.bioProduct.includes('Zinc') || zincSol.step2BiologicalAndSoilRemediation.bioProduct.includes('ZSB'), 'Deficiency Solver: Step 2 includes Zinc Solubilizing Biofertilizer (ZSB)');

  // --- 7. Master Admin Password Authentication & RBAC Claims ---
  console.log('\n--- 7. Master Admin Password Authentication & RBAC ---');
  // 7a. Successful Admin Login
  const adminLoginSuccess = AuthService.adminPasswordLogin('Admin', 'Vikas');
  assert(adminLoginSuccess.success === true, 'Admin Auth: Login successful with username Admin and password Vikas');
  assert(adminLoginSuccess.role === 'ADMIN', 'Admin Auth: Authenticated role is ADMIN');
  assert(adminLoginSuccess.admin.fullName.includes('Vikas Chaturvedi'), 'Admin Auth: Admin profile loaded with full name');
  const decodedMasterAdmin = AuthService.verifyToken(adminLoginSuccess.accessToken);
  assert(decodedMasterAdmin.role === 'ADMIN', 'Admin Auth: Issued JWT token bears explicit ADMIN role');

  // 7b. Invalid Password Rejection
  let invalidPasswordFailed = false;
  try {
    AuthService.adminPasswordLogin('Admin', 'WrongPassword!99');
  } catch (err: any) {
    invalidPasswordFailed = true;
    assert(err.message.includes('INVALID_CREDENTIALS'), 'Admin Auth: Throws error on wrong password');
  }
  assert(invalidPasswordFailed, 'Admin Auth: Blocked login attempt with invalid password');

  // 7c. Nonexistent User Rejection
  let unknownUserFailed = false;
  try {
    AuthService.adminPasswordLogin('NonExistentUser', 'Vikas');
  } catch (err: any) {
    unknownUserFailed = true;
  }
  assert(unknownUserFailed, 'Admin Auth: Blocked login for unregistered admin username');

  // --- 8. Live PIN Code Lookup & Geocoding Engine ---
  console.log('\n--- 8. Live Postal PIN Code Lookup & Geocoding ---');
  const pinUjjain = await AuthService.lookupPincode('456006');
  assert(pinUjjain.success === true, 'PIN Lookup: Successfully resolved PIN 456006');
  assert(pinUjjain.state === 'Madhya Pradesh', `PIN Lookup: State is Madhya Pradesh (got ${pinUjjain.state})`);
  assert(pinUjjain.district === 'Ujjain', `PIN Lookup: District is Ujjain (got ${pinUjjain.district})`);
  assert(pinUjjain.postOffices.length > 0, 'PIN Lookup: Returns associated post offices');

  const pinDelhi = await AuthService.lookupPincode('110001');
  assert(pinDelhi.success === true, 'PIN Lookup: Successfully resolved PIN 110001 (New Delhi)');
  assert(pinDelhi.district.includes('Delhi') || pinDelhi.state.includes('Delhi'), 'PIN Lookup: State/District contains Delhi');

  // --- 9. First-Time Farmer Onboarding with Name & PIN Code ---
  console.log('\n--- 9. First-Time Farmer Onboarding Lifecycle ---');
  const newFarmerOtp = AuthService.requestOtp('9833445566', 'SMS', 'hi');
  const newFarmerVerify: any = AuthService.verifyOtpAndRecordConsent(
    newFarmerOtp.sessionId,
    newFarmerOtp.debugOtp!,
    '9833445566',
    ['AGRONOMIC_DIAGNOSIS_AND_ADVISORY', 'HYPERLOCAL_WEATHER_INTEGRATION'],
    'hi'
  );
  assert(newFarmerVerify.isNewUser === true, 'Onboarding: First-time user identified as new user');
  assert(newFarmerVerify.requiresOnboarding === true, 'Onboarding: Requires onboarding flag is active');

  const onboardingResult = AuthService.completeFarmerOnboarding(newFarmerVerify.user.userId, {
    fullName: 'Mohan Lal Sharma (मोहन लाल शर्मा)',
    pinCode: '456006',
    state: pinUjjain.state,
    district: pinUjjain.district,
    taluka: pinUjjain.taluka,
    village: pinUjjain.village,
    preferredLanguage: 'hi',
    farmAreaAcre: 5.5,
    soilType: 'BLACK_COTTON'
  });
  assert(onboardingResult.success === true, 'Onboarding: Completed successfully');
  assert(onboardingResult.user.isProfileComplete === true, 'Onboarding: Profile marked complete');
  assert(onboardingResult.user.name === 'Mohan Lal Sharma (मोहन लाल शर्मा)', 'Onboarding: Full name updated');
  assert(onboardingResult.user.pinCode === '456006', 'Onboarding: PIN code saved');

  // --- 10. PWA & Offline Readiness ---
  console.log('\n--- 10. PWA & Offline Readiness ---');
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
  console.log('🎉 ALL BOTANICAL, ML LEAF, BANANA SIGATOKA, CIB&RC, DB, AUTH & ONBOARDING TESTS PASSED!');
  console.log('======================================================\n');
}

runAllVerificationTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
