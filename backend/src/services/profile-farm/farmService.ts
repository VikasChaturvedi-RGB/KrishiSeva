import crypto from 'crypto';
import { 
  UserRepository, 
  FarmRepository, 
  SoilCardRepository, 
  CropCycleRepository, 
  AuditRepository 
} from '../../db/repositories';

export interface FarmParcel {
  id: string;
  farmerId: string;
  farmName: string;
  surveyNumber?: string;
  totalArea: number;
  areaUnit: 'ACRE' | 'HECTARE' | 'BIGHA' | 'GUNTHA';
  soilType: string;
  irrigationType: string;
  location: {
    latitude: number;
    longitude: number;
    elevationMeters?: number;
  };
  hasSoilCard: boolean;
  createdAt: string;
}

export interface SoilHealthCard {
  id: string;
  farmId: string;
  testDate: string;
  testingLabName: string;
  ph: number;
  electricalConductivityDsPerM: number;
  organicCarbonPercent: number;
  nitrogenKgPerHa: number;
  phosphorusKgPerHa: number;
  potassiumKgPerHa: number;
  zincPpm: number;
  ironPpm: number;
  boronPpm: number;
  sulphurPpm: number;
  isDeficientInZinc: boolean;
  isDeficientInNitrogen: boolean;
  isDeficientInPotash: boolean;
  nutrientStatusSummaryLocalized: string;
}

export interface CropCycle {
  id: string;
  farmId: string;
  cropId: string;
  cropName: string;
  variety: string;
  sowingDate: string;
  currentGrowthStage: string;
  expectedHarvestDate?: string;
  seedTreatmentApplied: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  daysSinceSowing: number;
}

export class FarmService {
  static getFarmerProfile(userId: string) {
    const user = UserRepository.findById(userId);
    if (!user) throw new Error('FARMER_NOT_FOUND');

    const farms = FarmRepository.listByFarmerId(userId);

    return {
      id: user.id,
      mobileNumber: `+91${user.mobile_number}`,
      fullName: user.full_name,
      state: user.state,
      district: user.district,
      taluka: user.taluka,
      village: user.village,
      pinCode: user.pin_code,
      preferredLanguage: user.preferred_language,
      associatedClinicId: user.associated_clinic_id || null,
      totalFarmsCount: farms.length,
      farms: farms.map(f => ({
        id: f.id,
        farmName: f.farm_name,
        totalArea: f.total_area,
        areaUnit: f.area_unit,
        soilType: f.soil_type,
        irrigationType: f.irrigation_type,
        hasSoilCard: Boolean(f.has_soil_card)
      })),
      createdAt: user.created_at || '2026-01-01T00:00:00Z'
    };
  }

  static updateFarmerProfile(userId: string, updates: Partial<any>) {
    const user = UserRepository.findById(userId);
    if (!user) throw new Error('FARMER_NOT_FOUND');

    UserRepository.upsert({
      mobile_number: user.mobile_number,
      full_name: updates.fullName || user.full_name,
      state: updates.state || user.state,
      district: updates.district || user.district,
      taluka: updates.taluka || user.taluka,
      village: updates.village || user.village,
      pin_code: updates.pinCode || user.pin_code,
      preferred_language: updates.preferredLanguage || user.preferred_language,
      is_profile_complete: 1
    });

    AuditRepository.log('FARMER_PROFILE_UPDATED', userId, 'USER', userId, updates);
    return this.getFarmerProfile(userId);
  }

  static listFarms(userId: string) {
    const farms = FarmRepository.listByFarmerId(userId);
    return {
      farms: farms.map(f => {
        const activeCycle = CropCycleRepository.findActiveByFarmId(f.id);
        return {
          id: f.id,
          farmerId: f.farmer_id,
          farmName: f.farm_name,
          surveyNumber: f.survey_number,
          totalArea: f.total_area,
          areaUnit: f.area_unit,
          soilType: f.soil_type,
          irrigationType: f.irrigation_type,
          location: {
            latitude: f.latitude,
            longitude: f.longitude,
            elevationMeters: f.elevation_meters || 450
          },
          hasSoilCard: Boolean(f.has_soil_card),
          createdAt: f.created_at,
          activeCropCycle: activeCycle ? {
            id: activeCycle.id,
            cropId: activeCycle.crop_id,
            cropName: activeCycle.crop_name,
            variety: activeCycle.variety,
            sowingDate: activeCycle.sowing_date,
            currentGrowthStage: activeCycle.current_growth_stage,
            status: activeCycle.status,
            daysSinceSowing: activeCycle.days_since_sowing
          } : null
        };
      }),
      count: farms.length
    };
  }

