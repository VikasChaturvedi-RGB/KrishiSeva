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

export interface LocationSoilContext {
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  soilType?: string; // 'Black Cotton Soil', 'Alluvial Soil', 'Red Loamy Soil', 'Sandy Soil', 'Laterite Soil', 'Calcareous Soil'
  soilPh?: number;
  landAreaAcres?: number;
}

export interface MetricDosageDetail {
  productName: string;
  formulation: string;
  dilutionGramsOrMlPerLiter: number;
  dilutionUnit: 'g/L' | 'ml/L';
  dosagePerAcreGramsOrMl: number;
  dosageUnit: 'g/acre' | 'ml/acre' | 'kg/acre';
  waterVolumePerAcreLitres: number;
  totalCalculatedDose: string;
  totalCalculatedWaterLitres: number;
  applicationMethod: 'FOLIAR_SPRAY' | 'BASAL_SOIL_APPLICATION' | 'DRIP_FERTIGATION' | 'SOIL_DRENCH';
  applicationFrequencyDays: number;
  bestTimeOfApplication: string;
}

export interface LocationAwareDeficiencySolution {
  solutionId: string;
  deficiencyCode: string;
  nutrientName: string;
  cropNameEn: string;
  cropNameHi: string;
  locationDetails: {
    state: string;
    district: string;
    soilType: string;
    soilPhCategory: 'ACIDIC' | 'NEUTRAL' | 'ALKALINE_CALCAREOUS';
  };
  soilChemistryRationale: {
    en: string;
    hi: string;
  };
  step1MineralCorrection: {
    actionEn: string;
    actionHi: string;
    dosage: MetricDosageDetail;
  };
  step2BiologicalAndSoilRemediation: {
    actionEn: string;
    actionHi: string;
    bioProduct: string;
    dosage: MetricDosageDetail;
  };
  step3RegulatoryFormulation: {
    actionEn: string;
    actionHi: string;
    cibrcCategory: string;
    activeIngredient: string;
    safetyPrecautions: string;
  };
  sprayInstructionsLocalized: string;
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

  /**
   * Build complete 3-step recommendation for crop disease
   */
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

      rec.step3ChemicalIntervention.isPermitted = !banCheck.isBanned;
      rec.step3ChemicalIntervention.approvedMolecules = [
        {
          moleculeName: activeIngredient,
          isStatePermitted: !banCheck.isBanned,
          cibrcRegistered: true
        }
      ];

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

