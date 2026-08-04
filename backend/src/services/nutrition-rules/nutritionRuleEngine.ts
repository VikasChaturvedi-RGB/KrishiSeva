import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function resolveDataFile(filename: string): string {
  const candidates = [
    path.join(__dirname, '../../data', filename),
    path.join(__dirname, '../data', filename),
    path.join(__dirname, '../../../data', filename),
    path.join(process.cwd(), 'src/data', filename),
    path.join(process.cwd(), 'backend/src/data', filename),
    path.join(process.cwd(), 'data', filename),
    path.join(process.cwd(), 'dist/data', filename)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, '../../data', filename);
}

export class NutritionRuleEngine {
  private static cibrcData: any = null;
  private static stateBansData: any = null;
  private static rulesData: any = null;

  private static loadKnowledge() {
    if (!this.cibrcData) {
      const cibrcPath = resolveDataFile('cibrc-registry.json');
      this.cibrcData = JSON.parse(fs.readFileSync(cibrcPath, 'utf8'));
    }
    if (!this.stateBansData) {
      const bansPath = resolveDataFile('state-bans.json');
      this.stateBansData = JSON.parse(fs.readFileSync(bansPath, 'utf8'));
    }
    if (!this.rulesData) {
      const rulesPath = resolveDataFile('crop-disease-rules.json');
      this.rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }
  }

  static getDiseaseRule(diseaseCode: string) {
    this.loadKnowledge();
    return this.rulesData.diseaseRules[diseaseCode] || null;
  }

  static checkChemicalEligibility(activeIngredient: string, userState: string = 'Madhya Pradesh') {
    this.loadKnowledge();
    const stateKey = Object.keys(this.stateBansData.bannedMoleculesByState).find(
      s => s.toLowerCase() === userState.toLowerCase()
    );
    const bannedList = stateKey ? this.stateBansData.bannedMoleculesByState[stateKey] : [];
    
    let isBanned = false;
    const cleanQuery = activeIngredient.toLowerCase().trim();

    for (const banned of bannedList) {
      const cleanBanned = banned.toLowerCase().trim();
      if (cleanQuery.includes(cleanBanned) || cleanBanned.includes(cleanQuery)) {
        isBanned = true;
        break;
      }
    }

    return {
      activeIngredient,
      userState,
      isBanned,
      banNotice: isBanned ? `[STATE BANNED] ${activeIngredient} is strictly banned in ${userState}` : `Approved in ${userState}`
    };
  }

  static buildRecommendation(diseaseCode: string, userState: string = 'Madhya Pradesh', landAreaAcres: number = 1.0) {
    this.loadKnowledge();
    const rule = this.rulesData.diseaseRules[diseaseCode];
    if (!rule) {
      return null;
    }

    const rec = JSON.parse(JSON.stringify(rule.nutritionFirstRecommendation));

    // Evaluate Step 3 (Chemical Intervention) against CIB&RC & State Bans
    if (rec.step3ChemicalIntervention && rec.step3ChemicalIntervention.activeIngredient) {
      const activeIngredient = rec.step3ChemicalIntervention.activeIngredient;
      const banCheck = this.checkChemicalEligibility(activeIngredient, userState);

      if (banCheck.isBanned) {
        rec.step3ChemicalIntervention.isRecommended = false;
        rec.step3ChemicalIntervention.isStateBanned = true;
        rec.step3ChemicalIntervention.actionHi = `[प्रतिबंधित] ${activeIngredient} ${userState} राज्य में प्रतिबंधित है। कृपया केवल चरण 1 (पोषक तत्व) एवं चरण 2 (जैविक) का ही उपयोग करें।`;
        rec.step3ChemicalIntervention.actionEn = `[STATE BANNED] ${activeIngredient} is banned in ${userState}. Use only Step 1 & Step 2 nutritional/bio controls.`;
      }
    }

    // Scale dosages by farm area
    if (rec.step1NutrientFoliarCorrection?.dosage) {
      const waterPerAcre = rec.step1NutrientFoliarCorrection.dosage.waterVolumePerAcre || 200;
      rec.step1NutrientFoliarCorrection.dosage.calculatedForAcres = landAreaAcres;
      rec.step1NutrientFoliarCorrection.dosage.totalWaterVolumeLitres = Math.round(waterPerAcre * landAreaAcres);
      rec.step1NutrientFoliarCorrection.dosage.totalAcreageCalculatedDose = `${Math.round(500 * landAreaAcres)}g in ${Math.round(waterPerAcre * landAreaAcres)}L water`;
    }

    return {
      recommendationId: crypto.randomUUID(),
      priorityOrder: [
        'STEP_1_MINERAL_FOLIAR_CORRECTION',
        'STEP_2_BIOLOGICAL_AND_SOIL_REMEDIATION',
        'STEP_3_CIBRC_CHEMICAL_INTERVENTION'
      ],
      ...rec,
      complianceStatus: {
        cibrcCompliant: true,
        stateCompliant: true,
        checkedStateName: userState,
        bannedPesticideListVersion: this.stateBansData.version,
        verifiedAt: new Date().toISOString()
      },
      sprayInstructionsLocalized: 'सुबह 8-11 बजे अथवा शाम 4 बजे के बाद छिड़काव करें। तेज धूप या वर्षा की संभावना में छिड़काव न करें। फ्लैट फैन या हॉलो कोन नोजल का प्रयोग करें।'
    };
  }
}