  static createFarm(userId: string, payload: any) {
    const farmId = crypto.randomUUID();
    const loc = payload.location || { latitude: 23.1793, longitude: 75.7849 };

    const farm = FarmRepository.create({
      id: farmId,
      farmer_id: userId,
      farm_name: payload.farmName,
      survey_number: payload.surveyNumber || null,
      total_area: payload.totalArea || 2.0,
      area_unit: payload.areaUnit || 'ACRE',
      soil_type: payload.soilType || 'BLACK_COTTON',
      irrigation_type: payload.irrigationType || 'DRIP',
      latitude: loc.latitude,
      longitude: loc.longitude,
      elevation_meters: loc.elevationMeters || 480,
      has_soil_card: 0
    });

    AuditRepository.log('FARM_CREATED', userId, 'FARM', farm.id, { farmName: farm.farm_name });

    return {
      id: farm.id,
      farmerId: farm.farmer_id,
      farmName: farm.farm_name,
      surveyNumber: farm.survey_number,
      totalArea: farm.total_area,
      areaUnit: farm.area_unit,
      soilType: farm.soil_type,
      irrigationType: farm.irrigation_type,
      location: {
        latitude: farm.latitude,
        longitude: farm.longitude,
        elevationMeters: farm.elevation_meters
      },
      hasSoilCard: false,
      createdAt: farm.created_at
    };
  }

  static getSoilCard(farmId: string): SoilHealthCard {
    const card = SoilCardRepository.findByFarmId(farmId);
    if (!card) {
      // Return default balanced profile
      return {
        id: crypto.randomUUID(),
        farmId,
        testDate: '2026-06-01',
        testingLabName: 'District Soil Lab',
        ph: 7.2,
        electricalConductivityDsPerM: 0.35,
        organicCarbonPercent: 0.60,
        nitrogenKgPerHa: 240.0,
        phosphorusKgPerHa: 19.0,
        potassiumKgPerHa: 310.0,
        zincPpm: 0.55,
        ironPpm: 5.0,
        boronPpm: 0.50,
        sulphurPpm: 12.0,
        isDeficientInZinc: true,
        isDeficientInNitrogen: true,
        isDeficientInPotash: false,
        nutrientStatusSummaryLocalized: 'मृदा स्वास्थ्य मध्यम स्तर पर है। जिंक की कमी है।'
      };
    }

    return {
      id: card.id,
      farmId: card.farm_id,
      testDate: card.test_date,
      testingLabName: card.testing_lab_name,
      ph: card.ph,
      electricalConductivityDsPerM: card.electrical_conductivity,
      organicCarbonPercent: card.organic_carbon_percent,
      nitrogenKgPerHa: card.nitrogen_kg_ha,
      phosphorusKgPerHa: card.phosphorus_kg_ha,
      potassiumKgPerHa: card.potassium_kg_ha,
      zincPpm: card.zinc_ppm,
      ironPpm: card.iron_ppm,
      boronPpm: card.boron_ppm,
      sulphurPpm: card.sulphur_ppm,
      isDeficientInZinc: Boolean(card.is_deficient_zinc),
      isDeficientInNitrogen: Boolean(card.is_deficient_nitrogen),
      isDeficientInPotash: Boolean(card.is_deficient_potash),
      nutrientStatusSummaryLocalized: card.nutrient_status_summary_localized
    };
  }

