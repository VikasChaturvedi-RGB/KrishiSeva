import {
  AgriGraduateLicenseRepository,
  AgriGraduateLicenseRecord,
  CertifiedInputProductRepository,
  CertifiedInputProductRecord,
  AgronomistPrescriptionRepository,
  AgronomistPrescriptionRecord,
  FarmerOrderKhataRepository,
  FarmerOrderKhataRecord,
  AgriConsultationBookingRepository,
  AuditRepository
} from '../../db/repositories';
import { DatabaseSeeder } from '../../db/seeder';

export class LicensedAgriGraduateService {
  private static ensureSeeded() {
    if (!AgriGraduateLicenseRepository.getPrimary()) {
      DatabaseSeeder.seedAgriGraduateCommerceData();
    }
  }

  // =========================================================================
  // 1. STATUTORY ACCREDITATION & GRADUATE DOCTOR PROFILE
  // =========================================================================
  static getGraduateProfileAndLicenses(): {
    graduate: AgriGraduateLicenseRecord;
    legalAuthoritySummaryHi: string;
    legalAuthoritySummaryEn: string;
    statutoryActs: { actName: string; authorityGrantedHi: string }[];
  } {
    this.ensureSeeded();
    let grad = AgriGraduateLicenseRepository.getPrimary();
    if (!grad) {
      DatabaseSeeder.seedAgriGraduateCommerceData();
      grad = AgriGraduateLicenseRepository.getPrimary()!;
    }

    return {
      graduate: grad,
      legalAuthoritySummaryHi:
        'भारतीय कृषि एवं किसान कल्याण मंत्रालय तथा बीज, उर्वरक व कीटनाशक अधिनियमों के अंतर्गत बी.एस.सी. (ऑनर्स) कृषि स्नातक को अधिकृत कृषि डॉक्टर (Agri-Doctor) के रूप में प्रमाणित बीज, कस्टमाइज्ड पोषक तत्व मिश्रण एवं पौध संरक्षण रसायनों के परीक्षण, संस्तुति (Prescription) तथा विक्रय का पूर्ण कानूनी अधिकार प्राप्त है।',
      legalAuthoritySummaryEn:
        'Under the Seeds Act 1966, FCO 1985, Insecticides Act 1968, and Central ACABC Scheme (MANAGE/NABARD), a B.Sc. (Hons) Agriculture graduate is legally recognized as a Certified Agronomic Practitioner authorized to test, prescribe, and dispense statutory seeds, customized fertilizers, and bio-protection inputs.',
      statutoryActs: [
        {
          actName: 'बीज अधिनियम 1966 (The Seeds Act, 1966)',
          authorityGrantedHi: `लाइसेंस नं: ${grad.seed_license_no} — प्रमाणित सत्य बीजों (Germination % व Genetic Purity प्रमाणित) के विक्रय का अधिकार।`
        },
        {
          actName: 'उर्वरक नियंत्रण आदेश 1985 (Fertilizer Control Order - FCO)',
          authorityGrantedHi: `लाइसेंस नं: ${grad.fertilizer_license_no} — मृदा कार्ड आधारित संतुलित खाद, चिलेटेड सूक्ष्म पोषक तत्व एवं जैव-उर्वरक वितरण।`
        },
        {
          actName: 'कीटनाशक अधिनियम 1968 (The Insecticides Act, 1968)',
          authorityGrantedHi: `लाइसेंस नं: ${grad.insecticide_license_no} — CIB&RC स्वीकृत जैविक व रासायनिक पौध संरक्षण की लिखित चिकित्सकीय पर्ची (Agri-Rx) जारी करना।`
        },
        {
          actName: 'डीजीसीए कृषि ड्रोन पायलट प्रमाणन (DGCA Drone Pilot RPC)',
          authorityGrantedHi: `प्रमाणपत्र नं: ${grad.drone_pilot_license_no} — खेतों में 10L/एकड़ अल्ट्रा-लो वॉल्यूम प्रिसिजन पर्णीय छिड़काव का आधिकारिक लाइसेंस।`
        }
      ]
    };
  }

