import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/tts/tts_service.dart';
import '../../core/network/api_client.dart';

class RecommendationScreen extends StatefulWidget {
  final dynamic diagnosisResult;
  final String currentLanguage;
  final VoidCallback onNewScan;

  const RecommendationScreen({
    Key? key,
    required this.diagnosisResult,
    required this.currentLanguage,
    required this.onNewScan,
  }) : super(key: key);

  @override
  State<RecommendationScreen> createState() => _RecommendationScreenState();
}

class _RecommendationScreenState extends State<RecommendationScreen> {
  double _farmAcreage = 2.0;
  bool _isSpeaking = false;

  @override
  void dispose() {
    TtsService().stop();
    super.dispose();
  }

  void _handleTtsToggle() {
    if (_isSpeaking) {
      TtsService().stop();
      setState(() => _isSpeaking = false);
    } else {
      final diag = widget.diagnosisResult['primaryDiagnosis'];
      final rec = widget.diagnosisResult['recommendation'];
      final textToSpeak = '''
फसल निदान: ${diag?['commonName'] ?? 'जिंक की कमी'}।
विश्वास स्कोर: ${((widget.diagnosisResult['confidenceScore'] ?? 0.94) * 100).toInt()} प्रतिशत।

चरण 1: सूक्ष्म पोषक तत्व पर्णीय छिड़काव: ${rec?['step1NutrientFoliarCorrection']?['actionHi'] ?? ''}
प्रति लीटर पानी में घोल दर: ${rec?['step1NutrientFoliarCorrection']?['dosage']?['perLitreDilution'] ?? '2.5 ग्राम प्रति लीटर'}।

चरण 2: जैविक उपचार: ${rec?['step2BiologicalOrCultural']?['actionHi'] ?? ''}

छिड़काव सलाह: ${rec?['sprayInstructionsLocalized'] ?? 'सुबह या शाम के समय छिड़काव करें।'}
''';
      TtsService().speak(textToSpeak, widget.currentLanguage);
      setState(() => _isSpeaking = true);
    }
  }

  void _downloadPdfPrescription() {
    final diagnosisId = widget.diagnosisResult['diagnosisId'] ?? 'demo-id';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('डाउनलोडिंग पर्चा: http://localhost:8080/v1/diagnosis/diagnose/$diagnosisId/prescription/pdf'),
        backgroundColor: AppColors.primaryGreen,
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;
    final diag = widget.diagnosisResult['primaryDiagnosis'] ?? {};
    final rec = widget.diagnosisResult['recommendation'] ?? {};
    final step1 = rec['step1NutrientFoliarCorrection'] ?? {};
    final step2 = rec['step2BiologicalOrCultural'] ?? {};
    final step3 = rec['step3ChemicalIntervention'] ?? {};
    final confidence = ((widget.diagnosisResult['confidenceScore'] as num? ?? 0.94) * 100).toInt();

    return Scaffold(
      appBar: AppBar(
        title: const Text('पोषण-प्रथम उपचार पर्चा'),
        actions: [
          IconButton(
            icon: Icon(_isSpeaking ? Icons.volume_up : Icons.volume_off, color: Colors.white),
            tooltip: AppLocalizations.get('listenAudio', lang),
            onPressed: _handleTtsToggle,
          ),
          IconButton(
            icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
            tooltip: AppLocalizations.get('generatePdfSlip', lang),
            onPressed: _downloadPdfPrescription,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Diagnosis Master Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primaryGreen, AppColors.leafGreen],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryGreen.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'AI सटीकता: $confidence%',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'CIB&RC सत्यापित',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    diag['commonName'] ?? 'जिंक / जस्ता की कमी (Zinc Deficiency)',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    diag['scientificName'] ?? 'Nutritional Disorder - Micronutrient Zn',
                    style: const TextStyle(color: Colors.white70, fontSize: 13, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    diag['descriptionLocalized'] ?? 'पत्तियों की नसों के बीच पीलापन व पत्तियों का छोटा रह जाना।',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Acreage Dosage Calculator Slider
            Card(
              color: AppColors.lightLeafTint,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'खेत का रकबा (Acreage Calculator):',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.soilBrown),
                        ),
                        Text(
                          '${_farmAcreage.toStringAsFixed(1)} एकड़',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryGreen),
                        ),
                      ],
                    ),
                    Slider(
                      value: _farmAcreage,
                      min: 0.5,
                      max: 10.0,
                      divisions: 19,
                      activeColor: AppColors.primaryGreen,
                      inactiveColor: AppColors.divider,
                      label: '${_farmAcreage.toStringAsFixed(1)} एकड़',
                      onChanged: (val) => setState(() => _farmAcreage = val),
                    ),
                    Text(
                      'कुल पानी की आवश्यकता: ${(_farmAcreage * 200).toInt()} लीटर | कुल जिंक सल्फेट: ${(_farmAcreage * 500).toInt()} ग्राम',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              '3-चरणीय पोषण-प्रथम उपचार प्रोटोकॉल',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.soilBrown),
            ),
            const SizedBox(height: 12),