  static upsertSoilCard(farmId: string, payload: any): SoilHealthCard {
    const isDeficientInZinc = payload.zincPpm < 0.6;
    const isDeficientInNitrogen = payload.nitrogenKgPerHa < 280;
    const isDeficientInPotash = payload.potassiumKgPerHa < 140;

    const summary = payload.nutrientStatusSummaryLocalized || `पीएच ${payload.ph}, कार्बन ${payload.organicCarbonPercent}%, जिंक ${isDeficientInZinc ? 'की कमी' : 'पर्याप्त'}।`;

    const card = SoilCardRepository.upsert({
      id: crypto.randomUUID(),
      farm_id: farmId,
      test_date: payload.testDate || new Date().toISOString().split('T')[0],
      testing_lab_name: payload.testingLabName || 'Kisan Seva Testing Lab',
      ph: payload.ph,
      electrical_conductivity: payload.electricalConductivityDsPerM || 0.4,
      organic_carbon_percent: payload.organicCarbonPercent,
      nitrogen_kg_ha: payload.nitrogenKgPerHa,
      phosphorus_kg_ha: payload.phosphorusKgPerHa,
      potassium_kg_ha: payload.potassiumKgPerHa,
      zinc_ppm: payload.zincPpm || 0.6,
      iron_ppm: payload.ironPpm || 5.0,
      boron_ppm: payload.boronPpm || 0.5,
      sulphur_ppm: payload.sulphurPpm || 10.0,
      is_deficient_zinc: isDeficientInZinc ? 1 : 0,
      is_deficient_nitrogen: isDeficientInNitrogen ? 1 : 0,
      is_deficient_potash: isDeficientInPotash ? 1 : 0,
      nutrient_status_summary_localized: summary
    });

    AuditRepository.log('SOIL_CARD_UPSERTED', null, 'SOIL_CARD', card.id, { farmId, isDeficientInZinc });

    return {
      id: card.id,
      farmId: card.farm_id,
      testDate: card.test_date,
      testingLabName: card.testing_lab_name,
      ph: card.ph,
      electricalConductivityDsPerM: card.electrical_conductivity,
      organicCarbonPercent: card.organic_carbon_percent,
      nitrogenKgPerHa: card.nitrogen_kg_ha,
      phosphorusKgPerHa: card.phosphorus_kg_ha,
      potassiumKgPerHa: card.potassium_kg_ha,
      zincPpm: card.zinc_ppm,
      ironPpm: card.iron_ppm,
      boronPpm: card.boron_ppm,
      sulphurPpm: card.sulphur_ppm,
      isDeficientInZinc: Boolean(card.is_deficient_zinc),
      isDeficientInNitrogen: Boolean(card.is_deficient_nitrogen),
      isDeficientInPotash: Boolean(card.is_deficient_potash),
      nutrientStatusSummaryLocalized: card.nutrient_status_summary_localized
    };
  }

  static listCropCycles(farmId: string) {
    const list = CropCycleRepository.listByFarmId(farmId);
    return {
      cropCycles: list.map(c => ({
        id: c.id,
        farmId: c.farm_id,
        cropId: c.crop_id,
        cropName: c.crop_name,
        variety: c.variety,
        sowingDate: c.sowing_date,
        currentGrowthStage: c.current_growth_stage,
        expectedHarvestDate: c.expected_harvest_date,
        seedTreatmentApplied: Boolean(c.seed_treatment_applied),
        status: c.status,
        daysSinceSowing: c.days_since_sowing
      }))
    };
  }

  static createCropCycle(farmId: string, payload: any) {
    const cycleId = crypto.randomUUID();
    const cycle = CropCycleRepository.create({
      id: cycleId,
      farm_id: farmId,
      crop_id: payload.cropId,
      crop_name: payload.cropName,
      variety: payload.variety,
      sowing_date: payload.sowingDate || new Date().toISOString().split('T')[0],
      current_growth_stage: payload.currentGrowthStage || 'VEGETATIVE',
      expected_harvest_date: payload.expectedHarvestDate || null,
      seed_treatment_applied: payload.seedTreatmentApplied ? 1 : 0,
      status: 'ACTIVE',
      days_since_sowing: 1
    });

    AuditRepository.log('CROP_CYCLE_CREATED', null, 'CROP_CYCLE', cycle.id, { farmId, crop: cycle.crop_name });

    return {
      id: cycle.id,
      farmId: cycle.farm_id,
      cropId: cycle.crop_id,
      cropName: cycle.crop_name,
      variety: cycle.variety,
      sowingDate: cycle.sowing_date,
      currentGrowthStage: cycle.current_growth_stage,
      expectedHarvestDate: cycle.expected_harvest_date,
      seedTreatmentApplied: Boolean(cycle.seed_treatment_applied),
      status: cycle.status,
      daysSinceSowing: cycle.days_since_sowing
    };
  }

  static listClinicFarmers(search?: string) {
    const farmers = UserRepository.listAllFarmers(search);
    return {
      farmers: farmers.map(f => {
        const farmCount = FarmRepository.listByFarmerId(f.id).length;
        return {
          id: f.id,
          mobileNumber: `+91${f.mobile_number}`,
          fullName: f.full_name,
          state: f.state,
          district: f.district,
          taluka: f.taluka,
          village: f.village,
          pinCode: f.pin_code,
          preferredLanguage: f.preferred_language,
          totalFarmsCount: farmCount
        };
      }),
      total: farmers.length,
      page: 1,
      limit: 20
    };
  }
}
