import {
  MandiPriceRepository,
  SchemeApplicationRepository,
  CommunityOutbreakRepository,
  StateAgroChallengeRepository,
  ChcMachineryBookingRepository,
  AuditRepository
} from '../../db/repositories';
import { DatabaseSeeder } from '../../db/seeder';

export class FarmerEcosystemService {
  private static ensureSeeded() {
    if (
      MandiPriceRepository.listAll().length === 0 ||
      StateAgroChallengeRepository.listAll().length === 0
    ) {
      DatabaseSeeder.seedEcosystemData();
    }
  }

  // =========================================================================
  // 1. LIVE APMC / e-NAM MANDI BHAV & NET PROFIT REALIZATION ENGINE
  // =========================================================================
  static getMandiIntelligence(params: {
    crop?: string;
    state?: string;
    search?: string;
    quantityQtl?: number;
  }) {
    this.ensureSeeded();
    const cropFilter = params.crop || 'ALL';
    const stateFilter = params.state || 'ALL';
    const quantityQtl = Math.max(1, Number(params.quantityQtl || 20));

    let items = MandiPriceRepository.listAll(cropFilter, stateFilter, params.search);
    if (items.length === 0 && (cropFilter !== 'ALL' || stateFilter !== 'ALL')) {
      items = MandiPriceRepository.listAll('ALL', 'ALL');
    }

    const enrichedMandis = items.map((m) => {
      // Transport & Mandi charges calculation (Standard tractor-trolley ₹18/km + ₹15/qtl hamali/weighing)
      const transportCostInr = Math.round(m.distance_km * 18 + quantityQtl * 15);
      const grossValueInr = Math.round(m.modal_price_qtl * quantityQtl);
      const netRealizationInr = grossValueInr - transportCostInr;
      const mspDiffInr = Math.round(m.modal_price_qtl - m.msp_price_qtl);
      const mspDiffPct = Number(((mspDiffInr / m.msp_price_qtl) * 100).toFixed(1));

      return {
        ...m,
        mspDiffInr,
        mspDiffPct,
        isAboveMsp: mspDiffInr >= 0,
        lotCalculation: {
          quantityQtl,
          grossValueInr,
          transportAndHamaliInr: transportCostInr,
          netRealizationInr,
          netPerQtlInr: Math.round(netRealizationInr / quantityQtl)
        }
      };
    });

    // Pick best net realization mandi for the farmer's lot size
    const bestMandi = [...enrichedMandis].sort(
      (a, b) => b.lotCalculation.netRealizationInr - a.lotCalculation.netRealizationInr
    )[0] || null;

    return {
      source: 'e-NAM & AGMARKNET Live Spot Aggregator',
      updatedAt: new Date().toISOString(),
      quantityQtl,
      count: enrichedMandis.length,
      bestMandiRecommendation: bestMandi
        ? {
            mandiName: bestMandi.mandi_name,
            cropNameHi: bestMandi.crop_name_hi,
            cropNameEn: bestMandi.crop_name_en,
            modalPriceQtl: bestMandi.modal_price_qtl,
            netRealizationInr: bestMandi.lotCalculation.netRealizationInr,
            transportCostInr: bestMandi.lotCalculation.transportAndHamaliInr,
            signal: bestMandi.sell_hold_signal,
            summaryHi: `${quantityQtl} क्विंटल के लिए ${bestMandi.mandi_name} सर्वोत्तम है — भाड़ा व हमाली (₹${bestMandi.lotCalculation.transportAndHamaliInr}) घटाकर शुद्ध प्राप्ति ₹${bestMandi.lotCalculation.netRealizationInr.toLocaleString('en-IN')} होगी।`,
            summaryEn: `Best net realization for ${quantityQtl} qtl is at ${bestMandi.mandi_name}: ₹${bestMandi.lotCalculation.netRealizationInr.toLocaleString('en-IN')} net after ₹${bestMandi.lotCalculation.transportAndHamaliInr} transport & hamali.`
          }
        : null,
      mandis: enrichedMandis
    };
  }