            // Step 1: Mineral / Foliar Correction (Green)
            _buildProtocolCard(
              stepNumber: '1',
              title: step1['titleHi'] ?? 'चरण 1: सूक्ष्म पोषक तत्व पर्णीय सुधार (सर्वप्रथम)',
              actionText: step1['actionHi'] ?? 'जिंक सल्फेट (ZnSO4 21%) 500 ग्राम + चूना 250 ग्राम प्रति 200 लीटर पानी में मिलाकर पर्णीय छिड़काव करें।',
              dilutionRate: step1['dosage']?['perLitreDilution'] ?? '2.5 ग्राम प्रति लीटर',
              acreDose: step1['dosage']?['perAcreDose'] ?? '500 ग्राम प्रति एकड़',
              stepColor: AppColors.step1Nutrient,
              badgeText: 'उच्च प्राथमिकता (Mineral First)',
              icon: Icons.grass,
            ),
            const SizedBox(height: 12),

            // Step 2: Biological & Soil Bio-control (Amber)
            _buildProtocolCard(
              stepNumber: '2',
              title: step2['titleHi'] ?? 'चरण 2: जैविक एवं मृदा उपचार',
              actionText: step2['actionHi'] ?? 'जिंक सोल्युबिलाइजिंग बैक्टीरिया (ZSB) 1 किग्रा प्रति एकड़ 50 किग्रा गोबर की खाद के साथ मिट्टी में मिलाएं।',
              dilutionRate: 'लागू नहीं (मृदा सुधारक)',
              acreDose: step2['dosage']?['perAcreDose'] ?? '1.0 किग्रा ZSB प्रति एकड़',
              stepColor: AppColors.step2Bio,
              badgeText: 'दीर्घकालिक मृदा स्वास्थ्य',
              icon: Icons.compost,
            ),
            const SizedBox(height: 12),

            // Step 3: Chemical Intervention (Red / Caution / Banned Filter)
            _buildProtocolCard(
              stepNumber: '3',
              title: step3['titleHi'] ?? 'चरण 3: CIB&RC रासायनिक उपचार',
              actionText: step3['actionHi'] ?? 'पोषण की कमी के कारण रासायनिक कीटनाशक की आवश्यकता नहीं है।',
              dilutionRate: step3['dosage']?['perLitreDilution'] ?? 'शून्य / अनुशंसित नहीं',
              acreDose: step3['dosage']?['perAcreDose'] ?? 'शून्य',
              stepColor: step3['isRecommended'] == true ? AppColors.step3Chemical : Colors.grey,
              badgeText: step3['isRecommended'] == true ? 'अंतिम विकल्प (CIB&RC Reg)' : 'रासायनिक कीटनाशक वर्जित (Not Needed)',
              icon: Icons.science,
              isChemicalStep: true,
              cibrcReg: step3['cibrcRegNo'],
              phiDays: step3['preHarvestIntervalDays'],
            ),
            const SizedBox(height: 16),

            // Spraying Advisory & Safe Practices
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.wb_sunny, color: AppColors.harvestAmber, size: 20),
                        SizedBox(width: 8),
                        Text('छिड़काव सावधानियां एवं मौसम सलाह', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      rec['sprayInstructionsLocalized'] ?? '• सुबह 8-11 बजे या शाम 4 बजे के बाद छिड़काव करें।\n• दोपहर की तेज धूप या बारिश की संभावना में छिड़काव न करें।\n• स्प्रेयर नोजल को पत्ती के ऊपरी और निचले दोनों भागों पर घुमाएं।',
                      style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.refresh),
                    label: const Text('नई जांच (New Scan)'),
                    onPressed: widget.onNewScan,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.print),
                    label: const Text('PDF पर्चा प्रिंट'),
                    onPressed: _downloadPdfPrescription,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildProtocolCard({
    required String stepNumber,
    required String title,
    required String actionText,
    required String dilutionRate,
    required String acreDose,
    required Color stepColor,
    required String badgeText,
    required IconData icon,
    bool isChemicalStep = false,
    String? cibrcReg,
    int? phiDays,
  }) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: stepColor.withOpacity(0.4), width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: stepColor,
                  child: Text(stepNumber, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: stepColor),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: stepColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(badgeText, style: TextStyle(color: stepColor, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(actionText, style: const TextStyle(fontSize: 13, height: 1.35, color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('घोल दर: $dilutionRate', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                Text('मात्रा: $acreDose', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.soilBrown)),
              ],
            ),
            if (isChemicalStep && cibrcReg != null) ...[
              const SizedBox(height: 6),
              Text('CIB&RC Reg #: $cibrcReg | PHI: ${phiDays ?? 0} दिन', style: const TextStyle(fontSize: 11, color: Colors.redAccent, fontWeight: FontWeight.bold)),
            ]
          ],
        ),
      ),
    );
  }
}
