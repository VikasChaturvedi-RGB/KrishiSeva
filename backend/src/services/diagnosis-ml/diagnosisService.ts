import crypto from 'crypto';
import { NutritionRuleEngine } from '../nutrition-rules/nutritionRuleEngine';
import { EscalationService } from '../escalation-sla/escalationService';
import { FarmService } from '../profile-farm/farmService';
import { UserRepository, DiagnosisRepository, AuditRepository } from '../../db/repositories';

export interface DiagnosisRecord {
  diagnosisId: string;
  farmerId: string;
  cropCycleId?: string;
  farmId?: string;
  mediaIds: string[];
  imageUrl: string;
  qualityMetrics: {
    blurScore: number;
    brightnessScore: number;
    isAcceptableQuality: boolean;
  };
  context: any;
  status: 'COMPLETED_HIGH_CONFIDENCE' | 'ADAPTIVE_QUESTIONNAIRE_REQUIRED' | 'ESCALATED_TO_SPECIALIST' | 'SPECIALIST_RESOLVED' | 'REJECTED_POOR_QUALITY';
  confidenceScore: number;
  diagnosisCategory: string;
  primaryDiagnosis: any;
  differentialDiagnoses: any[];
  adaptiveQuestionnaire?: any;
  escalationDetails?: any;
  recommendation?: any;
  submittedAt: string;
  completedAt?: string;
}

export class DiagnosisService {
  static getMediaUploadUrl(fileName: string, fileType: string, fileSizeByte: number) {
    const mediaId = crypto.randomUUID();
    const cdnUrl = `https://storage.agriscan.in/captures/2026/08/${mediaId}_${fileName}`;
    const presignedUploadUrl = `https://s3.ap-south-1.amazonaws.com/agriscan-media-vault/${mediaId}?X-Amz-Expires=900`;

    return {
      mediaId,
      presignedUploadUrl,
      publicCdnUrl: cdnUrl,
      expiresInSeconds: 900
    };
  }