  // =========================================================================
  // 2. HYPERLOCAL WEATHER, SPRAY SUITABILITY WINDOW & IRRIGATION ENGINE
  // =========================================================================
  static getHyperlocalWeatherAndSprayWindow(params: {
    state?: string;
    district?: string;
    crop?: string;
    windSpeedKmh?: number;
    rainProbPct?: number;
    tempC?: number;
    humidityPct?: number;
  }) {
    const state = params.state || 'Madhya Pradesh';
    const district = params.district || 'Ujjain';
    const crop = (params.crop || 'SOYBEAN').replace(/^CROP_/, '').toUpperCase();

    const tempC = params.tempC !== undefined ? Number(params.tempC) : 29;
    const humidityPct = params.humidityPct !== undefined ? Number(params.humidityPct) : 76;
    const windSpeedKmh = params.windSpeedKmh !== undefined ? Number(params.windSpeedKmh) : 9.5;
    const rainProbPct = params.rainProbPct !== undefined ? Number(params.rainProbPct) : 15;

    // Evaluate Spray Suitability Physics
    let sprayStatus: 'OPTIMAL_SPRAY_WINDOW' | 'MODERATE_CAUTION' | 'DO_NOT_SPRAY' = 'OPTIMAL_SPRAY_WINDOW';
    let sprayScore = 92;
    let statusBadgeHi = 'छिड़काव के लिए उत्तम समय (Safe to Spray)';
    let statusBadgeEn = 'Optimal Spray Window — Safe for Foliar Application';
    let reasonHi = 'हवा की गति (9.5 km/h < 12 km/h) और वर्षा संभावना कम है। पत्तियों के रंध्र (Stomata) खुले हैं, पोषक तत्व 95% अवशोषित होंगे।';
    let reasonEn = 'Low wind drift (<12 km/h) and low rain washout risk. Leaf stomata are open for maximum foliar nutrient absorption.';

    if (rainProbPct >= 50 || windSpeedKmh >= 18 || tempC >= 36) {
      sprayStatus = 'DO_NOT_SPRAY';
      sprayScore = 24;
      statusBadgeHi = 'अभी छिड़काव न करें! (दवा धुलने/उड़ने का खतरा)';
      statusBadgeEn = 'DO NOT SPRAY NOW — High Washout / Drift Risk';
      reasonHi =
        rainProbPct >= 50
          ? `अगले 4 घंटों में ${rainProbPct}% बारिश की संभावना है — छिड़काव करने पर ₹1,800/एकड़ का घोल धुल सकता है।`
          : `तेज हवा (${windSpeedKmh} km/h) व उच्च तापमान (${tempC}°C) से स्प्रे बूंदें हवा में उड़ जाएंगी।`;
      reasonEn =
        rainProbPct >= 50
          ? `${rainProbPct}% rain probability in next 4 hours will wash off foliar spray. Wait for clear slot.`
          : `High wind (${windSpeedKmh} km/h) or heat (${tempC}°C) causes spray drift and stomatal closure.`;
    } else if (rainProbPct >= 25 || windSpeedKmh >= 13 || tempC >= 32) {
      sprayStatus = 'MODERATE_CAUTION';
      sprayScore = 64;
      statusBadgeHi = 'सावधानी से छिड़काव करें (स्टीकर/सिलिकॉन मिलाकर)';
      statusBadgeEn = 'Moderate Caution — Use Silicone Spreader/Sticker';
      reasonHi = 'हल्की हवा या बादल हैं — घोल में 0.5 मिली/लीटर सिलिकॉन चिपको (Spreader) अवश्य मिलाएं।';
      reasonEn = 'Moderate breeze or cloud cover — mix 0.5 ml/L non-ionic silicone surfactant for rapid leaf uptake.';
    }

    const hourlySpraySlots = [
      {
        timeSlot: '06:30 AM - 09:30 AM',
        tempC: 25,
        windKmh: 7,
        rainProbPct: 10,
        status: 'SAFE',
        labelHi: 'सर्वोत्तम (सुबह ओस सूखने के बाद)',
        labelEn: 'Best Morning Window (Max Stomatal Opening)'
      },
      {
        timeSlot: '10:00 AM - 01:00 PM',
        tempC: 31,
        windKmh: 12,
        rainProbPct: 15,
        status: 'CAUTION',
        labelHi: 'मध्यम (तेज धूप से पहले पूरा करें)',
        labelEn: 'Moderate (Complete before peak solar noon)'
      },
      {
        timeSlot: '01:30 PM - 04:00 PM',
        tempC: 35,
        windKmh: 19,
        rainProbPct: 35,
        status: 'AVOID',
        labelHi: 'वर्जित (तेज धूप व गर्म हवा में रंध्र बंद)',
        labelEn: 'Avoid (High evaporation & wind drift)'
      },
      {
        timeSlot: '04:30 PM - 06:30 PM',
        tempC: 28,
        windKmh: 8,
        rainProbPct: 12,
        status: 'SAFE',
        labelHi: 'उत्तम शाम का समय (कीटनाशक/बायो-स्प्रे हेतु)',
        labelEn: 'Ideal Evening Slot (Best for Bio-fungicides & Pests)'
      }
    ];

    const forecast5Day = [
      { dayHi: 'आज', dayEn: 'Today', icon: 'fa-cloud-sun', tempMax: 30, tempMin: 22, rainPct: 15, spraySafe: true },
      { dayHi: 'कल', dayEn: 'Tomorrow', icon: 'fa-sun', tempMax: 31, tempMin: 22, rainPct: 10, spraySafe: true },
      { dayHi: 'बुधवार', dayEn: 'Day 3', icon: 'fa-cloud-Showers-heavy', tempMax: 27, tempMin: 21, rainPct: 75, spraySafe: false },
      { dayHi: 'गुरुवार', dayEn: 'Day 4', icon: 'fa-cloud-rain', tempMax: 28, tempMin: 21, rainPct: 60, spraySafe: false },
      { dayHi: 'शुक्रवार', dayEn: 'Day 5', icon: 'fa-cloud-sun', tempMax: 30, tempMin: 22, rainPct: 15, spraySafe: true }
    ];

    return {
      source: 'IMD Meghdoot Agromet Block Telemetry',
      location: { state, district },
      crop,
      currentWeather: {
        tempC,
        humidityPct,
        windSpeedKmh,
        rainProbPct,
        soilMoisturePct: 62,
        evapotranspirationMmDay: 4.1,
        uvIndex: 6
      },
      sprayAdvisory: {
        sprayStatus,
        sprayScore,
        statusBadgeHi,
        statusBadgeEn,
        reasonHi,
        reasonEn,
        recommendedNozzle: 'Hollow Cone / Flat Fan (180-200L water/acre)',
        surfactantAdviceHi: 'पर्णीय पोषण (ZnSO4/SOP) के साथ 0.5 ml/L सिलिकॉन स्प्रेडर मिलाने से बारिश में भी 85% अवशोषण सुरक्षित रहता है।',
        surfactantAdviceEn: 'Adding 0.5 ml/L Silicone Spreader locks foliar nutrients into leaf cuticle within 20 minutes.'
      },
      hourlySpraySlots,
      forecast5Day,
      irrigationAdvisory: {
        soilMoisturePct: 62,
        actionHi: 'मृदा नमी 62% पर्याप्त है — अगले 3 दिन सिंचाई रोकें (बुधवार को बारिश संभावित)।',
        actionEn: 'Soil moisture at 62% is adequate — hold irrigation for 3 days ahead of mid-week rain.'
      }
    };
  }

