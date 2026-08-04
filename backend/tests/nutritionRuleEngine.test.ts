import { NutritionRuleEngine } from '../src/services/nutrition-rules/nutritionRuleEngine';

describe('NutritionRuleEngine & CIB&RC Compliance Tests', () => {
  test('Strict Nutrition-First Ordering: Foliar mineral is Step 1, Biological is Step 2, Chemical is Step 3', () => {
    const recommendation = NutritionRuleEngine.buildRecommendation('DIS_ZINC_DEFICIENCY', 'Madhya Pradesh', 2.5);

    expect(recommendation.priorityOrder).toEqual([
      'STEP_1_MINERAL_FOLIAR_CORRECTION',
      'STEP_2_BIOLOGICAL_AND_SOIL_REMEDIATION',
      'STEP_3_CIBRC_CHEMICAL_INTERVENTION'
    ]);

    // Step 1 check
    expect(recommendation.step1NutrientFoliarCorrection.isRecommended).toBe(true);
    expect(recommendation.step1NutrientFoliarCorrection.dosage.perLitreDilution).toContain('2.5');
    expect(recommendation.step1NutrientFoliarCorrection.dosage.totalAcreageCalculatedDose).toContain('1250'); // 500g * 2.5 acres

    // Step 2 check
    expect(recommendation.step2BiologicalOrCultural.isRecommended).toBe(true);

    // Step 3 check for nutritional deficiency should be chemical-free
    expect(recommendation.step3ChemicalIntervention.isRecommended).toBe(false);
  });

  test('Regional State-Level Chemical Ban Filtering: Chlorpyrifos is blocked in Punjab', () => {
    // If a pest requires Chlorpyrifos, test Punjab ban
    const punjabCheck = NutritionRuleEngine.checkChemicalEligibility('Chlorpyrifos 20% EC', 'Punjab');
    expect(punjabCheck.isBanned).toBe(true);
    expect(punjabCheck.banNotice).toContain('Punjab');

    const mpCheck = NutritionRuleEngine.checkChemicalEligibility('Chlorpyrifos 20% EC', 'Madhya Pradesh');
    expect(mpCheck.isBanned).toBe(false);
  });

  test('Dosage scaling across varying acreage values', () => {
    const rec5Acres = NutritionRuleEngine.buildRecommendation('DIS_ZINC_DEFICIENCY', 'Madhya Pradesh', 5.0);
    expect(rec5Acres.step1NutrientFoliarCorrection.dosage.totalAcreageCalculatedDose).toContain('2500'); // 500g * 5 = 2500g
    expect(rec5Acres.step1NutrientFoliarCorrection.dosage.totalWaterVolumeLitres).toBe(1000); // 200L * 5 = 1000L
  });
});