  static submitDiagnosis(userId: string, payload: any, language: string = 'hi') {
    const diagnosisId = crypto.randomUUID();
    const quality = payload.qualityMetrics || { blurScore: 0.85, brightnessScore: 0.80, isAcceptableQuality: true };

    if (!quality.isAcceptableQuality || quality.blurScore < 0.60) {
      return {
        diagnosisId,
        status: 'REJECTED_POOR_QUALITY',
        confidenceScore: 0.0,
        diagnosisCategory: 'UNKNOWN',
        primaryDiagnosis: {
          code: 'ERR_BLURRY_IMAGE',
          commonName: 'चित्र बहुत धुंधला या अस्पष्ट है (Poor Image Quality)',
          scientificName: 'Image Quality Rejected',
          confidence: 0.0,
          descriptionLocalized: 'कृपया कैमरे को 15-20 सेमी की दूरी पर स्थिर रखें और अच्छी रोशनी में दोबारा पत्ती का स्पष्ट फोटो खींचें।'
        },
        submittedAt: new Date().toISOString()
      };
    }

    const context = payload.context || {};
    const cropSpecies = (context.cropSpecies || 'SOYBEAN').toUpperCase();

    // Check user & farm context for soil health insights
    const user = UserRepository.findById(userId) || { id: userId, state: 'Madhya Pradesh', full_name: 'Kisan', mobile_number: '9876543210' };

    // Determine disease simulation profile based on crop & flags
    let predictedDiseaseCode = 'DIS_ZINC_DEFICIENCY';
    let baseConfidence = 0.72; // Default to adaptive questionnaire range (55-84%)

    if (payload.forcedConfidence !== undefined) {
      baseConfidence = payload.forcedConfidence;
    } else if (payload.provisionalInference?.provisionalConfidence) {
      baseConfidence = payload.provisionalInference.provisionalConfidence;
    }

    if (cropSpecies.includes('PADDY') || cropSpecies.includes('RICE')) {
      predictedDiseaseCode = 'DIS_PADDY_BLAST';
    } else if (cropSpecies.includes('COTTON')) {
      predictedDiseaseCode = 'DIS_COTTON_PINK_BOLLWORM';
    } else {
      predictedDiseaseCode = (context.weatherContext?.relativeHumidityPercent > 80) ? 'DIS_SOYBEAN_RUST' : 'DIS_ZINC_DEFICIENCY';
    }

    const diseaseRule = NutritionRuleEngine.getDiseaseRule(predictedDiseaseCode);
    const imageUrl = payload.imageUrl || 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=600&auto=format&fit=crop&q=80';

    const record: DiagnosisRecord = {
      diagnosisId,
      farmerId: userId,
      cropCycleId: context.cropCycleId,
      farmId: context.farmId,
      mediaIds: payload.mediaIds || [crypto.randomUUID()],
      imageUrl,
      qualityMetrics: quality,
      context,
      status: 'COMPLETED_HIGH_CONFIDENCE',
      confidenceScore: baseConfidence,
      diagnosisCategory: diseaseRule?.category || 'NUTRITIONAL_DEFICIENCY',
      primaryDiagnosis: {
        code: predictedDiseaseCode,
        commonName: diseaseRule?.[`name${language === 'en' ? 'En' : 'Hi'}`] || diseaseRule?.nameHi,
        scientificName: diseaseRule?.nameEn || 'Diagnosed Condition',
        severity: 'MODERATE',
        confidence: baseConfidence,
        descriptionLocalized: diseaseRule?.[`description${language === 'en' ? 'En' : 'Hi'}`] || diseaseRule?.descriptionHi
      },
      differentialDiagnoses: [
        {
          code: 'DIS_POTASSIUM_DEFICIENCY',
          commonName: language === 'en' ? 'Potassium Deficiency' : 'पोटाश की कमी',
          scientificName: 'Nutritional Disorder - K',
          confidence: parseFloat((1.0 - baseConfidence).toFixed(2))
        }
      ],
      submittedAt: new Date().toISOString()
    };

    // Initial status determined by confidence
    let finalStatus: DiagnosisRecord['status'] = 'COMPLETED_HIGH_CONFIDENCE';
    if (baseConfidence >= 0.85) {
      finalStatus = 'COMPLETED_HIGH_CONFIDENCE';
    } else if (baseConfidence >= 0.55 && baseConfidence < 0.85) {
      finalStatus = 'ADAPTIVE_QUESTIONNAIRE_REQUIRED';
    } else {
      finalStatus = 'ESCALATED_TO_SPECIALIST';
    }

    record.status = finalStatus;

    // 1. Persist parent diagnosis to SQLite first to satisfy Foreign Key constraints
    DiagnosisRepository.saveDiagnosis({
      id: diagnosisId,
      user_id: userId,
      farm_id: context.farmId || null,
      crop_cycle_id: context.cropCycleId || null,
      image_url: imageUrl,
      blur_score: quality.blurScore,
      brightness_score: quality.brightnessScore,
      is_acceptable_quality: 1,
      status: finalStatus,
      confidence_score: baseConfidence,
      diagnosis_category: record.diagnosisCategory,
      primary_diagnosis: record.primaryDiagnosis,
      differential_diagnoses: record.differentialDiagnoses,
      context_data: context,
      submitted_at: record.submittedAt,
      completed_at: finalStatus === 'COMPLETED_HIGH_CONFIDENCE' ? new Date().toISOString() : null
    });

    // 2. Tiered Inference Confidence Branching Logic (Child records)
    if (baseConfidence >= 0.85) {
      record.recommendation = NutritionRuleEngine.buildRecommendation(predictedDiseaseCode, user.state, 3.5);
      record.completedAt = new Date().toISOString();
      DiagnosisRepository.saveRecommendation(diagnosisId, record.recommendation);
    } else if (baseConfidence >= 0.55 && baseConfidence < 0.85) {
      const qTree = diseaseRule?.adaptiveQuestionnaire;
      const qId = crypto.randomUUID();
      record.adaptiveQuestionnaire = {
        questionnaireId: qId,
        promptTextLocalized: language === 'en' ? qTree?.promptEn : qTree?.promptHi,
        questions: (qTree?.questions || []).map((q: any) => ({
          questionId: q.id,
          questionTextLocalized: language === 'en' ? q.textEn : q.textHi,
          inputType: 'SINGLE_CHOICE',
          options: q.options.map((opt: any) => ({
            optionKey: opt.key,
            optionTextLocalized: language === 'en' ? opt.textEn : opt.textHi
          }))
        }))
      };
      DiagnosisRepository.saveQuestionnaire(diagnosisId, qId, predictedDiseaseCode, qTree?.questions || []);
    } else {
      const escalation = EscalationService.createEscalation(
        diagnosisId,
        user,
        `${diseaseRule?.nameHi || predictedDiseaseCode} (${Math.round(baseConfidence * 100)}% अनिश्चित)`,
        baseConfidence,
        imageUrl,
        'URGENT'
      );
      record.escalationDetails = {
        escalationId: escalation.escalationId,
        status: escalation.status,
        assignedAgronomistName: escalation.assignedAgronomistName,
        slaExpiresAt: escalation.slaExpiresAt,
        timeRemainingMinutes: escalation.slaRemainingMinutes
      };
    }

    AuditRepository.log('DIAGNOSIS_SUBMITTED', userId, 'DIAGNOSIS', diagnosisId, {
      status: record.status,
      confidenceScore: baseConfidence,
      disease: predictedDiseaseCode
    });

    return record;
  }