  // =========================================================================
  // 2. LICENSED SEEDS, CUSTOM NUTRIENTS & SOLUTION BUNDLES STORE
  // =========================================================================
  static getLicensedProducts(params: {
    category?: string;
    cropCode?: string;
    search?: string;
  }): {
    products: CertifiedInputProductRecord[];
    count: number;
    licensedStoreBannerHi: string;
  } {
    this.ensureSeeded();
    let items = CertifiedInputProductRepository.listAll(params.category, params.cropCode);

    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.product_name_hi.toLowerCase().includes(q) ||
          p.product_name_en.toLowerCase().includes(q) ||
          p.composition_or_variety.toLowerCase().includes(q) ||
          p.scientific_solution_note_hi.toLowerCase().includes(q)
      );
    }

    return {
      products: items,
      count: items.length,
      licensedStoreBannerHi:
        'सभी बीज एवं समाधान उत्पाद बी.एस.सी. कृषि स्नातक द्वारा प्रमाणित, लैब-परीक्षित (Lab-Tested) तथा एफसीओ व बीज प्रमाणीकरण मानकों के 100% अनुरूप हैं।'
    };
  }

  // =========================================================================
  // 3. DIGITAL AGRONOMIC PRESCRIPTION (Agri-Rx / किसान कृषि पर्चा)
  // =========================================================================
  static createPrescription(params: {
    farmerId?: string;
    farmerName: string;
    mobileNumber: string;
    village: string;
    cropName: string;
    acreage: number;
    diagnosisId?: string;
    primaryDiagnosisHi: string;
    productCodes: string[];
    doctorNotesHi?: string;
  }): {
    success: boolean;
    prescription: AgronomistPrescriptionRecord;
    messageHi: string;
  } {
    this.ensureSeeded();
    const grad = AgriGraduateLicenseRepository.getPrimary()!;
    const rxNo = `AGRX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const rxItems: any[] = [];
    for (const code of params.productCodes) {
      const prod = CertifiedInputProductRepository.findByCode(code);
      if (prod) {
        rxItems.push({
          productCode: prod.product_code,
          productNameHi: prod.product_name_hi,
          category: prod.category,
          unitSpec: prod.unit_spec,
          lotNumber: prod.lot_number,
          farmerPriceInr: prod.farmer_price_inr,
          prescribedDosage: prod.prescribed_dosage_per_acre,
          totalQtyRecommended: `${params.acreage} एकड़ हेतु संस्तुत मात्रा`,
          scientificInstructionHi: prod.scientific_solution_note_hi
        });
      }
    }

    const rx = AgronomistPrescriptionRepository.create({
      prescription_no: rxNo,
      farmer_id: params.farmerId || null,
      farmer_name: params.farmerName,
      mobile_number: params.mobileNumber,
      village: params.village,
      crop_name: params.cropName,
      acreage: params.acreage,
      diagnosis_id: params.diagnosisId || null,
      primary_diagnosis_hi: params.primaryDiagnosisHi,
      rx_items_json: rxItems,
      doctor_notes_hi:
        params.doctorNotesHi ||
        'पौधे के पोषण एवं सीआईबीआरसी नियमों के अनुसार घोल तैयार करें। छिड़काव हमेशा सुबह 7-10 बजे या शाम को करें। अनावश्यक कीटनाशक से बचें।',
      graduate_reg_no: `${grad.acabc_reg_no} | ${grad.qualification}`,
      digital_signature_stamp: grad.digital_stamp_code,
      status: 'PRESCRIBED'
    });

    AuditRepository.log(
      'AGRONOMIST_PRESCRIPTION_ISSUED',
      null,
      'AGRONOMIST_PRESCRIPTION',
      rx.prescription_no,
      rx
    );

    return {
      success: true,
      prescription: rx,
      messageHi: `अधिकृत कृषि पर्चा (Agri-Rx: ${rx.prescription_no}) सफलता पूर्वक जारी कर दिया गया है! किसान सीधे स्टोर से अथवा पे-आफ्टर-हार्वेस्ट पर प्राप्त कर सकता है।`
    };
  }

  // =========================================================================
  // 4. INNOVATIVE "DIAGNOSIS-TO-DISPENSE" (Rx-to-Cart) AUTO-CONVERTER
  // =========================================================================
  static convertDiagnosisToRxAndOrder(params: {
    diagnosisId: string;
    farmerName?: string;
    mobileNumber?: string;
    village?: string;
    cropName?: string;
    acreage?: number;
    paymentMode?: 'UPI_INSTANT' | 'CASH_ON_DELIVERY' | 'PAY_AFTER_HARVEST_CREDIT';
    diseaseCode?: string;
  }): {
    success: boolean;
    prescription: AgronomistPrescriptionRecord;
    order: FarmerOrderKhataRecord;
    invoiceDocket: string;
    messageHi: string;
  } {
    this.ensureSeeded();
    const grad = AgriGraduateLicenseRepository.getPrimary()!;
    const acreage = Number(params.acreage || 2.0);
    const farmerName = params.farmerName || 'रामेश्वर पाटीदार (Rameshwar Patidar)';
    const mobileNumber = params.mobileNumber || '9876543210';
    const village = params.village || 'धरमपुरी (Dharampuri)';
    const cropName = params.cropName || 'SOYBEAN';
    const paymentMode = params.paymentMode || 'PAY_AFTER_HARVEST_CREDIT';

    // Map disease / deficiency to licensed Doctor Curative Solution Packs
    const dCode = (params.diseaseCode || 'DIS_ZINC_DEFICIENCY').toUpperCase();
    let pickedProductCodes: string[] = ['BLEND_ZN_CHELATED', 'BIO_ZSB_LIQUID'];
    let primaryDiagnosisHi = 'जिंक सूक्ष्म-पोषक तत्व हीनता एवं क्षारीय मृदा क्लोरोसिस';

    if (dCode.includes('RUST') || dCode.includes('BLIGHT')) {
      pickedProductCodes = ['KIT_SOY_YMV_RUST', 'BIO_TRICHO_HARZ'];
      primaryDiagnosisHi = 'सोयाबीन रतुआ (Rust) व पर्ण धब्बा फफूंद प्रकोप';
    } else if (dCode.includes('BOLLWORM') || dCode.includes('COTTON')) {
      pickedProductCodes = ['KIT_COTTON_PBW', 'BIO_BEAUVERIA'];
      primaryDiagnosisHi = 'कपास गुलाबी सुंडी एवं रसचूसक कीट प्रकोप';
    } else if (dCode.includes('THRIPS') || dCode.includes('CHILLI')) {
      pickedProductCodes = ['KIT_CHILLI_THRIPS', 'BLEND_SOP_0050'];
      primaryDiagnosisHi = 'मिर्च विदेशी ब्लैक थ्रिप्स व मुरड़िया रोग';
    }

    const rxItems: any[] = [];
    let grossTotal = 0;

    for (const code of pickedProductCodes) {
      const prod = CertifiedInputProductRepository.findByCode(code);
      if (prod) {
        const itemQty = Math.ceil(acreage * 1);
        const itemCost = prod.farmer_price_inr * itemQty;
        grossTotal += itemCost;
        rxItems.push({
          productCode: prod.product_code,
          productNameHi: prod.product_name_hi,
          category: prod.category,
          lotNumber: prod.lot_number,
          quantity: itemQty,
          unitSpec: prod.unit_spec,
          rateInr: prod.farmer_price_inr,
          totalPriceInr: itemCost,
          dosageInstructionHi: prod.prescribed_dosage_per_acre
        });
      }
    }

    const discountInr = Math.round(grossTotal * 0.08); // 8% Agri-Graduate Direct Subsidy Discount
    const netPayableInr = grossTotal - discountInr;

    // 1. Create Prescription
    const rxNo = `AGRX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const rx = AgronomistPrescriptionRepository.create({
      prescription_no: rxNo,
      farmer_id: null,
      farmer_name: farmerName,
      mobile_number: mobileNumber,
      village,
      crop_name: cropName,
      acreage,
      diagnosis_id: params.diagnosisId,
      primary_diagnosis_hi: primaryDiagnosisHi,
      rx_items_json: rxItems,
      doctor_notes_hi:
        'बी.एस.सी. कृषि स्नातक द्वारा AI स्कैन व मृदा स्वास्थ्य कार्ड रिपोर्ट की समीक्षा उपरांत अधिकृत नुस्खा जारी किया गया। CIB&RC व FCO प्रमाणित।',
      graduate_reg_no: `${grad.acabc_reg_no} | ${grad.qualification}`,
      digital_signature_stamp: grad.digital_stamp_code,
      status: 'DISPENSED'
    });

    // 2. Create Farmer Order / Credit Khata
    const orderNo = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceDocket = `GST-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const harvestDueDate = 'नवंबर 2026 (फसल कटाई एवं मंडी बिक्री उपरांत)';

    const order = FarmerOrderKhataRepository.create({
      order_no: orderNo,
      prescription_no: rxNo,
      farmer_name: farmerName,
      mobile_number: mobileNumber,
      village,
      items_json: rxItems,
      total_amount_inr: grossTotal,
      discount_inr: discountInr,
      net_payable_inr: netPayableInr,
      payment_mode: paymentMode,
      harvest_credit_due_date: paymentMode === 'PAY_AFTER_HARVEST_CREDIT' ? harvestDueDate : null,
      credit_settled_amount_inr: paymentMode === 'PAY_AFTER_HARVEST_CREDIT' ? 0 : netPayableInr,
      invoice_docket: invoiceDocket,
      order_status: 'CONFIRMED_DISPATCH'
    });

    AuditRepository.log(
      'DIAGNOSIS_CONVERTED_TO_DISPENSED_ORDER',
      null,
      'FARMER_ORDER_KHATA',
      order.order_no,
      { prescription: rx, order }
    );

    return {
      success: true,
      prescription: rx,
      order,
      invoiceDocket,
      messageHi:
        paymentMode === 'PAY_AFTER_HARVEST_CREDIT'
          ? `सफलता! AI जांच से अधिकृत पर्चा (${rxNo}) व 'फसल कटाई बाद भुगतान' बही-खाता ऑर्डर (${orderNo}) बन गया है। सामग्री डिस्पैच हो रही है (देय: ₹${netPayableInr.toLocaleString('en-IN')})।`
          : `सफलता! अधिकृत पर्चा (${rxNo}) व ऑर्डर (${orderNo}) तैयार है। इनवॉइस: ${invoiceDocket}।`
    };
  }

  // =========================================================================
  // 5. DIRECT INPUT ORDERS & "PAY-AFTER-HARVEST" CREDIT LEDGER (बही-खाता)
  // =========================================================================
  static createFarmerOrder(params: {
    prescriptionNo?: string;
    farmerName: string;
    mobileNumber: string;
    village: string;
    items: { productCode: string; quantity: number }[];
    paymentMode: 'UPI_INSTANT' | 'CASH_ON_DELIVERY' | 'PAY_AFTER_HARVEST_CREDIT';
    harvestCreditDueDate?: string;
  }): {
    success: boolean;
    order: FarmerOrderKhataRecord;
    messageHi: string;
  } {
    this.ensureSeeded();
    const orderNo = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoiceDocket = `GST-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let grossTotal = 0;
    const itemsJson: any[] = [];

    for (const item of params.items) {
      const prod = CertifiedInputProductRepository.findByCode(item.productCode);
      if (prod) {
        const itemCost = prod.farmer_price_inr * item.quantity;
        grossTotal += itemCost;
        itemsJson.push({
          productCode: prod.product_code,
          productNameHi: prod.product_name_hi,
          category: prod.category,
          lotNumber: prod.lot_number,
          quantity: item.quantity,
          unitSpec: prod.unit_spec,
          rateInr: prod.farmer_price_inr,
          totalPriceInr: itemCost
        });
      }
    }

    const discountInr = Math.round(grossTotal * 0.05); // 5% Agri-Graduate loyal customer discount
    const netPayableInr = grossTotal - discountInr;

    const order = FarmerOrderKhataRepository.create({
      order_no: orderNo,
      prescription_no: params.prescriptionNo || null,
      farmer_name: params.farmerName,
      mobile_number: params.mobileNumber,
      village: params.village,
      items_json: itemsJson,
      total_amount_inr: grossTotal,
      discount_inr: discountInr,
      net_payable_inr: netPayableInr,
      payment_mode: params.paymentMode,
      harvest_credit_due_date:
        params.paymentMode === 'PAY_AFTER_HARVEST_CREDIT'
          ? params.harvestCreditDueDate || 'नवंबर 2026 (फसल कटाई एवं मंडी भुगतान बाद)'
          : null,
      credit_settled_amount_inr: params.paymentMode === 'PAY_AFTER_HARVEST_CREDIT' ? 0 : netPayableInr,
      invoice_docket: invoiceDocket,
      order_status: 'CONFIRMED_DISPATCH'
    });

    return {
      success: true,
      order,
      messageHi:
        params.paymentMode === 'PAY_AFTER_HARVEST_CREDIT'
          ? `ऑर्डर नं: ${orderNo} 'फसल कटाई बाद भुगतान' बही-खाते में दर्ज हो गया है! शुद्ध राशि: ₹${netPayableInr.toLocaleString('en-IN')}। इनवॉइस: ${invoiceDocket}।`
          : `ऑर्डर नं: ${orderNo} कन्फर्म हो गया है! कुल देय: ₹${netPayableInr.toLocaleString('en-IN')}। इनवॉइस: ${invoiceDocket}।`
    };
  }

  static getFarmerKhataLedger(mobileNumber?: string): {
    farmerMobile: string;
    orders: FarmerOrderKhataRecord[];
    totalCreditOutstandingInr: number;
    totalSettledInr: number;
    creditStatusHi: string;
  } {
    this.ensureSeeded();
    const targetMobile = mobileNumber || '9876543210';
    const orders = FarmerOrderKhataRepository.listByMobileOrAll(targetMobile);

    let totalCreditOutstandingInr = 0;
    let totalSettledInr = 0;

    for (const o of orders) {
      if (o.payment_mode === 'PAY_AFTER_HARVEST_CREDIT') {
        const remaining = o.net_payable_inr - o.credit_settled_amount_inr;
        if (remaining > 0) {
          totalCreditOutstandingInr += remaining;
        } else {
          totalSettledInr += o.net_payable_inr;
        }
      } else {
        totalSettledInr += o.net_payable_inr;
      }
    }

    return {
      farmerMobile: targetMobile,
      orders,
      totalCreditOutstandingInr,
      totalSettledInr,
      creditStatusHi:
        totalCreditOutstandingInr > 0
          ? `बकाया क्रेडिट: ₹${totalCreditOutstandingInr.toLocaleString('en-IN')} (फसल कटाई बाद देय)`
          : 'सभी लेन-देन चुकता (All Clear — उच्च विश्वसनीयता रेटिंग)'
    };
  }

  // =========================================================================
  // 6. TELE-AGRONOMY & SEASONAL FARM CARE SUBSCRIPTIONS
  // =========================================================================
  static bookAgriDoctorConsultation(params: {
    farmerName: string;
    mobileNumber: string;
    cropName: string;
    acreage: number;
    consultationType: 'TELE_VIDEO_CALL' | 'IN_PERSON_FIELD_AUDIT' | 'SEASONAL_CROP_CARE_CONTRACT';
    scheduledSlot?: string;
  }): {
    success: boolean;
    booking: any;
    messageHi: string;
  } {
    this.ensureSeeded();
    const grad = AgriGraduateLicenseRepository.getPrimary()!;
    const ref = `DOC-AGRI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const feeMap = {
      TELE_VIDEO_CALL: 250,
      IN_PERSON_FIELD_AUDIT: 500,
      SEASONAL_CROP_CARE_CONTRACT: Math.round(params.acreage * 499)
    };
    const feeInr = feeMap[params.consultationType] || 250;

    const b = AgriConsultationBookingRepository.create({
      booking_ref: ref,
      farmer_name: params.farmerName,
      mobile_number: params.mobileNumber,
      crop_name: params.cropName,
      acreage: params.acreage,
      consultation_type: params.consultationType,
      scheduled_slot: params.scheduledSlot || 'कल दोपहर 02:00 PM (Video Call / Field Audit)',
      fee_inr: feeInr,
      payment_status: 'CONFIRMED_ACABC',
      status: 'CONFIRMED'
    });

    return {
      success: true,
      booking: b,
      messageHi: `कृषि स्नातक डॉक्टर परामर्श स्लॉट (${ref}) बुक हो गया है! विशेषज्ञ: ${grad.graduate_name} (${grad.qualification})। शुल्क: ₹${feeInr.toLocaleString('en-IN')}।`
    };
  }
}
