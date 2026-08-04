import { DiagnosisService } from '../src/services/diagnosis-ml/diagnosisService';

describe('Tiered Diagnosis & Confidence Branching Engine Tests', () => {
  const dummyUserId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

  test('High Confidence (>= 85%): Returns COMPLETED_HIGH_CONFIDENCE with instant prescription', () => {
    const payload = {
      forcedConfidence: 0.92,
      qualityMetrics: { blurScore: 0.85, brightnessScore: 0.80, isAcceptableQuality: true },
      context: { cropSpecies: 'SOYBEAN' }
    };

    const res = DiagnosisService.submitDiagnosis(dummyUserId, payload);
    expect(res.status).toBe('COMPLETED_HIGH_CONFIDENCE');
    expect(res.confidenceScore).toBe(0.92);
    expect(res.recommendation).toBeDefined();
    expect(res.recommendation.step1NutrientFoliarCorrection.isRecommended).toBe(true);
  });

  test('Ambiguous Confidence (55% - 84%): Triggers ADAPTIVE_QUESTIONNAIRE_REQUIRED', () => {
    const payload = {
      forcedConfidence: 0.72,
      qualityMetrics: { blurScore: 0.85, brightnessScore: 0.80, isAcceptableQuality: true },
      context: { cropSpecies: 'SOYBEAN' }
    };

    const res = DiagnosisService.submitDiagnosis(dummyUserId, payload);
    expect(res.status).toBe('ADAPTIVE_QUESTIONNAIRE_REQUIRED');
    expect(res.adaptiveQuestionnaire).toBeDefined();
    expect(res.adaptiveQuestionnaire.questions.length).toBeGreaterThanOrEqual(1);
  });

  test('Low Confidence (< 55%): Triggers ESCALATED_TO_SPECIALIST with active SLA timer', () => {
    const payload = {
      forcedConfidence: 0.48,
      qualityMetrics: { blurScore: 0.85, brightnessScore: 0.80, isAcceptableQuality: true },
      context: { cropSpecies: 'SOYBEAN' }
    };

    const res = DiagnosisService.submitDiagnosis(dummyUserId, payload);
    expect(res.status).toBe('ESCALATED_TO_SPECIALIST');
    expect(res.escalationDetails).toBeDefined();
    expect(res.escalationDetails.assignedAgronomistName).toContain('Dr. Suresh Verma');
    expect(res.escalationDetails.timeRemainingMinutes).toBeGreaterThan(0);
  });

  test('Questionnaire submission recalibrates confidence to >= 94% and produces final prescription', () => {
    // 1. Initial diagnosis creates ambiguous state
    const initialRes = DiagnosisService.submitDiagnosis(dummyUserId, {
      forcedConfidence: 0.72,
      qualityMetrics: { blurScore: 0.85, brightnessScore: 0.80, isAcceptableQuality: true },
      context: { cropSpecies: 'SOYBEAN' }
    });

    // 2. Submit questionnaire answers
    const recalibrated = DiagnosisService.submitQuestionnaireAnswers(
      initialRes.diagnosisId,
      initialRes.adaptiveQuestionnaire.questionnaireId,
      [
        { questionId: 'Q_LEAF_POSITION', selectedOptionKeys: ['TOP_YOUNG'] },
        { questionId: 'Q_SPOT_TEXTURE', selectedOptionKeys: ['NO_POWDER'] }
      ]
    );

    expect(recalibrated.status).toBe('COMPLETED_HIGH_CONFIDENCE');
    expect(recalibrated.confidenceScore).toBe(0.94);
    expect(recalibrated.recommendation).toBeDefined();
  });
});