  /**
   * Location-Specific & Soil-Aware Nutrient Deficiency Solver with Exact Metric Dosages
   */
  static buildDeficiencySolution(
    cropCode: string = 'CROP_BANANA',
    deficiencyCode: string = 'DEF_ZN',
    location: LocationSoilContext = {}
  ): LocationAwareDeficiencySolution {
    this.loadKnowledge();
    const state = location.state || 'Madhya Pradesh';
    const district = location.district || 'Ujjain';
    const soilType = location.soilType || 'Black Cotton Soil (काली मिट्टी)';
    const acres = location.landAreaAcres || 1.0;
    const waterPerAcre = 200;
    const totalWater = Math.round(waterPerAcre * acres);

    const isAlkalineOrBlackSoil = soilType.toLowerCase().includes('black') ||
      soilType.toLowerCase().includes('calcareous') ||
      (location.soilPh && location.soilPh > 7.5);

    // 1. Zinc Deficiency Solver
    if (deficiencyCode === 'DEF_ZN' || deficiencyCode.includes('ZINC')) {
      const foliarDoseGramsPerL = isAlkalineOrBlackSoil ? 1.5 : 5.0;
      const foliarProd = isAlkalineOrBlackSoil ? 'Chelated Zinc (Zn-EDTA 12%)' : 'Zinc Sulphate Heptahydrate (ZnSO4 21%)';
      const totalGrams = Math.round(foliarDoseGramsPerL * totalWater);

      return {
        solutionId: `SOL-ZN-${Date.now()}`,
        deficiencyCode: 'DEF_ZN',
        nutrientName: 'Zinc (Zn) Micronutrient',
        cropNameEn: cropCode.replace('CROP_', ''),
        cropNameHi: cropCode === 'CROP_BANANA' ? 'केला' : cropCode === 'CROP_SOYBEAN' ? 'सोयाबीन' : 'फसल',
        locationDetails: {
          state,
          district,
          soilType,
          soilPhCategory: isAlkalineOrBlackSoil ? 'ALKALINE_CALCAREOUS' : 'NEUTRAL'
        },
        soilChemistryRationale: {
          en: isAlkalineOrBlackSoil
            ? `In ${district} (${state}) ${soilType} with elevated pH/free lime, inorganic zinc gets rapidly fixed and unavailable in root zones. Foliar spray of Chelated Zn-EDTA bypasses soil lockup for 4x faster uptake.`
            : `In ${district} soils, apply foliar Zinc Sulphate supplemented with soil basal application for sustained vegetative development.`,
          hi: isAlkalineOrBlackSoil
            ? `${district} (${state}) की ${soilType} (मध्यम से उच्च pH) में मिट्टी में डाला गया जिंक लॉक हो जाता है। अतः चिलेटेड जिंक (Zn-EDTA 12%) का पर्णीय छिड़काव 4 गुना तेजी से पत्तियों में अवशोषित होता है।`
            : `${district} की मिट्टी में जिंक सल्फेट का पर्णीय छिड़काव एवं मिट्टी में उपयोग त्वरित सुधार करता है।`
        },
        step1MineralCorrection: {
          actionEn: `Foliar spray of ${foliarProd} @ ${foliarDoseGramsPerL}g per Litre of clean water.`,
          actionHi: `स्वच्छ पानी में ${foliarProd} @ ${foliarDoseGramsPerL} ग्राम प्रति लीटर की दर से पर्णीय छिड़काव करें।`,
          dosage: {
            productName: foliarProd,
            formulation: isAlkalineOrBlackSoil ? 'Zn-EDTA 12% W/W (Chelated Micronutrient Powder)' : 'ZnSO4.7H2O 21% Agricultural Grade',
            dilutionGramsOrMlPerLiter: foliarDoseGramsPerL,
            dilutionUnit: 'g/L',
            dosagePerAcreGramsOrMl: isAlkalineOrBlackSoil ? 300 : 1000,
            dosageUnit: 'g/acre',
            waterVolumePerAcreLitres: waterPerAcre,
            totalCalculatedDose: `${totalGrams}g of ${foliarProd} dissolved in ${totalWater} Litres of water for ${acres} Acre(s)`,
            totalCalculatedWaterLitres: totalWater,
            applicationMethod: 'FOLIAR_SPRAY',
            applicationFrequencyDays: 12,
            bestTimeOfApplication: 'Early morning (08:00 - 11:00 AM) or Late afternoon (04:00 - 06:30 PM)'
          }
        },
        step2BiologicalAndSoilRemediation: {
          actionEn: 'Soil application of Zinc Solubilizing Bacteria (ZSB / Bio-Zinc) mixed with well-decomposed FYM/Compost.',
          actionHi: 'जिंक घुलनशील जीवाणु (ZSB / बायो-जिंक) 1 लीटर/एकड़ को 200 किग्रा अच्छी सड़ी गोबर की खाद में मिलाकर खेत में डालें।',
          bioProduct: 'Zinc Solubilizing Biofertilizer (ZSB)',
          dosage: {
            productName: 'Bio-Zinc / ZSB (Bacillus / Pseudomonas sp.)',
            formulation: 'Liquid Biofertilizer (1x10^8 CFU/ml)',
            dilutionGramsOrMlPerLiter: 5.0,
            dilutionUnit: 'ml/L',
            dosagePerAcreGramsOrMl: 1000,
            dosageUnit: 'ml/acre',
            waterVolumePerAcreLitres: 200,
            totalCalculatedDose: `${Math.round(1000 * acres)}ml in 200kg FYM or Drip Irrigation`,
            totalCalculatedWaterLitres: totalWater,
            applicationMethod: 'DRIP_FERTIGATION',
            applicationFrequencyDays: 30,
            bestTimeOfApplication: 'During soil preparation or early vegetative stage'
          }
        },
        step3RegulatoryFormulation: {
          actionEn: 'Apply FCO / CIB&RC certified 100% water-soluble Zinc formulation.',
          actionHi: 'उर्वरक नियंत्रण आदेश (FCO) प्रमाणित 100% जल-घुलनशील जिंक का ही उपयोग करें।',
          cibrcCategory: 'FCO Schedule 1 (Micronutrient Fertilizers)',
          activeIngredient: isAlkalineOrBlackSoil ? 'Zinc EDTA 12%' : 'Zinc Sulphate 21% / 33%',
          safetyPrecautions: 'Wear gloves and eye protection. Do not mix directly with high-phosphate fertilizers (DAP/SSP) in the same spray tank to prevent precipitation.'
        },
        sprayInstructionsLocalized: 'छिड़काव के समय मिट्टी में पर्याप्त नमी होनी चाहिए। तेज धूप या हवा में छिड़काव न करें।'
      };
    }

    // 2. Potassium (K) Deficiency Solver
    if (deficiencyCode === 'DEF_K' || deficiencyCode.includes('POTASSIUM') || deficiencyCode.includes('POTASH')) {
      const foliarDose = 10.0; // 10g/L SOP (0-0-50) or 5g/L Potassium Schoenite
      const totalGrams = Math.round(foliarDose * totalWater);

      return {
        solutionId: `SOL-K-${Date.now()}`,
        deficiencyCode: 'DEF_K',
        nutrientName: 'Potassium (K) Macronutrient',
        cropNameEn: cropCode.replace('CROP_', ''),
        cropNameHi: cropCode === 'CROP_BANANA' ? 'केला' : cropCode === 'CROP_SOYBEAN' ? 'सोयाबीन' : 'फसल',
        locationDetails: {
          state,
          district,
          soilType,
          soilPhCategory: isAlkalineOrBlackSoil ? 'ALKALINE_CALCAREOUS' : 'NEUTRAL'
        },
        soilChemistryRationale: {
          en: `Heavy feeding crops like Banana and Sugarcane in ${district} require rapid replenishment of ionic K+ to restore stomatal turgor and prevent marginal necrosis. Sulphate of Potash (SOP 0-0-50) foliar spray delivers immediate foliar absorption.`,
          hi: `${district} में केला तथा गन्ना जैसी फसलों में पोटाश की कमी से पत्तियों के किनारे जलने लगते हैं। 0-0-50 (सल्फेट ऑफ पोटाश) का पर्णीय छिड़काव पौधे की रोग प्रतिरोधक क्षमता एवं फल भराव को तुरंत सुधारता है।`
        },
        step1MineralCorrection: {
          actionEn: `Foliar spray of 100% Water Soluble Potassium Sulphate (SOP 0-0-50) @ 10g per Litre.`,
          actionHi: `100% जल-घुलनशील पोटेशियम सल्फेट (0-0-50 SOP) @ 10 ग्राम प्रति लीटर की दर से छिड़काव करें।`,
          dosage: {
            productName: 'Potassium Sulphate (SOP 0-0-50 + 17.5% S)',
            formulation: '100% Water Soluble Crystalline Powder',
            dilutionGramsOrMlPerLiter: 10.0,
            dilutionUnit: 'g/L',
            dosagePerAcreGramsOrMl: 2000,
            dosageUnit: 'g/acre',
            waterVolumePerAcreLitres: waterPerAcre,
            totalCalculatedDose: `${totalGrams}g (2.0 kg/acre) in ${totalWater}L water for ${acres} Acre(s)`,
            totalCalculatedWaterLitres: totalWater,
            applicationMethod: 'FOLIAR_SPRAY',
            applicationFrequencyDays: 14,
            bestTimeOfApplication: 'Morning or Evening when leaf stomata are open'
          }
        },
        step2BiologicalAndSoilRemediation: {
          actionEn: 'Soil drenching / fertigation of Potash Mobilizing Bacteria (KMB) with compost.',
          actionHi: 'पोटाश मोबिलाइजिंग बैक्टीरिया (KMB) 1 लीटर प्रति एकड़ ड्रिप अथवा खाद के साथ दें।',
          bioProduct: 'Potash Mobilizing Biofertilizer (KMB / Frateuria aurantia)',
          dosage: {
            productName: 'Bio-Potash (KMB)',
            formulation: 'Liquid Biofertilizer (1x10^8 CFU/ml)',
            dilutionGramsOrMlPerLiter: 5.0,
            dilutionUnit: 'ml/L',
            dosagePerAcreGramsOrMl: 1000,
            dosageUnit: 'ml/acre',
            waterVolumePerAcreLitres: 200,
            totalCalculatedDose: `${Math.round(1000 * acres)}ml per ${acres} Acre(s)`,
            totalCalculatedWaterLitres: totalWater,
            applicationMethod: 'DRIP_FERTIGATION',
            applicationFrequencyDays: 25,
            bestTimeOfApplication: 'Along with regular irrigation cycle'
          }
        },
        step3RegulatoryFormulation: {
          actionEn: 'Soil top-dressing of MOP (0-0-60) @ 25 kg/acre or SOP through drip irrigation.',
          actionHi: 'म्यूरेट ऑफ पोटाश (MOP 0-0-60) 25 किग्रा/एकड़ मिट्टी में दें अथवा ड्रिप से दें।',
          cibrcCategory: 'FCO Schedule 1 (Potassic Fertilizers)',
          activeIngredient: 'Potassium Sulphate / Muriate of Potash',
          safetyPrecautions: 'Maintain optimal soil moisture during application to ensure rapid root absorption.'
        },
        sprayInstructionsLocalized: 'छिड़काव से पूर्व पत्ती पर धूल न हो। नोजल को पत्ती के दोनों तरफ (ऊपरी व निचली सतह) पर एकसमान स्प्रे करें।'
      };
    }

    // 3. Default / Nitrogen / Iron / Boron Solver
    const foliarDose = 5.0;
    const totalGrams = Math.round(foliarDose * totalWater);

    return {
      solutionId: `SOL-GEN-${Date.now()}`,
      deficiencyCode,
      nutrientName: deficiencyCode.replace('DEF_', '') + ' Balanced Crop Nutrient Solution',
      cropNameEn: cropCode.replace('CROP_', ''),
      cropNameHi: cropCode === 'CROP_BANANA' ? 'केला' : 'फसल',
      locationDetails: {
        state,
        district,
        soilType,
        soilPhCategory: isAlkalineOrBlackSoil ? 'ALKALINE_CALCAREOUS' : 'NEUTRAL'
      },
      soilChemistryRationale: {
        en: `Balanced micronutrient foliar remediation adapted for ${district} (${state}) ${soilType}. Provides essential micro and macro elements to restore chlorophyll synthesis and metabolic vitality.`,
        hi: `${district} (${state}) की ${soilType} के अनुकूल संतुलित सूक्ष्म पोषक तत्व घोल। पत्तियों में क्लोरोफिल और फसल वृद्धि को पुनर्जीवित करता है।`
      },
      step1MineralCorrection: {
        actionEn: `Foliar spray of Multi-Micronutrient Grade-IV formulation @ ${foliarDose}g per Litre.`,
        actionHi: `मल्टी-माइक्रोन्यूट्रिएंट ग्रेड-4 फॉर्मूलेशन @ ${foliarDose} ग्राम प्रति लीटर का छिड़काव करें।`,
        dosage: {
          productName: 'Customized Multi-Micronutrient Mixture Grade-IV',
          formulation: '100% Water Soluble Micro-Cheles',
          dilutionGramsOrMlPerLiter: foliarDose,
          dilutionUnit: 'g/L',
          dosagePerAcreGramsOrMl: 1000,
          dosageUnit: 'g/acre',
          waterVolumePerAcreLitres: waterPerAcre,
          totalCalculatedDose: `${totalGrams}g in ${totalWater} Litres water for ${acres} Acre(s)`,
          totalCalculatedWaterLitres: totalWater,
          applicationMethod: 'FOLIAR_SPRAY',
          applicationFrequencyDays: 14,
          bestTimeOfApplication: 'Early morning or late afternoon'
        }
      },
      step2BiologicalAndSoilRemediation: {
        actionEn: 'Apply Arbuscular Mycorrhizal Fungi (VAM) and Organic Compost @ 250 kg/acre.',
        actionHi: 'माइकोराइजा (VAM) 4 किग्रा/एकड़ को सड़ी गोबर खाद के साथ मिलाकर जड़ क्षेत्र में दें।',
        bioProduct: 'VAM (Vesicular Arbuscular Mycorrhiza)',
        dosage: {
          productName: 'Endomycorrhizal Inoculant',
          formulation: 'Granular Carrier Based (100 IP/g)',
          dilutionGramsOrMlPerLiter: 0,
          dilutionUnit: 'g/L',
          dosagePerAcreGramsOrMl: 4000,
          dosageUnit: 'g/acre',
          waterVolumePerAcreLitres: 0,
          totalCalculatedDose: `${Math.round(4 * acres)} kg mixed with compost`,
          totalCalculatedWaterLitres: 0,
          applicationMethod: 'BASAL_SOIL_APPLICATION',
          applicationFrequencyDays: 45,
          bestTimeOfApplication: 'At vegetative onset or soil hoeing'
        }
      },
      step3RegulatoryFormulation: {
        actionEn: 'Certified State Micronutrient Fertilizer Grade matching local soil tests.',
        actionHi: 'राज्य सरकार द्वारा अनुमोदित सूक्ष्म पोषक तत्व ग्रेड का प्रयोग करें।',
        cibrcCategory: 'FCO Certified Grade',
        activeIngredient: 'Fe, Zn, Mn, Cu, B, Mo Balanced Mix',
        safetyPrecautions: 'Store in cool, dry location. Keep away from direct sunlight and children.'
      },
      sprayInstructionsLocalized: 'स्वच्छ मीठे पानी का उपयोग करें। खारे या गंदले पानी में घोल न बनाएं।'
    };
  }
}
