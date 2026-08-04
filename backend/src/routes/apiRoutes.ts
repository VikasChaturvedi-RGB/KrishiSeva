import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth-dpdp/authService';
import { FarmService } from '../services/profile-farm/farmService';
import { DiagnosisService } from '../services/diagnosis-ml/diagnosisService';
import { EscalationService } from '../services/escalation-sla/escalationService';
import { PdfPrescriptionService } from '../services/pdf-prescription/pdfService';
import { AppDatabase } from '../db/database';
import { DatabaseSeeder } from '../db/seeder';
import { InventoryRepository, AuditRepository, FarmerActivityLogRepository } from '../db/repositories';
import fs from 'fs';
import path from 'path';

export const router = Router();

// Helper middleware for auth extraction
function extractUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      return AuthService.verifyToken(authHeader.split(' ')[1]);
    } catch {
      return null;
    }
  }
  // Default demo fallback user
  return { userId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', mobileNumber: '9876543210', role: 'FARMER' };
}

// -------------------------------------------------------------
// 1. AUTH & DPDP CONSENT SERVICE
// -------------------------------------------------------------
router.post('/auth/otp/request', (req: Request, res: Response) => {
  const { mobileNumber, channel, preferredLanguage } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ errorCode: 'INVALID_MOBILE', message: 'Mobile number is required' });
  }
  const result = AuthService.requestOtp(String(mobileNumber), channel, preferredLanguage);
  return res.json(result);
});

router.post('/auth/otp/verify', (req: Request, res: Response) => {
  const { sessionId, otp, mobileNumber, dpdpConsent } = req.body;
  try {
    const result = AuthService.verifyOtp(String(sessionId), String(otp), String(mobileNumber), dpdpConsent);
    if ('requiresConsent' in result && result.requiresConsent) {
      return res.status(403).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ errorCode: 'AUTH_FAILED', message: err.message });
  }
});

router.post('/auth/consent/record', (req: Request, res: Response) => {
  const user = extractUser(req);
  if (!user) return res.status(401).json({ errorCode: 'UNAUTHORIZED' });
  const { consentItems } = req.body;
  const result = AuthService.recordConsent(user.userId, consentItems);
  return res.json(result);
});

router.get('/auth/consent/status', (req: Request, res: Response) => {
  const user = extractUser(req);
  if (!user) return res.status(401).json({ errorCode: 'UNAUTHORIZED' });
  return res.json({
    activeConsents: [
      { purpose: 'AGRONOMIC_DIAGNOSIS_AND_ADVISORY', isGranted: true },
      { purpose: 'HYPERLOCAL_WEATHER_INTEGRATION', isGranted: true },
      { purpose: 'SOIL_HEALTH_ANALYTICS', isGranted: true },
      { purpose: 'AGRI_CLINIC_EXPERT_ESCALATION', isGranted: true }
    ],
    noticeTextLocalized: 'कृषि सेवा आपकी फसल की बीमारी का सटीक निदान करने के लिए मौसम और स्थान का उपयोग करती है।'
  });
});

