import crypto from 'crypto';
import { NutritionRuleEngine } from '../nutrition-rules/nutritionRuleEngine';
import { EscalationRepository, DiagnosisRepository, AuditRepository } from '../../db/repositories';

export interface EscalationItem {
  escalationId: string;
  diagnosisId: string;
  farmerId: string;
  farmerName: string;
  farmerMobileMasked: string;
  cropName: string;
  state: string;
  district: string;
  aiTentativePrediction: string;
  tentativeConfidence: number;
  imageUrl: string;
  status: 'PENDING_ASSIGNMENT' | 'UNDER_REVIEW' | 'RESOLVED' | 'BREACHED_SLA';
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  slaExpiresAt: string;
  slaRemainingMinutes: number;
  assignedAgronomistName?: string;
  submittedAt: string;
  resolvedAt?: string;
  expertAdviceLocalized?: string;
}

export class EscalationService {
  static createEscalation(
    diagnosisId: string, 
    farmer: any, 
    tentativePrediction: string, 
    confidence: number, 
    imageUrl: string, 
    urgency: 'NORMAL' | 'URGENT' | 'CRITICAL' = 'URGENT'
  ) {
    const escalationId = crypto.randomUUID();
    const slaMinutes = urgency === 'CRITICAL' ? 60 : urgency === 'URGENT' ? 120 : 360;
    const slaExpiresAt = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

    const mobileStr = farmer.mobile_number || farmer.mobileNumber || '';
    const farmerMobileMasked = mobileStr ? `XXXXXX${mobileStr.slice(-4)}` : 'XXXXXX3210';

    const item = EscalationRepository.create({
      id: escalationId,
      diagnosis_id: diagnosisId,
      farmer_id: farmer.id || farmer.userId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      farmer_name: farmer.full_name || farmer.name || farmer.fullName || 'Kisan',
      farmer_mobile_masked: farmerMobileMasked,
      crop_name: farmer.activeCropName || 'Soybean',
      state: farmer.state || 'Madhya Pradesh',
      district: farmer.district || 'Ujjain',
      ai_tentative_prediction: tentativePrediction,
      tentative_confidence: confidence,
      image_url: imageUrl,
      status: 'PENDING_ASSIGNMENT',
      urgency,
      sla_expires_at: slaExpiresAt,
      assigned_agronomist_name: 'Dr. Suresh Verma (Senior Agronomist, KVK)',
      expert_advice_localized: null,
      submitted_at: new Date().toISOString(),
      resolved_at: null
    });

    AuditRepository.log('ESCALATION_CREATED', farmer.id || null, 'ESCALATION', escalationId, {
      diagnosisId,
      urgency,
      slaExpiresAt
    });

    return {
      escalationId: item.id,
      diagnosisId: item.diagnosis_id,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      farmerMobileMasked: item.farmer_mobile_masked,
      cropName: item.crop_name,
      state: item.state,
      district: item.district,
      aiTentativePrediction: item.ai_tentative_prediction,
      tentativeConfidence: item.tentative_confidence,
      imageUrl: item.image_url,
      status: item.status,
      urgency: item.urgency,
      slaExpiresAt: item.sla_expires_at,
      slaRemainingMinutes: slaMinutes,
      assignedAgronomistName: item.assigned_agronomist_name || undefined,
      submittedAt: item.submitted_at
    };
  }

  static getQueue(status?: string, stateFilter?: string) {
    const rawItems = EscalationRepository.listQueue(status, stateFilter);

    const items: EscalationItem[] = rawItems.map(i => {
      const remainingMs = new Date(i.sla_expires_at).getTime() - Date.now();
      let remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
      let currentStatus = i.status;
      if (remainingMinutes === 0 && currentStatus !== 'RESOLVED') {
        currentStatus = 'BREACHED_SLA';
      }

      return {
        escalationId: i.id,
        diagnosisId: i.diagnosis_id,
        farmerId: i.farmer_id,
        farmerName: i.farmer_name,
        farmerMobileMasked: i.farmer_mobile_masked,
        cropName: i.crop_name,
        state: i.state,
        district: i.district,
        aiTentativePrediction: i.ai_tentative_prediction,
        tentativeConfidence: i.tentative_confidence,
        imageUrl: i.image_url,
        status: currentStatus,
        urgency: i.urgency,
        slaExpiresAt: i.sla_expires_at,
        slaRemainingMinutes: remainingMinutes,
        assignedAgronomistName: i.assigned_agronomist_name || undefined,
        expertAdviceLocalized: i.expert_advice_localized || undefined,
        submittedAt: i.submitted_at,
        resolvedAt: i.resolved_at || undefined
      };
    });

    return {
      items,
      totalPending: items.filter(i => i.status !== 'RESOLVED').length,
      page: 1
    };
  }

  static resolveEscalation(escalationId: string, resolutionPayload: any) {
    const resolvedItem = EscalationRepository.resolve(
      escalationId,
      resolutionPayload.agronomicAdviceLocalized || 'विशेषज्ञ द्वारा सत्यापित सलाह।'
    );

    const recommendation = NutritionRuleEngine.buildRecommendation(
      resolutionPayload.confirmedDiagnosisCode,
      resolvedItem.state,
      2.0
    );

    // Save recommendation to diagnosis
    DiagnosisRepository.saveRecommendation(resolvedItem.diagnosis_id, recommendation);

    // Update diagnosis status in SQLite
    const diagnosis = DiagnosisRepository.findById(resolvedItem.diagnosis_id);
    if (diagnosis) {
      diagnosis.status = 'SPECIALIST_RESOLVED';
      diagnosis.confidence_score = 1.0;
      diagnosis.diagnosis_category = resolutionPayload.diagnosisCategory || 'NUTRITIONAL_DEFICIENCY';
      diagnosis.primary_diagnosis = {
        code: resolutionPayload.confirmedDiagnosisCode,
        commonName: resolutionPayload.confirmedDiagnosisName,
        scientificName: 'Agronomist Confirmed Diagnosis',
        severity: 'MODERATE',
        confidence: 1.0,
        descriptionLocalized: resolutionPayload.agronomicAdviceLocalized
      };
      diagnosis.completed_at = resolvedItem.resolved_at;
      DiagnosisRepository.saveDiagnosis(diagnosis);
    }

    AuditRepository.log('ESCALATION_RESOLVED', null, 'ESCALATION', escalationId, {
      confirmedCode: resolutionPayload.confirmedDiagnosisCode
    });

    return {
      diagnosisId: resolvedItem.diagnosis_id,
      status: 'SPECIALIST_RESOLVED',
      confidenceScore: 1.0,
      diagnosisCategory: resolutionPayload.diagnosisCategory,
      primaryDiagnosis: {
        code: resolutionPayload.confirmedDiagnosisCode,
        commonName: resolutionPayload.confirmedDiagnosisName,
        scientificName: 'Agronomist Confirmed Diagnosis',
        severity: 'MODERATE',
        confidence: 1.0,
        descriptionLocalized: resolutionPayload.agronomicAdviceLocalized
      },
      recommendation,
      submittedAt: resolvedItem.submitted_at,
      completedAt: resolvedItem.resolved_at
    };
  }
}