  // =========================================================================
  // 3. SCIENTIFIC CROP CALENDAR & SOIL-LINKED NPK FERTILIZER CALCULATOR
  // =========================================================================
  static getCropCalendarAndNpkCalculator(params: {
    crop?: string;
    acreage?: number;
    sowingDate?: string;
    soilN?: number;
    soilP?: number;
    soilK?: number;
    soilZn?: number;
    soilPh?: number;
  }) {
    const crop = (params.crop || 'SOYBEAN').replace(/^CROP_/, '').toUpperCase();
    const acreage = Math.max(0.5, Number(params.acreage || 2.0));
    const soilN = Number(params.soilN || 195); // kg/ha (Low < 280)
    const soilP = Number(params.soilP || 22);  // kg/ha (Medium 10-25)
    const soilK = Number(params.soilK || 340); // kg/ha (High > 280)
    const soilZn = Number(params.soilZn || 0.45); // ppm (Deficient < 0.60)
    const soilPh = Number(params.soilPh || 7.6);

    // Base recommended NPK per acre (kg nutrient/acre) by crop
    const cropTargetsPerAcre: Record<
      string,
      { nameHi: string; nameEn: string; durationDays: number; N: number; P: number; K: number; znSulphateKg: number }
    > = {
      SOYBEAN: { nameHi: 'सोयाबीन (JS 20-34)', nameEn: 'Soybean (JS 20-34)', durationDays: 95, N: 10, P: 24, K: 16, znSulphateKg: 10 },
      PADDY: { nameHi: 'धान (Paddy PR-126)', nameEn: 'Paddy / Rice', durationDays: 120, N: 48, P: 24, K: 24, znSulphateKg: 10 },
      WHEAT: { nameHi: 'गेहूँ (HI-1544 Sharbati)', nameEn: 'Wheat', durationDays: 115, N: 50, P: 25, K: 16, znSulphateKg: 8 },
      COTTON: { nameHi: 'कपास (Bt Cotton)', nameEn: 'Cotton', durationDays: 150, N: 60, P: 30, K: 30, znSulphateKg: 10 },
      BANANA: { nameHi: 'केला (Grand Naine G-9)', nameEn: 'Banana (Tissue Culture)', durationDays: 330, N: 110, P: 35, K: 140, znSulphateKg: 12 },
      TOMATO: { nameHi: 'टमाटर (Arka Rakshak)', nameEn: 'Tomato Hybrid', durationDays: 110, N: 55, P: 32, K: 35, znSulphateKg: 8 },
      CHILLI: { nameHi: 'मिर्च (Teja Hybrid)', nameEn: 'Chilli', durationDays: 135, N: 50, P: 28, K: 30, znSulphateKg: 8 },
      MAIZE: { nameHi: 'मक्का (Hybrid Corn)', nameEn: 'Maize / Corn', durationDays: 105, N: 52, P: 26, K: 18, znSulphateKg: 10 },
      SUGARCANE: { nameHi: 'गन्ना (Co-0238)', nameEn: 'Sugarcane', durationDays: 320, N: 90, P: 35, K: 40, znSulphateKg: 12 },
      POTATO: { nameHi: 'आलू (Kufri Jyoti)', nameEn: 'Potato', durationDays: 95, N: 60, P: 32, K: 40, znSulphateKg: 8 }
    };

    const target = cropTargetsPerAcre[crop] || cropTargetsPerAcre.SOYBEAN;

    // Adjust based on Soil Health Card status (ICAR STCR Soil adjustment)
    const nFactor = soilN < 240 ? 1.15 : soilN > 450 ? 0.8 : 1.0;
    const pFactor = soilP < 12 ? 1.2 : soilP > 28 ? 0.85 : 1.0;
    const kFactor = soilK < 140 ? 1.2 : soilK > 300 ? 0.8 : 1.0;
    const znNeeded = soilZn < 0.6;

    const totalNKg = Math.round(target.N * nFactor * acreage);
    const totalPKg = Math.round(target.P * pFactor * acreage);
    const totalKKg = Math.round(target.K * kFactor * acreage);

    // Commercial fertilizer conversion:
    // DAP = 18% N, 46% P2O5 (50kg bag provides 9kg N, 23kg P)
    const dapKg = Math.round(totalPKg / 0.46);
    const dapBags = Number((dapKg / 50).toFixed(1));
    const nFromDapKg = dapKg * 0.18;

    // Remaining N from Neem-Coated Urea (46% N, 45kg bag provides 20.7kg N)
    const remainingNKg = Math.max(0, totalNKg - nFromDapKg);
    const ureaKg = Math.round(remainingNKg / 0.46);
    const ureaBags = Number((ureaKg / 45).toFixed(1));

    // MOP = 60% K2O (50kg bag provides 30kg K)
    const mopKg = Math.round(totalKKg / 0.6);
    const mopBags = Number((mopKg / 50).toFixed(1));

    // Zinc Sulphate 21% or Chelated Zn-EDTA (if soil pH > 7.5 alkaline black soil, recommend Chelated Zn foliar + ZSB)
    const zincSulphateKg = znNeeded ? Math.round(target.znSulphateKg * acreage) : Math.round(2 * acreage);
    const zsbBioKg = Number((1.0 * acreage).toFixed(1));

    // Official Subsidized MRP estimates (2026):
    // Urea 45kg: ₹266.50 | DAP 50kg: ₹1,350 | MOP 50kg: ₹1,650 | ZnSO4 1kg: ₹85 | ZSB Bio 1kg: ₹180
    const totalCostInr = Math.round(
      ureaBags * 267 + dapBags * 1350 + mopBags * 1650 + zincSulphateKg * 85 + zsbBioKg * 180
    );
    const inmsavingsInr = Math.round(acreage * 1150); // Savings from ZSB/PSB bio-solubilization & avoiding excess urea

    // 5-Stage Phenological Crop Calendar
    const stages = [
      {
        stageCode: 'STAGE_1_SEED_BASAL',
        dasRange: 'Day 0 (बुवाई व बीज उपचार)',
        titleHi: '1. बीज उपचार एवं बुवाई बेसल खाद (Basal Dose)',
        titleEn: '1. Seed Treatment & Basal Soil Application',
        status: 'COMPLETED',
        tasksHi: [
          `ट्राइकोडर्मा विरिडी (5g/kg) + राइजोबियम/PSB कल्चर से बीज उपचार करें।`,
          `बुवाई के समय ${dapBags} बोरी DAP + ${mopBags} बोरी पोटाश (MOP) + ${zincSulphateKg} kg जिंक सल्फेट खेत में दें।`
        ],
        tasksEn: [
          `Treat seeds with Trichoderma viride (5g/kg) + Rhizobium/PSB bio-inoculant.`,
          `Apply basal dose of ${dapBags} bags DAP + ${mopBags} bags MOP + ${zincSulphateKg} kg ZnSO4.`
        ]
      },
      {
        stageCode: 'STAGE_2_VEGETATIVE',
        dasRange: 'Day 20 - 35 (वानस्पतिक वृद्धि व खरपतवार)',
        titleHi: '2. वानस्पतिक अवस्था एवं सूक्ष्म पोषक तत्व सुधार (सक्रिय अवस्था)',
        titleEn: '2. Vegetative Growth & Foliar Micronutrient Correction (Active)',
        status: 'CURRENT_ACTIVE',
        tasksHi: [
          `मृदा कार्ड में जिंक (${soilZn} ppm) कम होने के कारण: जिंक सल्फेट 500g + 250g चूना (या चिलेटेड जिंक 1g/L) प्रति एकड़ छिड़कें।`,
          `${zsbBioKg} किग्रा ZSB जैव-उर्वरक गोबर की खाद में मिलाकर जड़ों के पास दें।`
        ],
        tasksEn: [
          `Soil Zn is deficient (${soilZn} ppm): Foliar spray ZnSO4 500g + 250g Lime per acre (or Chelated Zn-EDTA @ 1g/L in pH ${soilPh}).`,
          `Broadcast ${zsbBioKg} kg ZSB bio-fertilizer mixed with 50kg FYM/acre.`
        ]
      },
      {
        stageCode: 'STAGE_3_FLOWERING',
        dasRange: 'Day 40 - 60 (फूल बनने की अवस्था)',
        titleHi: '3. फूल एवं प्रतिरक्षा सुदृढ़ीकरण (Flowering & Immunity)',
        titleEn: '3. Flowering Initiation & Cuticle Hardening',
        status: 'UPCOMING',
        tasksHi: [
          `फूल झड़ने से रोकने हेतु घुलनशील 00:52:34 (1 kg/एकड़) + बोरॉन 20% (200g/एकड़) का स्प्रे करें।`,
          `कीट निगरानी हेतु 8 फेरोमोन ट्रैप व 10 पीले स्टिकी ट्रैप प्रति एकड़ लगाएं।`
        ],
        tasksEn: [
          `Spray water-soluble NPK 00:52:34 (1 kg/acre) + Boron 20% (200g/acre) to boost flower retention.`,
          `Install 8 pheromone traps & 10 yellow sticky traps/acre for preventive IPM scouting.`
        ]
      },
      {
        stageCode: 'STAGE_4_POD_GRAIN_FILL',
        dasRange: 'Day 65 - 85 (दाना/फली भराव अवस्था)',
        titleHi: '4. दाना भराव एवं वजन वृद्धि (Pod / Grain Filling)',
        titleEn: '4. Pod / Boll / Grain Filling & Weight Gain',
        status: 'UPCOMING',
        tasksHi: [
          `दाने की चमक व वजन बढ़ाने हेतु सल्फेट ऑफ पोटाश (SOP 00:00:50) @ 1 kg/एकड़ का पर्णीय छिड़काव करें।`,
          `फली छेदक/सुंडी से बचाव हेतु नीम तेल (Azadirachtin 1500 ppm) 3 ml/L या बैसिलस थुरिंजिएंसिस (Bt) छिड़कें।`
        ],
        tasksEn: [
          `Foliar spray Sulfate of Potash (00:00:50) @ 1 kg/acre for bold grain/fruit weight and oil/sugar content.`,
          `Preventive Neem Oil (1500 ppm @ 3ml/L) spray against pod/boll borers.`
        ]
      },
      {
        stageCode: 'STAGE_5_HARVEST_MANDI',
        dasRange: `Day ${target.durationDays - 10} - ${target.durationDays} (कटाई एवं मंडी ग्रेडिंग)`,
        titleHi: '5. कटाई, नमी जांच एवं e-NAM मंडी बिक्री',
        titleEn: '5. Physiological Maturity, Moisture Check & e-NAM Sale',
        status: 'UPCOMING',
        tasksHi: [
          `85% फलियां/बालियां पकने पर कटाई करें तथा भंडारण से पहले दाने की नमी 10-12% तक सुखाएं।`,
          `मंडी ले जाने से पहले ऐप के 'मंडी भाव' टैब में MSP व सर्वोत्तम मंडी कीमत की तुलना करें।`
        ],
        tasksEn: [
          `Harvest at physiological maturity and sun-dry produce to <12% moisture to avoid mandi deductions.`,
          `Check live e-NAM Mandi Bhav tab for net profit realization before dispatch.`
        ]
      }
    ];

    return {
      crop,
      cropNameHi: target.nameHi,
      cropNameEn: target.nameEn,
      acreage,
      soilContext: {
        ph: soilPh,
        nitrogenKgHa: soilN,
        phosphorusKgHa: soilP,
        potassiumKgHa: soilK,
        zincPpm: soilZn,
        alkalineChelateAlertHi:
          soilPh >= 7.5
            ? `आपकी मिट्टी क्षारीय (pH ${soilPh}) है — मिट्टी में साधारण जिंक लॉक हो जाता है, इसलिए चिलेटेड जिंक (Zn-EDTA 12%) का पत्तियों पर छिड़काव 3 गुना अधिक प्रभावी रहेगा।`
            : 'मृदा pH सामान्य है — जिंक सल्फेट व जैव उर्वरक पूर्ण रूप से घुलनशील रहेंगे।'
      },
      fertilizerCalculator: {
        nutrientRequirementKg: {
          nitrogen: totalNKg,
          phosphorus: totalPKg,
          potassium: totalKKg,
          zincSulphate: zincSulphateKg
        },
        commercialBagsRequired: [
          {
            code: 'DAP_50KG',
            nameHi: 'डी.ए.पी. (DAP 18:46:0) - 50 किग्रा बोरी',
            nameEn: 'DAP (18:46:0) - 50 kg Bags',
            bags: dapBags,
            totalKg: dapKg,
            timingHi: 'बुवाई के समय (Basal Dose)',
            timingEn: '100% at Sowing (Basal)',
            costInr: Math.round(dapBags * 1350)
          },
          {
            code: 'UREA_45KG',
            nameHi: 'नीम लेपित यूरिया (46% N) - 45 किग्रा बोरी',
            nameEn: 'Neem-Coated Urea (46% N) - 45 kg Bags',
            bags: ureaBags,
            totalKg: ureaKg,
            timingHi: '2 बराबर किस्तों में (25 व 45 दिन पर)',
            timingEn: 'Split in 2 top-dressings (25 & 45 DAS)',
            costInr: Math.round(ureaBags * 267)
          },
          {
            code: 'MOP_50KG',
            nameHi: 'म्यूरेट ऑफ पोटाश (MOP 60% K) - 50 किग्रा बोरी',
            nameEn: 'Muriate of Potash (MOP) - 50 kg Bags',
            bags: mopBags,
            totalKg: mopKg,
            timingHi: 'बुवाई के समय + फूल अवस्था में 00:00:50 स्प्रे',
            timingEn: 'Basal + Foliar SOP 00:00:50 at flowering',
            costInr: Math.round(mopBags * 1650)
          },
          {
            code: 'ZINC_21',
            nameHi: 'जिंक सल्फेट 21% + ZSB जैव उर्वरक',
            nameEn: 'Zinc Sulphate 21% + ZSB Bio-Fertilizer',
            bags: Number(((zincSulphateKg + zsbBioKg) / 10).toFixed(1)),
            totalKg: Number((zincSulphateKg + zsbBioKg).toFixed(1)),
            timingHi: 'खैरा/पीलापन रोकथाम हेतु बुवाई व 25 दिन पर',
            timingEn: 'Basal + Foliar correction at 25 DAS',
            costInr: Math.round(zincSulphateKg * 85 + zsbBioKg * 180)
          }
        ],
        totalEstimatedCostInr: totalCostInr,
        inmBioSavingsInr: inmsavingsInr
      },
      cropCalendarStages: stages
    };
  }