// -------------------------------------------------------------
// 2. PROFILE & FARM SERVICE
// -------------------------------------------------------------
router.get('/profile-farm/farmer/profile', (req: Request, res: Response) => {
  const user = extractUser(req);
  try {
    const profile = FarmService.getFarmerProfile(user?.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
    return res.json(profile);
  } catch (err: any) {
    return res.status(404).json({ errorCode: 'NOT_FOUND', message: err.message });
  }
});

router.put('/profile-farm/farmer/profile', (req: Request, res: Response) => {
  const user = extractUser(req);
  const updated = FarmService.updateFarmerProfile(user?.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', req.body);
  return res.json(updated);
});

router.get('/profile-farm/farms', (req: Request, res: Response) => {
  const user = extractUser(req);
  const result = FarmService.listFarms(user?.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
  return res.json(result);
});

router.post('/profile-farm/farms', (req: Request, res: Response) => {
  const user = extractUser(req);
  const farm = FarmService.createFarm(user?.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', req.body);
  return res.status(201).json(farm);
});

router.get('/profile-farm/farms/:farmId/soil-card', (req: Request, res: Response) => {
  const farmId = String(req.params.farmId);
  const card = FarmService.getSoilCard(farmId);
  return res.json(card);
});

router.post('/profile-farm/farms/:farmId/soil-card', (req: Request, res: Response) => {
  const farmId = String(req.params.farmId);
  const card = FarmService.upsertSoilCard(farmId, req.body);
  return res.json(card);
});

router.get('/profile-farm/farms/:farmId/crop-cycles', (req: Request, res: Response) => {
  const farmId = String(req.params.farmId);
  const cycles = FarmService.listCropCycles(farmId);
  return res.json(cycles);
});

router.post('/profile-farm/farms/:farmId/crop-cycles', (req: Request, res: Response) => {
  const farmId = String(req.params.farmId);
  const cycle = FarmService.createCropCycle(farmId, req.body);
  return res.status(201).json(cycle);
});

router.get('/profile-farm/clinic/farmers', (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;
  const result = FarmService.listClinicFarmers(search);
  return res.json(result);
});

// -------------------------------------------------------------
// 3. DIAGNOSIS, ESCALATION & RECOMMENDATION SERVICE
// -------------------------------------------------------------
router.post('/diagnosis/media/upload-url', (req: Request, res: Response) => {
  const { fileName, fileType, fileSizeByte } = req.body;
  const result = DiagnosisService.getMediaUploadUrl(
    fileName ? String(fileName) : 'capture.jpg',
    fileType ? String(fileType) : 'image/jpeg',
    fileSizeByte ? Number(fileSizeByte) : 1024
  );
  return res.json(result);
});

router.post('/diagnosis/diagnose/submit', (req: Request, res: Response) => {
  const user = extractUser(req);
  const lang = (req.headers['accept-language'] as string) || 'hi';
  const result = DiagnosisService.submitDiagnosis(user?.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', req.body, lang);
  return res.json(result);
});

router.get('/diagnosis/diagnose/:diagnosisId', (req: Request, res: Response) => {
  const diagnosisId = String(req.params.diagnosisId);
  try {
    const result = DiagnosisService.getDiagnosisById(diagnosisId);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ errorCode: 'NOT_FOUND', message: err.message });
  }
});

router.post('/diagnosis/diagnose/:diagnosisId/questionnaire/submit', (req: Request, res: Response) => {
  const diagnosisId = String(req.params.diagnosisId);
  const lang = (req.headers['accept-language'] as string) || 'hi';
  const { questionnaireId, answers } = req.body;
  const result = DiagnosisService.submitQuestionnaireAnswers(diagnosisId, String(questionnaireId), answers, lang);
  return res.json(result);
});

router.get('/diagnosis/escalation/queue', (req: Request, res: Response) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const stateFilter = req.query.state ? String(req.query.state) : undefined;
  const result = EscalationService.getQueue(status, stateFilter);
  return res.json(result);
});

router.post('/diagnosis/escalation/:escalationId/resolve', (req: Request, res: Response) => {
  const escalationId = String(req.params.escalationId);
  try {
    const result = EscalationService.resolveEscalation(escalationId, req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ errorCode: 'NOT_FOUND', message: err.message });
  }
});

router.get('/diagnosis/diagnose/:diagnosisId/prescription/pdf', async (req: Request, res: Response) => {
  const diagnosisId = String(req.params.diagnosisId);
  const lang = (req.headers['accept-language'] as string) || 'hi';
  try {
    const pdfBuffer = await PdfPrescriptionService.generatePrescriptionPdf(diagnosisId, lang);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Prescription_${diagnosisId}.pdf`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    return res.status(500).json({ errorCode: 'PDF_GEN_ERROR', message: err.message });
  }
});

// -------------------------------------------------------------
// 4. AGRI-CLINIC INVENTORY MANAGEMENT
// -------------------------------------------------------------
router.get('/clinic/inventory', (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const items = InventoryRepository.listAll(category);
  return res.json({
    items,
    count: items.length,
    totalStockUnits: items.reduce((acc, curr) => acc + curr.stock_units, 0)
  });
});

router.post('/clinic/inventory', (req: Request, res: Response) => {
  const item = InventoryRepository.seedBatch(req.body);
  return res.status(201).json(item);
});

// -------------------------------------------------------------
// 5. PRODUCTION DATABASE STATS, EXPLORER & GOVERNANCE CMS
// -------------------------------------------------------------
router.get('/admin/db/stats', (req: Request, res: Response) => {
  const stats = AppDatabase.getInstance().getStats();
  return res.json(stats);
});

router.post('/admin/db/query', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL query string required' });
  }

  // Safety filter: prevent destructive queries from public explorer
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('DROP') || trimmed.startsWith('TRUNCATE')) {
    return res.status(403).json({ error: 'Destructive DDL statements are restricted.' });
  }

  try {
    const db = AppDatabase.getInstance().getDb();
    const results = db.prepare(sql).all();
    return res.json({
      success: true,
      rowCount: results.length,
      rows: results
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admin/db/reset-seed', (req: Request, res: Response) => {
  try {
    DatabaseSeeder.seedAll();
    const stats = AppDatabase.getInstance().getStats();
    return res.json({ success: true, message: 'Database seeded successfully', stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/admin/audit-logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const logs = AuditRepository.getRecentLogs(limit);
  return res.json({ logs, count: logs.length });
});

router.get('/admin/rules', (req: Request, res: Response) => {
  const rulesPath = path.join(__dirname, '../data/crop-disease-rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  return res.json(rules);
});

router.post('/admin/rules/state-machine', (req: Request, res: Response) => {
  const { status, reviewedBy } = req.body;
  const rulesPath = path.join(__dirname, '../data/crop-disease-rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  rules.governance = {
    status: status || 'PUBLISHED',
    reviewedBy: reviewedBy || 'Chief Agronomist & CIBRC Lead',
    approvalDate: new Date().toISOString().split('T')[0]
  };
  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf8');
  AuditRepository.log('RULES_STATE_CHANGED', null, 'RULE_GOVERNANCE', 'crop-disease-rules.json', rules.governance);
  return res.json({ success: true, governance: rules.governance });
});

// -------------------------------------------------------------
// 6. FARMER LOGIN & DIAGNOSTIC ACTIVITY LOGGING SERVICE
// -------------------------------------------------------------
router.post('/auth/farmer/login-activity', (req: Request, res: Response) => {
  const {
    phoneNumber,
    mobileNumber,
    farmerName,
    location,
    crop,
    healthStatus,
    health,
    deficiencies,
    suggestions,
    sessionId,
    userId
  } = req.body;

  const phone = String(phoneNumber || mobileNumber || '9876543210');
  const name = String(farmerName || 'Rameshwar Patidar');
  const loc = String(location || 'Village Dharampuri, Dhar (M.P.) [22.7196, 75.8577]');
  const cropVal = String(crop || 'SOYBEAN (JS 20-34)');
  const healthVal = String(healthStatus || health || '94.2% Confidence - Nutritional Disorder Detected');
  const defVal = String(deficiencies || 'Zinc Deficiency (0.45 ppm) / Interveinal Chlorosis');
  const suggVal = String(suggestions || 'Step 1: Foliar ZnSO4 21% @ 500g + 250g Lime. Step 2: Soil ZSB @ 1kg/acre. Step 3: Zero Chemical Pesticide.');

  const logEntry = FarmerActivityLogRepository.logActivity({
    user_id: userId || null,
    phone_number: phone,
    farmer_name: name,
    location: loc,
    crop: cropVal,
    health_status: healthVal,
    deficiencies: defVal,
    suggestions: suggVal,
    session_id: sessionId || null,
    ip_address: req.ip || '127.0.0.1',
    user_agent: req.headers['user-agent'] || 'AgriScan-Mobile/1.0'
  });

  AuditRepository.log('FARMER_LOGIN_ACTIVITY_LOGGED', userId || null, 'FARMER_ACTIVITY_LOG', logEntry.id || 'new', {
    phone,
    crop: cropVal,
    healthStatus: healthVal
  });

  return res.status(201).json({
    success: true,
    message: 'Farmer login activity, crop, location, health, deficiencies, and suggestions logged successfully in SQLite database.',
    log: logEntry
  });
});

router.get('/admin/farmer-logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const logs = FarmerActivityLogRepository.listRecent(limit);
  return res.json({
    success: true,
    count: logs.length,
    logs
  });
});

router.get('/admin/farmer-logs/:phoneNumber', (req: Request, res: Response) => {
  const phone = String(req.params.phoneNumber);
  const logs = FarmerActivityLogRepository.getByPhoneNumber(phone);
  return res.json({
    success: true,
    phoneNumber: phone,
    count: logs.length,
    logs
  });
});