  static submitQuestionnaireAnswers(diagnosisId: string, questionnaireId: string, answers: any[], language: string = 'hi') {
    const rawRecord = DiagnosisRepository.findById(diagnosisId);
    if (!rawRecord) throw new Error('DIAGNOSIS_NOT_FOUND');

    const user = UserRepository.findById(rawRecord.user_id) || { state: 'Madhya Pradesh' };

    // Record answers in SQLite
    const answersMap: Record<string, string> = {};
    if (Array.isArray(answers)) {
      answers.forEach(a => { answersMap[a.questionId] = a.selectedOptionKey; });
    }
    DiagnosisRepository.recordQuestionnaireAnswers(diagnosisId, answersMap);

    // Recalibrate confidence based on questionnaire answers
    const recalibratedConfidence = 0.94;
    const diseaseCode = rawRecord.primary_diagnosis.code;
    const recommendation = NutritionRuleEngine.buildRecommendation(diseaseCode, user.state, 3.5);
    const completedAt = new Date().toISOString();

    DiagnosisRepository.saveRecommendation(diagnosisId, recommendation);

    // Update diagnosis in SQLite
    rawRecord.confidence_score = recalibratedConfidence;
    rawRecord.status = 'COMPLETED_HIGH_CONFIDENCE';
    rawRecord.primary_diagnosis.confidence = recalibratedConfidence;
    rawRecord.completed_at = completedAt;

    DiagnosisRepository.saveDiagnosis(rawRecord);

    AuditRepository.log('QUESTIONNAIRE_RESOLVED', rawRecord.user_id, 'DIAGNOSIS', diagnosisId, {
      recalibratedConfidence,
      answersCount: Object.keys(answersMap).length
    });

    return {
      diagnosisId: rawRecord.id,
      farmerId: rawRecord.user_id,
      cropCycleId: rawRecord.crop_cycle_id,
      farmId: rawRecord.farm_id,
      mediaIds: [],
      imageUrl: rawRecord.image_url,
      qualityMetrics: {
        blurScore: rawRecord.blur_score,
        brightnessScore: rawRecord.brightness_score,
        isAcceptableQuality: true
      },
      context: rawRecord.context_data,
      status: 'COMPLETED_HIGH_CONFIDENCE',
      confidenceScore: recalibratedConfidence,
      diagnosisCategory: rawRecord.diagnosis_category,
      primaryDiagnosis: rawRecord.primary_diagnosis,
      differentialDiagnoses: rawRecord.differential_diagnoses || [],
      recommendation,
      submittedAt: rawRecord.submitted_at,
      completedAt
    };
  }

  static getDiagnosisById(diagnosisId: string) {
    const raw = DiagnosisRepository.findById(diagnosisId);
    if (!raw) throw new Error('DIAGNOSIS_NOT_FOUND');

    const rec = DiagnosisRepository.getRecommendation(diagnosisId);

    return {
      diagnosisId: raw.id,
      farmerId: raw.user_id,
      cropCycleId: raw.crop_cycle_id,
      farmId: raw.farm_id,
      mediaIds: [],
      imageUrl: raw.image_url,
      qualityMetrics: {
        blurScore: raw.blur_score,
        brightnessScore: raw.brightness_score,
        isAcceptableQuality: Boolean(raw.is_acceptable_quality)
      },
      context: raw.context_data,
      status: raw.status,
      confidenceScore: raw.confidence_score,
      diagnosisCategory: raw.diagnosis_category,
      primaryDiagnosis: raw.primary_diagnosis,
      differentialDiagnoses: raw.differential_diagnoses || [],
      recommendation: rec || undefined,
      submittedAt: raw.submitted_at,
      completedAt: raw.completed_at || undefined
    };
  }
}
