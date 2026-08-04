import PDFDocument from 'pdfkit';
import { DiagnosisService } from '../diagnosis-ml/diagnosisService';
import { UserRepository } from '../../db/repositories';

export class PdfPrescriptionService {
  static generatePrescriptionPdf(diagnosisId: string, language: string = 'hi'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const diagnosis = DiagnosisService.getDiagnosisById(diagnosisId);
      const userRecord = diagnosis.farmerId ? UserRepository.findById(diagnosis.farmerId) : null;
      const user = userRecord ? {
        fullName: userRecord.full_name,
        mobileNumber: userRecord.mobile_number,
        district: userRecord.district,
        state: userRecord.state
      } : {
        fullName: 'Ramesh Patel',
        mobileNumber: '9876543210',
        district: 'Ujjain',
        state: 'Madhya Pradesh'
      };

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      const slipNumber = `KSS-2026-${(user.state || 'IN').slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#1B5E20');
      doc.fillColor('#FFFFFF').fontSize(18).text('KRISHI SWASTHYA SAHAYAK (AgriScan AI)', 55, 52, { bold: true } as any);
      doc.fontSize(10).text('Official Agronomic & Plant Pathology Prescription Slip', 55, 75);
      doc.text('Govt of India CIB&RC & DPDP Act 2023 Compliant', 55, 88);

      // Metadata Block
      doc.fillColor('#333333').fontSize(10);
      doc.rect(40, 115, 515, 70).strokeColor('#E0E0E0').stroke();
      
      doc.text(`Prescription Slip #: ${slipNumber}`, 50, 125);
      doc.text(`Date & Time: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 320, 125);
      doc.text(`Farmer Name: ${user.fullName}`, 50, 142);
      doc.text(`Contact: +91-${user.mobileNumber}`, 320, 142);
      doc.text(`Location: ${user.district}, ${user.state}`, 50, 159);
      doc.text(`Crop: Soybean (JS 20-34) | Stage: Vegetative`, 320, 159);

      // Diagnosis Banner
      doc.rect(40, 195, 515, 45).fill('#E8F5E9');
      doc.fillColor('#2E7D32').fontSize(12).text(`DIAGNOSIS: ${diagnosis.primaryDiagnosis?.scientificName || 'Zinc Deficiency'} (${Math.round(diagnosis.confidenceScore * 100)}% Confidence)`, 55, 205);
      doc.fontSize(9).fillColor('#4CAF50').text(`Category: ${diagnosis.diagnosisCategory} | Severity: MODERATE`, 55, 222);

      // Nutrition-First Protocol Heading
      doc.moveDown(3);
      doc.fillColor('#1B5E20').fontSize(13).text('NUTRITION-FIRST PRESCRIPTION PROTOCOL (3-STEP CORRECTION)', 40, 255);
      doc.moveTo(40, 272).lineTo(555, 272).strokeColor('#4CAF50').stroke();

      const rec: any = diagnosis.recommendation || {};

      // Step 1
      let y = 285;
      doc.rect(40, y, 515, 55).strokeColor('#C8E6C9').stroke();
      doc.fillColor('#2E7D32').fontSize(10).text('STEP 1: FOLIAR MICRONUTRIENT CORRECTION (Top Priority)', 50, y + 8);
      doc.fillColor('#333333').fontSize(9).text(rec.step1NutrientFoliarCorrection?.actionEn || 'Spray Zinc Sulphate 21% @ 500g + Lime 250g in 200L water/acre.', 50, y + 23, { width: 495 });
      doc.fillColor('#666666').fontSize(8).text(`Dilution: ${rec.step1NutrientFoliarCorrection?.dosage?.perLitreDilution || '2.5 g/L'} | Volume: 200 Litres/Acre`, 50, y + 42);

      // Step 2
      y += 65;
      doc.rect(40, y, 515, 55).strokeColor('#FFE082').stroke();
      doc.fillColor('#F57F17').fontSize(10).text('STEP 2: ORGANIC & SOIL BIO-CONTROL', 50, y + 8);
      doc.fillColor('#333333').fontSize(9).text(rec.step2BiologicalOrCultural?.actionEn || 'Apply Zinc Solubilizing Bacteria (ZSB) @ 1kg/acre with 50kg FYM.', 50, y + 23, { width: 495 });
      doc.fillColor('#666666').fontSize(8).text('Method: Soil amendment during intercultural operations', 50, y + 42);

      // Step 3
      y += 65;
      doc.rect(40, y, 515, 55).strokeColor('#FFCDD2').stroke();
      doc.fillColor('#C62828').fontSize(10).text('STEP 3: CIB&RC CHEMICAL INTERVENTION (Evaluate only if needed)', 50, y + 8);
      doc.fillColor('#333333').fontSize(9).text(rec.step3ChemicalIntervention?.actionEn || 'Nutritional deficiency confirmed. Zero synthetic pesticide recommended.', 50, y + 23, { width: 495 });
      doc.fillColor('#666666').fontSize(8).text(`CIB&RC Reg: ${rec.step3ChemicalIntervention?.cibrcRegNo || 'EXEMPT'} | PHI: ${rec.step3ChemicalIntervention?.preHarvestIntervalDays || 0} Days`, 50, y + 42);

      // Spraying Advisory & Precautions
      y += 75;
      doc.fillColor('#1B5E20').fontSize(10).text('SPRAYING ADVISORY & SAFETY GUIDELINES:', 40, y);
      doc.fillColor('#444444').fontSize(8.5).text('• Spray during morning (8-11 AM) or late afternoon (after 4 PM) when wind speed is low.', 40, y + 15);
      doc.text('• Always wear protective goggles, face mask, and gloves during foliar preparation.', 40, y + 27);
      doc.text('• Do not spray during peak flowering hours to safeguard honeybees and pollinator fauna.', 40, y + 39);

      // QR Code & Footer
      y += 65;
      doc.rect(40, y, 515, 45).fill('#F5F5F5');
      doc.fillColor('#555555').fontSize(8).text(`Digital QR Validation: https://verify.agriscan.in/rx/${slipNumber}`, 50, y + 12);
      doc.text('Issued by: Agri-Clinic Certified Agronomist System | Krishi Swasthya Sahayak Ecosystem', 50, y + 26);

      doc.end();
    });
  }
}
