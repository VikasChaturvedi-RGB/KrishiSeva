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
    final lang = widget.currentLanguage;
    if (_isSpeaking) {
      TtsService().stop();
      setState(() => _isSpeaking = false);
    } else {
      final diag = widget.diagnosisResult['primaryDiagnosis'];
      final rec = widget.diagnosisResult['recommendation'];
      final step1Action = lang == 'en'
          ? (rec?['step1NutrientFoliarCorrection']?['actionEn'] ?? rec?['step1NutrientFoliarCorrection']?['actionHi'] ?? '')
          : (rec?['step1NutrientFoliarCorrection']?['actionHi'] ?? rec?['step1NutrientFoliarCorrection']?['actionEn'] ?? '');
      final step2Action = lang == 'en'
          ? (rec?['step2BiologicalOrCultural']?['actionEn'] ?? rec?['step2BiologicalOrCultural']?['actionHi'] ?? '')
          : (rec?['step2BiologicalOrCultural']?['actionHi'] ?? rec?['step2BiologicalOrCultural']?['actionEn'] ?? '');

      final textToSpeak = '''
${AppLocalizations.get('rxTitle', lang)}: ${diag?['commonName'] ?? 'Zinc Deficiency'}.
${AppLocalizations.get('confidenceScore', lang)}: ${((widget.diagnosisResult['confidenceScore'] ?? 0.94) * 100).toInt()}%.

${AppLocalizations.get('step1Nutrient', lang)}: $step1Action
${AppLocalizations.get('dilutionRate', lang)}: ${rec?['step1NutrientFoliarCorrection']?['dosage']?['perLitreDilution'] ?? '2.5 g/L'}.

${AppLocalizations.get('step2Biological', lang)}: $step2Action
${AppLocalizations.get('sprayInstructions', lang)}: ${rec?['sprayInstructionsLocalized'] ?? AppLocalizations.get('sprayMorningEvening', lang)}
''';
      TtsService().speak(textToSpeak, lang);
      setState(() => _isSpeaking = true);
    }
  }

  void _downloadPdfPrescription() {
    final lang = widget.currentLanguage;
    final diagnosisId = widget.diagnosisResult['diagnosisId'] ?? 'demo-id';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${AppLocalizations.get('generatePdfSlip', lang)}: /v1/diagnosis/diagnose/$diagnosisId/prescription/pdf'),
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

    final step1Title = lang == 'en' ? (step1['titleEn'] ?? step1['titleHi'] ?? AppLocalizations.get('step1Nutrient', lang)) : (step1['titleHi'] ?? AppLocalizations.get('step1Nutrient', lang));
    final step1Action = lang == 'en' ? (step1['actionEn'] ?? step1['actionHi'] ?? '') : (step1['actionHi'] ?? step1['actionEn'] ?? '');

    final step2Title = lang == 'en' ? (step2['titleEn'] ?? step2['titleHi'] ?? AppLocalizations.get('step2Biological', lang)) : (step2['titleHi'] ?? AppLocalizations.get('step2Biological', lang));
    final step2Action = lang == 'en' ? (step2['actionEn'] ?? step2['actionHi'] ?? '') : (step2['actionHi'] ?? step2['actionEn'] ?? '');

    final step3Title = lang == 'en' ? (step3['titleEn'] ?? step3['titleHi'] ?? AppLocalizations.get('step3Chemical', lang)) : (step3['titleHi'] ?? AppLocalizations.get('step3Chemical', lang));
    final step3Action = lang == 'en' ? (step3['actionEn'] ?? step3['actionHi'] ?? '') : (step3['actionHi'] ?? step3['actionEn'] ?? '');

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('rxTitle', lang)),
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
            // Diagnosis Master Card
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
                          AppLocalizations.get('farmerPrescription', lang),
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$confidence% ${AppLocalizations.get('confidenceScore', lang)}',
                          style: const TextStyle(color: AppColors.primaryGreen, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    diag['commonName'] ?? 'Zinc Deficiency (जिंक की कमी)',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    diag['scientificName'] ?? 'Nutritional Disorder - Micronutrient Zn',
                    style: const TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    diag['descriptionLocalized'] ?? AppLocalizations.get('step1NutrientDesc', lang),
                    style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Step 1: Mineral & Foliar Nutrient Card (Priority 1)
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.eco, color: AppColors.primaryGreen, size: 24),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            step1Title,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(step1Action, style: const TextStyle(fontSize: 13, height: 1.4)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.lightLeafTint,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(AppLocalizations.get('dilutionRate', lang), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              Text(step1['dosage']?['perLitreDilution'] ?? '2.5 g/L', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(AppLocalizations.get('perAcreVolume', lang), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              Text(step1['dosage']?['perAcreDose'] ?? '500g in 200L water', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Step 2: Biological & Soil Health Card (Priority 2)
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.nature_people, color: AppColors.soilBrown, size: 24),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            step2Title,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.soilBrown),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(step2Action, style: const TextStyle(fontSize: 13, height: 1.4)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Step 3: Chemical Treatment Card (CIB&RC Registered or Exempt)
            Card(
              elevation: 1,
              color: step3['isRecommended'] == true ? Colors.red.shade50 : Colors.grey.shade50,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          step3['isRecommended'] == true ? Icons.warning_amber : Icons.verified,
                          color: step3['isRecommended'] == true ? Colors.red : Colors.green,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            step3Title,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: step3['isRecommended'] == true ? Colors.red.shade800 : Colors.green.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      step3Action.isNotEmpty
                          ? step3Action
                          : (step3['isRecommended'] == true
                              ? AppLocalizations.get('chemicalPermitted', lang)
                              : AppLocalizations.get('chemicalNotRequired', lang)),
                      style: const TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Acreage & Dynamic Dosage Calculator
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.lightLeafTint,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppLocalizations.get('dosageCalc', lang),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryGreen),
                      ),
                      Text(
                        '${_farmAcreage.toStringAsFixed(1)} ${AppLocalizations.get('farmAreaAcres', lang)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  Slider(
                    value: _farmAcreage,
                    min: 0.5,
                    max: 20.0,
                    divisions: 39,
                    activeColor: AppColors.primaryGreen,
                    onChanged: (val) => setState(() => _farmAcreage = val),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _calcBadge(AppLocalizations.get('zinc', lang), '${(_farmAcreage * 500).toInt()} g'),
                      _calcBadge('Water (पानी)', '${(_farmAcreage * 200).toInt()} L'),
                      _calcBadge('Lime (चूना)', '${(_farmAcreage * 250).toInt()} g'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Spray Schedule Guidelines
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.wb_sunny_outlined, color: Colors.amber, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.get('sprayInstructions', lang),
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.amber.shade900),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          rec['sprayInstructionsLocalized'] ?? AppLocalizations.get('sprayMorningEvening', lang),
                          style: const TextStyle(fontSize: 12, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: Text(AppLocalizations.get('newScanBtn', lang)),
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
              onPressed: widget.onNewScan,
            ),
          ],
        ),
      ),
    );
  }

  Widget _calcBadge(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
        ],
      ),
    );
  }
}