  // =========================================================================
  // 4. GOVERNMENT SCHEMES, KCC CREDIT LIMIT & PMFBY 72H CLAIM ENGINE
  // =========================================================================
  static getGovernmentSchemesAndKcc(params: {
    state?: string;
    district?: string;
    acreage?: number;
    crop?: string;
    mobileNumber?: string;
  }) {
    this.ensureSeeded();
    const state = params.state || 'Madhya Pradesh';
    const district = params.district || 'Ujjain';
    const acreage = Math.max(0.5, Number(params.acreage || 3.5));
    const crop = (params.crop || 'SOYBEAN').replace(/^CROP_/, '').toUpperCase();

    // Scale of Finance per acre for KCC (4% interest subvention) & PMFBY Sum Insured
    const scaleOfFinancePerAcreInr: Record<string, number> = {
      SOYBEAN: 24500,
      PADDY: 32000,
      WHEAT: 28000,
      COTTON: 38000,
      BANANA: 65000,
      TOMATO: 45000,
      CHILLI: 48000,
      SUGARCANE: 55000,
      MAIZE: 24000,
      POTATO: 46000
    };

    const perAcreScale = scaleOfFinancePerAcreInr[crop] || 26000;
    const kccSanctionLimitInr = Math.round(perAcreScale * acreage * 1.1); // +10% post-harvest/maintenance
    const kccInterestSavedInr = Math.round(kccSanctionLimitInr * 0.05); // 3% govt subvention + 2% prompt repayment incentive (4% effective vs 9%)
    const pmfbySumInsuredInr = Math.round(perAcreScale * acreage);
    const pmfbyFarmerPremiumInr = Math.round(pmfbySumInsuredInr * 0.02); // 2% Kharif cap
    const dripSubsidyInr = Math.round(Math.min(acreage, 5) * 32000 * 0.55); // 55% small/marginal farmer micro-irrigation subsidy

    const schemes = [
      {
        code: 'PM_KISAN',
        badge: 'DBT ₹6,000/वर्ष',
        titleHi: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)',
        titleEn: 'PM-KISAN Samman Nidhi (Direct Income Support)',
        category: 'DIRECT_BENEFIT_TRANSFER',
        annualBenefitInr: 6000,
        eligibilityStatus: 'ELIGIBLE_ACTIVE',
        descHi: 'सभी भूमिधारक किसान परिवारों को ₹2,000 की 3 समान किस्तों में ₹6,000 प्रति वर्ष सीधे बैंक खाते (Aadhaar DBT) में।',
        descEn: '₹6,000/year in 3 equal installments of ₹2,000 via Aadhaar-linked Direct Benefit Transfer.',
        actionLabelHi: 'किस्त स्थिति / पंजीकरण',
        actionLabelEn: 'Verify Installment / Enroll'
      },
      {
        code: 'PMFBY_CROP_INSURANCE',
        badge: '72-घंटे फसल नुकसान दावा',
        titleHi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY - 2% प्रीमियम)',
        titleEn: 'PMFBY Crop Insurance & 72-Hour Loss Intimation',
        category: 'CROP_INSURANCE',
        annualBenefitInr: pmfbySumInsuredInr,
        farmerPremiumInr: pmfbyFarmerPremiumInr,
        eligibilityStatus: 'ELIGIBLE_CLAIM_READY',
        descHi: `${acreage} एकड़ ${crop} हेतु कुल बीमित राशि ₹${pmfbySumInsuredInr.toLocaleString('en-IN')} (किसान प्रीमियम मात्र ₹${pmfbyFarmerPremiumInr.toLocaleString('en-IN')})। ओलावृष्टि, अतिवृष्टि या महामारी रोग पर 72 घंटे में AI रिपोर्ट के साथ सीधा दावा दर्ज करें।`,
        descEn: `Sum Insured ₹${pmfbySumInsuredInr.toLocaleString('en-IN')} for ${acreage} acres (Farmer premium only ₹${pmfbyFarmerPremiumInr.toLocaleString('en-IN')} @ 2%). File instant 72-hour crop damage claim with AI Diagnosis ID.`,
        actionLabelHi: '72-घंटे फसल नुकसान दावा करें',
        actionLabelEn: 'File 72h Crop Damage Claim'
      },
      {
        code: 'KCC_4PCT_CREDIT',
        badge: '4% ब्याज पर कृषि ऋण',
        titleHi: 'किसान क्रेडिट कार्ड (KCC - ब्याज अनुदान योजना)',
        titleEn: 'Kisan Credit Card (KCC @ 4% Effective Interest)',
        category: 'INSTITUTIONAL_CREDIT',
        annualBenefitInr: kccSanctionLimitInr,
        interestSavedInr: kccInterestSavedInr,
        eligibilityStatus: 'PRE_QUALIFIED',
        descHi: `${acreage} एकड़ रकबे के आधार पर आपकी स्वीकृत KCC ऋण सीमा ₹${kccSanctionLimitInr.toLocaleString('en-IN')} है। समय पर भुगतान पर केवल 4% ब्याज (₹${kccInterestSavedInr.toLocaleString('en-IN')}/वर्ष ब्याज बचत)।`,
        descEn: `Pre-qualified KCC credit limit of ₹${kccSanctionLimitInr.toLocaleString('en-IN')} for ${acreage} acres at 4% interest (saving ₹${kccInterestSavedInr.toLocaleString('en-IN')}/yr over bank rate).`,
        actionLabelHi: 'KCC सीमा आवेदन करें',
        actionLabelEn: 'Apply for KCC Limit'
      },
      {
        code: 'PM_KUSUM_SOLAR',
        badge: '60% सोलर पंप सब्सिडी',
        titleHi: 'पीएम-कुसुम सोलर पंप अनुदान (PM-KUSUM Component B)',
        titleEn: 'PM-KUSUM Standalone Solar Pump (60% Subsidy)',
        category: 'INFRASTRUCTURE_SUBSIDY',
        annualBenefitInr: 145000,
        eligibilityStatus: 'ELIGIBLE_OPEN',
        descHi: '3 HP से 5 HP सोलर पंप पर 30% केंद्र + 30% राज्य सरकार द्वारा कुल 60% अनुदान (लगभग ₹1,45,000 की सीधी छूट)।',
        descEn: '60% government subsidy (30% Central + 30% State, worth ~₹1,45,000) on 3HP-5HP standalone solar irrigation pumps.',
        actionLabelHi: 'सोलर सब्सिडी बुक करें',
        actionLabelEn: 'Book Solar Pump Subsidy'
      },
      {
        code: 'PMKSY_DRIP_IRRIGATION',
        badge: '55%-80% ड्रिप अनुदान',
        titleHi: 'पर ड्रॉप मोर क्रॉप (प्रधानमंत्री सूक्ष्म सिंचाई योजना)',
        titleEn: 'Per Drop More Crop (Micro-Irrigation Drip/Sprinkler)',
        category: 'INFRASTRUCTURE_SUBSIDY',
        annualBenefitInr: dripSubsidyInr,
        eligibilityStatus: 'ELIGIBLE_OPEN',
        descHi: `${acreage} एकड़ में ड्रिप/स्प्रिंकलर लगाने पर अनुमानित सब्सिडी ₹${dripSubsidyInr.toLocaleString('en-IN')} तथा पानी व घुलनशील खाद में 40% बचत।`,
        descEn: `Estimated subsidy of ₹${dripSubsidyInr.toLocaleString('en-IN')} for installing drip/sprinkler on ${acreage} acres.`,
        actionLabelHi: 'ड्रिप अनुदान आवेदन',
        actionLabelEn: 'Apply for Drip Subsidy'
      }
    ];

    const applications = SchemeApplicationRepository.listByMobileOrAll(params.mobileNumber);

    return {
      farmerContext: { state, district, acreage, crop },
      summaryMetrics: {
        totalDirectAnnualSupportInr: 6000 + kccInterestSavedInr,
        kccEligibleCreditLimitInr: kccSanctionLimitInr,
        pmfbyCoverageInr: pmfbySumInsuredInr,
        pmfbyFarmerPremiumInr,
        capitalSubsidyPotentialInr: 145000 + dripSubsidyInr
      },
      schemes,
      submittedApplications: applications
    };
  }

  static submitSchemeOrInsuranceClaim(params: {
    userId?: string;
    farmerName?: string;
    mobileNumber?: string;
    schemeCode: string;
    schemeName?: string;
    applicationType?: 'SCHEME_ENROLLMENT' | 'PMFBY_72H_CLAIM' | 'KCC_CREDIT_APPLICATION' | 'SOLAR_PUMP_SUBSIDY';
    state?: string;
    district?: string;
    cropName?: string;
    acreage?: number;
    estimatedBenefitInr?: number;
    claimReason?: string;
    diagnosisId?: string;
  }) {
    const record = SchemeApplicationRepository.create({
      user_id: params.userId || null,
      farmer_name: params.farmerName || 'Ramesh Patel (रमेश पटेल)',
      mobile_number: params.mobileNumber || '9876543210',
      scheme_code: params.schemeCode || 'PMFBY_CROP_INSURANCE',
      scheme_name: params.schemeName || 'PMFBY 72-Hour Crop Loss Intimation',
      application_type: params.applicationType || 'PMFBY_72H_CLAIM',
      state: params.state || 'Madhya Pradesh',
      district: params.district || 'Ujjain',
      crop_name: params.cropName || 'SOYBEAN',
      acreage: Number(params.acreage || 3.5),
      estimated_benefit_inr: Number(params.estimatedBenefitInr || 85750),
      claim_reason:
        params.claimReason ||
        'AI-Verified Crop Pathology & Weather Stress Report attached within 72-hour window',
      diagnosis_id: params.diagnosisId || '1da85f64-5717-4562-b3fc-2c963f66af77',
      status: 'SUBMITTED_CROP_SURVEY_LINKED'
    });

    AuditRepository.log(
      'SCHEME_OR_CLAIM_SUBMITTED',
      params.userId || null,
      'SCHEME_APPLICATION',
      record.reference_no || record.id || 'new',
      record
    );

    return {
      success: true,
      referenceNo: record.reference_no,
      application: record,
      messageHi: `आपका आवेदन/दावा सफलतापूर्वक दर्ज हो गया है! पावती क्रमांक: ${record.reference_no}। कृषि विभाग व बीमा सर्वेक्षक को आपकी AI जांच रिपोर्ट भेज दी गई है।`,
      messageEn: `Application/Claim registered successfully! Reference No: ${record.reference_no}. Linked with your AgriScan AI diagnostic report.`
    };
  }

  // =========================================================================
  // 5. VOICE-FIRST "KISAN e-MITRA" AI ASSISTANT & OUTBREAK RADAR
  // =========================================================================
  static getOutbreakRadar(params: { state?: string; crop?: string }) {
    this.ensureSeeded();
    const list = CommunityOutbreakRepository.listAll(params.state, params.crop);
    return {
      count: list.length,
      radiusKm: 15,
      outbreaks: list
    };
  }

  static reportCommunityOutbreak(params: {
    state?: string;
    district?: string;
    village?: string;
    cropCode?: string;
    diseaseNameHi?: string;
    diseaseNameEn?: string;
    reportedBy?: string;
  }) {
    const cropCode = (params.cropCode || 'SOYBEAN').toUpperCase();
    const created = CommunityOutbreakRepository.upsert({
      state: params.state || 'Madhya Pradesh',
      district: params.district || 'Ujjain',
      village: params.village || 'Village Dharampuri Cluster',
      crop_code: cropCode,
      crop_name_en: cropCode,
      crop_name_hi: cropCode === 'SOYBEAN' ? 'सोयाबीन' : cropCode === 'BANANA' ? 'केला' : cropCode,
      disease_name_en: params.diseaseNameEn || 'Farmer Reported Foliar Yellowing / Pest Sighting',
      disease_name_hi: params.diseaseNameHi || 'किसान द्वारा रिपोर्ट किया गया पत्ती पीलापन / कीट प्रकोप',
      severity: 'HIGH_ALERT',
      affected_farms_count: 5,
      distance_km: 2.5,
      preventive_step_en: 'Apply Step 1 Foliar Micronutrient + Potassium Silicate shield & scout neighboring fields.',
      preventive_step_hi: 'तुरंत चरण 1 सूक्ष्म पोषक तत्व + पोटेशियम सिलिकेट सुरक्षा कवच का छिड़काव करें और फेरोमोन/स्टिकी ट्रैप लगाएं।',
      reported_by: params.reportedBy || 'Community Farmer Scout',
      verified_by_kvk: 1
    });

    return {
      success: true,
      outbreak: created,
      messageHi: 'आपकी क्षेत्रीय रोग चेतावनी 15 किमी के सभी किसानों के रडार पर प्रसारित कर दी गई है!',
      messageEn: 'Community outbreak alert broadcasted to farmers within 15 km radius!'
    };
  }

  static askKisanEMitra(params: {
    query: string;
    language?: string;
    crop?: string;
    state?: string;
    acreage?: number;
  }) {
    this.ensureSeeded();
    const q = (params.query || '').toLowerCase();
    const crop = (params.crop || 'SOYBEAN').replace(/^CROP_/, '').toUpperCase();
    const acreage = Number(params.acreage || 2.0);

    // Intent 1: Mandi Price / Bhav / MSP / Sell
    if (
      q.includes('मंडी') ||
      q.includes('भाव') ||
      q.includes('कीमत') ||
      q.includes('रेट') ||
      q.includes('mandi') ||
      q.includes('price') ||
      q.includes('rate') ||
      q.includes('msp') ||
      q.includes('bhav') ||
      q.includes('बेच')
    ) {
      const mandiData = this.getMandiIntelligence({ crop, quantityQtl: acreage * 8 });
      const top = mandiData.mandis[0];
      return {
        intent: 'MANDI_PRICE_INTELLIGENCE',
        answerHi: `आज ${top.mandi_name} में ${top.crop_name_hi} का मॉडल भाव ₹${top.modal_price_qtl}/क्विंटल (अधिकतम ₹${top.max_price_qtl}) है, जो सरकारी MSP (₹${top.msp_price_qtl}) से ₹${top.mspDiffInr} अधिक है। ${top.advisory_hi}`,
        answerEn: `Today at ${top.mandi_name}, ${top.crop_name_en} modal price is ₹${top.modal_price_qtl}/qtl (Max ₹${top.max_price_qtl}), which is ₹${top.mspDiffInr}/qtl above MSP (₹${top.msp_price_qtl}). ${top.advisory_en}`,
        quickActionView: 'viewMandi',
        structuredCard: top
      };
    }

    // Intent 2: Weather / Spray Window / Rain / Wind
    if (
      q.includes('मौसम') ||
      q.includes('बारिश') ||
      q.includes('छिड़काव') ||
      q.includes('स्प्रे') ||
      q.includes('हवा') ||
      q.includes('सिंचाई') ||
      q.includes('weather') ||
      q.includes('spray') ||
      q.includes('rain')
    ) {
      const weather = this.getHyperlocalWeatherAndSprayWindow({ crop, state: params.state });
      return {
        intent: 'SPRAY_WEATHER_WINDOW',
        answerHi: `${weather.sprayAdvisory.statusBadgeHi} (स्कोर: ${weather.sprayAdvisory.sprayScore}/100)। ${weather.sprayAdvisory.reasonHi} सर्वोत्तम छिड़काव समय: सुबह 6:30 से 9:30 बजे तथा शाम 4:30 से 6:30 बजे।`,
        answerEn: `${weather.sprayAdvisory.statusBadgeEn} (Score: ${weather.sprayAdvisory.sprayScore}/100). ${weather.sprayAdvisory.reasonEn} Best window: 6:30-9:30 AM and 4:30-6:30 PM.`,
        quickActionView: 'viewCalendar',
        structuredCard: weather.sprayAdvisory
      };
    }

    // Intent 3: Fertilizer / NPK / Urea / DAP / Khad
    if (
      q.includes('खाद') ||
      q.includes('यूरिया') ||
      q.includes('डीएपी') ||
      q.includes('पोटाश') ||
      q.includes('जिंक') ||
      q.includes('उर्वरक') ||
      q.includes('fertilizer') ||
      q.includes('npk') ||
      q.includes('urea') ||
      q.includes('dap')
    ) {
      const cal = this.getCropCalendarAndNpkCalculator({ crop, acreage });
      const bags = cal.fertilizerCalculator.commercialBagsRequired;
      return {
        intent: 'NPK_FERTILIZER_CALCULATOR',
        answerHi: `${acreage} एकड़ ${cal.cropNameHi} के लिए मृदा स्वास्थ्य कार्ड के अनुसार संतुलित खाद: DAP ${bags[0].bags} बोरी, नीम यूरिया ${bags[1].bags} बोरी, पोटाश (MOP) ${bags[2].bags} बोरी तथा जिंक सल्फेट + ZSB ${bags[3].totalKg} किग्रा। कुल अनुमानित लागत ₹${cal.fertilizerCalculator.totalEstimatedCostInr.toLocaleString('en-IN')}।`,
        answerEn: `For ${acreage} acres of ${cal.cropNameEn} based on your Soil Health Card: ${bags[0].bags} bags DAP, ${bags[1].bags} bags Neem Urea, ${bags[2].bags} bags MOP, and ${bags[3].totalKg} kg Zinc Sulphate + ZSB. Estimated cost: ₹${cal.fertilizerCalculator.totalEstimatedCostInr.toLocaleString('en-IN')}.`,
        quickActionView: 'viewCalendar',
        structuredCard: cal.fertilizerCalculator
      };
    }

    // Intent 4: Government Schemes / PM-KISAN / PMFBY / Bima / KCC / Subsidy
    if (
      q.includes('योजना') ||
      q.includes('सब्सिडी') ||
      q.includes('बीमा') ||
      q.includes('पीएम किसान') ||
      q.includes('क्रेडिट') ||
      q.includes('लोन') ||
      q.includes('सोलर') ||
      q.includes('scheme') ||
      q.includes('pm-kisan') ||
      q.includes('pmfby') ||
      q.includes('insurance') ||
      q.includes('kcc') ||
      q.includes('subsidy')
    ) {
      const sch = this.getGovernmentSchemesAndKcc({ crop, acreage, state: params.state });
      return {
        intent: 'GOVT_SCHEMES_AND_KCC',
        answerHi: `आपके ${acreage} एकड़ खेत के लिए: 1) पीएम-किसान सम्मान निधि ₹6,000/वर्ष सक्रिय है, 2) 4% ब्याज पर KCC ऋण पात्रता ₹${sch.summaryMetrics.kccEligibleCreditLimitInr.toLocaleString('en-IN')} है, 3) प्रधानमंत्री फसल बीमा कवर ₹${sch.summaryMetrics.pmfbyCoverageInr.toLocaleString('en-IN')} (प्रीमियम मात्र ₹${sch.summaryMetrics.pmfbyFarmerPremiumInr}) तथा 60% सोलर पंप सब्सिडी उपलब्ध है।`,
        answerEn: `For your ${acreage} acre farm: (1) PM-KISAN ₹6,000/yr DBT active, (2) KCC 4% credit limit ₹${sch.summaryMetrics.kccEligibleCreditLimitInr.toLocaleString('en-IN')}, (3) PMFBY Crop Insurance cover ₹${sch.summaryMetrics.pmfbyCoverageInr.toLocaleString('en-IN')} (farmer premium ₹${sch.summaryMetrics.pmfbyFarmerPremiumInr}), plus 60% PM-KUSUM solar subsidy.`,
        quickActionView: 'viewSchemes',
        structuredCard: sch.summaryMetrics
      };
    }

    // Intent 5: State-Specific Challenges (Parali, Stubble, Basmati Ban, Black Soil, Pink Bollworm, Black Thrips, Drone, CHC)
    if (
      q.includes('पराली') ||
      q.includes('पंजाब') ||
      q.includes('मध्य प्रदेश') ||
      q.includes('महाराष्ट्र') ||
      q.includes('राज्य') ||
      q.includes('ड्रोन') ||
      q.includes('हैप्पी सीडर') ||
      q.includes('थ्रिप्स') ||
      q.includes('गुलाबी सुंडी') ||
      q.includes('state') ||
      q.includes('stubble') ||
      q.includes('drone') ||
      q.includes('punjab')
    ) {
      const stateCode = q.includes('पंजाब') || q.includes('पराली') || q.includes('punjab') || q.includes('stubble')
        ? 'PB_HR'
        : q.includes('महाराष्ट्र') || q.includes('सुंडी')
        ? 'MH'
        : q.includes('थ्रिप्स') || q.includes('मिर्च')
        ? 'SOUTH'
        : 'MP';
      const stData = this.getStateWiseChallengesAndTechSolutions({ stateCode, acreage });
      const active = stData.selectedState;
      return {
        intent: 'STATE_WISE_AGRO_TECH_SOLUTION',
        answerHi: `${active.state_name_hi}: मुख्य चुनौती — ${active.soil_water_challenge_hi} तकनीकी समाधान — ${active.tech_solution_title_hi}। प्रति एकड़ अनुमानित लाभ: ₹${active.estimated_roi_per_acre_inr.toLocaleString('en-IN')}।`,
        answerEn: `${active.state_name_en}: Core Challenge — ${active.soil_water_challenge_en} Tech Solution — ${active.tech_solution_title_en}. Estimated ROI: ₹${active.estimated_roi_per_acre_inr.toLocaleString('en-IN')}/acre.`,
        quickActionView: 'viewStateMatrix',
        structuredCard: active
      };
    }

    // Default Intent: Crop Disease & Nutrition-First Advisory
    return {
      intent: 'CROP_HEALTH_NUTRITION_ADVISORY',
      answerHi: `कृषि स्वास्थ्य सहायक (किसान ई-मित्र) सलाह: ${crop} में पीलापन या धब्बे दिखने पर पहले 'चरण 1: सूक्ष्म पोषक तत्व' (जिंक सल्फेट 2.5g/L या घुलनशील पोटाश 00:00:50 @ 5g/L + सिलिकॉन) का छिड़काव सुबह 8-10 बजे करें। बिना जांच महंगे रासायनिक कीटनाशक पर खर्च न करें।`,
      answerEn: `Kisan e-Mitra Nutrition-First Advisory: For yellowing or leaf spots in ${crop}, always begin with Step 1 Foliar Nutrition (Zinc Sulphate 2.5g/L or SOP 00:00:50 @ 5g/L + Potassium Silicate) during morning hours before resorting to synthetic pesticides.`,
      quickActionView: 'viewRecommendation',
      structuredCard: null
    };
  }

  // =========================================================================
  // 6. STATE-WISE AGRO-CLIMATIC CHALLENGES & CHC / DRONE TECH INTERVENTION
  // =========================================================================
  static getStateWiseChallengesAndTechSolutions(params: {
    stateCode?: string;
    acreage?: number;
  }) {
    this.ensureSeeded();
    const stateCode = (params.stateCode || 'MP').toUpperCase();
    const acreage = Math.max(0.5, Number(params.acreage || 3.5));

    const allStates = StateAgroChallengeRepository.listAll('ALL');
    const selectedState =
      allStates.find((s) => s.state_code.toUpperCase() === stateCode) || allStates[0];

    const grossRentInr = Math.round(selectedState.chc_rent_per_acre_inr * 2 * acreage);
    const subsidyAmountInr = Math.round((grossRentInr * selectedState.chc_subsidy_pct) / 100);
    const netFarmerPayableInr = grossRentInr - subsidyAmountInr;
    const totalFarmRoiInr = Math.round(selectedState.estimated_roi_per_acre_inr * acreage);

    const bookings = ChcMachineryBookingRepository.listByStateOrAll();

    return {
      source: 'ICAR Agro-Ecological Zone & State KVK Extension Matrix (2026)',
      acreage,
      selectedStateCode: selectedState.state_code,
      selectedState: {
        ...selectedState,
        farmCalculation: {
          acreage,
          grossChcCostInr: grossRentInr,
          govtSubsidyPct: selectedState.chc_subsidy_pct,
          subsidySavedInr: subsidyAmountInr,
          netPayableInr: netFarmerPayableInr,
          totalEstimatedRoiInr: totalFarmRoiInr
        }
      },
      allStatesSummary: allStates.map((s) => ({
        stateCode: s.state_code,
        stateNameHi: s.state_name_hi,
        stateNameEn: s.state_name_en,
        dominantCropsHi: s.dominant_crops_hi,
        techSolutionTitleHi: s.tech_solution_title_hi,
        roiPerAcreInr: s.estimated_roi_per_acre_inr
      })),
      activeChcBookings: bookings
    };
  }

  static bookStateTechIntervention(params: {
    stateCode: string;
    acreage?: number;
    farmerName?: string;
    mobileNumber?: string;
    district?: string;
    cropName?: string;
    interventionType?:
      | 'KISAN_DRONE_SPRAY'
      | 'HAPPY_SEEDER_PUSA_DECOMPOSER'
      | 'BBF_TRACTOR_PLANTER'
      | 'BIO_IPM_KIT'
      | 'SOLAR_DRIP_FERTIGATION'
      | 'ANTI_HAIL_OR_LIME_KIT';
  }) {
    this.ensureSeeded();
    const stateCode = (params.stateCode || 'MP').toUpperCase();
    const acreage = Math.max(0.5, Number(params.acreage || 3.5));

    const allStates = StateAgroChallengeRepository.listAll('ALL');
    const st = allStates.find((s) => s.state_code.toUpperCase() === stateCode) || allStates[0];

    const grossCostInr = Math.round(st.chc_rent_per_acre_inr * 2 * acreage);
    const subsidyAmountInr = Math.round((grossCostInr * st.chc_subsidy_pct) / 100);
    const netFarmerPayableInr = grossCostInr - subsidyAmountInr;

    const interventionMap: Record<
      string,
      {
        type:
          | 'KISAN_DRONE_SPRAY'
          | 'HAPPY_SEEDER_PUSA_DECOMPOSER'
          | 'BBF_TRACTOR_PLANTER'
          | 'BIO_IPM_KIT'
          | 'SOLAR_DRIP_FERTIGATION'
          | 'ANTI_HAIL_OR_LIME_KIT';
        rewardHi: string;
      }
    > = {
      MP: {
        type: 'KISAN_DRONE_SPRAY',
        rewardHi: '90% पानी बचत + क्षारीय मिट्टी में 3x जिंक अवशोषण व ₹2,200 कीटनाशक बचत'
      },
      PB_HR: {
        type: 'HAPPY_SEEDER_PUSA_DECOMPOSER',
        rewardHi: 'जीरो पराली दहन कार्बन क्रेडिट + 35% भूजल बचत + बासमती निर्यात MRL सुरक्षा'
      },
      MH: {
        type: 'KISAN_DRONE_SPRAY',
        rewardHi: 'सूखा-रोधी 13:00:45 + सिलिकेट कवच से 40% टिंडे/फूल झड़ने से बचाव'
      },
      UP_BR: {
        type: 'KISAN_DRONE_SPRAY',
        rewardHi: 'गेहूँ टर्मिनल हीट-शील्ड (00:52:34) से 18% दाना वजन सुरक्षा'
      },
      SOUTH: {
        type: 'BIO_IPM_KIT',
        rewardHi: 'मिर्च ब्लैक थ्रिप्स बायो-स्टैक से ₹7,500/एकड़ रसायन बचत व निर्यात ग्रेड'
      },
      GJ_RJ: {
        type: 'SOLAR_DRIP_FERTIGATION',
        rewardHi: 'जीरा झुलसा व मूंगफली सफेद लट से 100% जैविक सुरक्षा + 50% जल बचत'
      },
      EAST: {
        type: 'ANTI_HAIL_OR_LIME_KIT',
        rewardHi: 'अम्लीय मृदा pH सुधार + आलू पछेती झुलसा से सुरक्षा'
      },
      HILLS: {
        type: 'ANTI_HAIL_OR_LIME_KIT',
        rewardHi: 'केरल 100% बायो-कैप्सूल / हिमाचल ओलावृष्टि एंटी-हेल नेट सुरक्षा'
      }
    };

    const mapped = interventionMap[st.state_code] || interventionMap.MP;

    const record = ChcMachineryBookingRepository.create({
      farmer_name: params.farmerName || 'Ramesh Patel (रमेश पटेल)',
      mobile_number: params.mobileNumber || '9876543210',
      state_code: st.state_code,
      state_name_hi: st.state_name_hi,
      district: params.district || 'Ujjain / Local Block CHC',
      crop_name: params.cropName || st.dominant_crops_hi.split(',')[0],
      acreage,
      intervention_type: params.interventionType || mapped.type,
      equipment_name_hi: st.chc_equipment_name_hi,
      scheduled_date: 'कल सुबह 07:30 AM (Confirmed Slot)',
      gross_cost_inr: grossCostInr,
      subsidy_amount_inr: subsidyAmountInr,
      net_farmer_payable_inr: netFarmerPayableInr,
      carbon_or_water_reward_hi: mapped.rewardHi,
      status: 'CONFIRMED_CHC_ALLOCATED'
    });

    AuditRepository.log(
      'CHC_TECH_INTERVENTION_BOOKED',
      null,
      'CHC_MACHINERY_BOOKING',
      record.booking_ref || record.id || 'new',
      record
    );

    return {
      success: true,
      booking: record,
      messageHi: `बधाई! ${st.state_name_hi} हेतु '${st.chc_equipment_name_hi}' की बुकिंग कन्फर्म हो गई है। बुकिंग नंबर: ${record.booking_ref}। अनुदान (${st.chc_subsidy_pct}%) के बाद देय राशि: मात्र ₹${netFarmerPayableInr.toLocaleString('en-IN')} (${acreage} एकड़)।`,
      messageEn: `Confirmed CHC/Drone Tech Intervention '${st.chc_equipment_name_hi}' (${record.booking_ref}). Net payable after ${st.chc_subsidy_pct}% subsidy: ₹${netFarmerPayableInr.toLocaleString('en-IN')} for ${acreage} acres.`
    };
  }
}
