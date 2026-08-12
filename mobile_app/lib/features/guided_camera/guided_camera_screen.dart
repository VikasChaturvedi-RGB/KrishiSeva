import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';

class GuidedCameraScreen extends StatefulWidget {
  final String currentLanguage;
  final Function(dynamic diagnosisResult) onDiagnosisCompleted;

  const GuidedCameraScreen({
    Key? key,
    required this.currentLanguage,
    required this.onDiagnosisCompleted,
  }) : super(key: key);

  @override
  State<GuidedCameraScreen> createState() => _GuidedCameraScreenState();
}

class _GuidedCameraScreenState extends State<GuidedCameraScreen> {
  String _selectedCrop = 'BANANA';
  double _sharpnessScore = 0.88; // 0.0 to 1.0 (Laplacian variance)
  double _lightingScore = 0.82;  // 0.0 to 1.0 (Exposure metric)
  bool _isAnalyzing = false;
  String _provisionalDiagnosis = 'Banana Black Sigatoka (94% Provisional)';

  final List<Map<String, String>> _crops = [
    {'code': 'BANANA', 'nameHi': 'केला (Banana - G9)', 'nameEn': 'Banana (Musa acuminata)', 'morphology': 'PENNI_PARALLEL', 'image': 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop&q=80'},
    {'code': 'SOYBEAN', 'nameHi': 'सोयाबीन (Soybean)', 'nameEn': 'Soybean (Glycine max)', 'morphology': 'RETICULATE_TRIFOLIATE', 'image': 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=800&auto=format&fit=crop&q=80'},
    {'code': 'SUGARCANE', 'nameHi': 'गन्ना (Sugarcane)', 'nameEn': 'Sugarcane (Saccharum officinarum)', 'morphology': 'PARALLEL_LINEAR', 'image': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=800&auto=format&fit=crop&q=80'},
    {'code': 'PADDY', 'nameHi': 'धान (Paddy/Rice)', 'nameEn': 'Paddy / Rice (Oryza sativa)', 'morphology': 'PARALLEL_LINEAR', 'image': 'https://images.unsplash.com/photo-1536704689299-c7096e2889eb?w=800&auto=format&fit=crop&q=80'},
    {'code': 'COTTON', 'nameHi': 'कपास (Cotton)', 'nameEn': 'Cotton (Gossypium hirsutum)', 'morphology': 'PALMATE_LOBED', 'image': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80'},
    {'code': 'TOMATO', 'nameHi': 'टमाटर (Tomato)', 'nameEn': 'Tomato (Solanum lycopersicum)', 'morphology': 'PINNATE_COMPOUND', 'image': 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=80'},
    {'code': 'MAIZE', 'nameHi': 'मक्का (Maize/Corn)', 'nameEn': 'Maize (Zea mays)', 'morphology': 'PARALLEL_BROAD', 'image': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=80'},
    {'code': 'POTATO', 'nameHi': 'आलू (Potato)', 'nameEn': 'Potato (Solanum tuberosum)', 'morphology': 'PINNATE_OVATE', 'image': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80'},
    {'code': 'WHEAT', 'nameHi': 'गेहूँ (Wheat)', 'nameEn': 'Wheat (Triticum aestivum)', 'morphology': 'PARALLEL_LINEAR', 'image': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80'},
  ];

  Future<void> _handleCapture(double confidenceTarget) async {
    setState(() => _isAnalyzing = true);
    final lang = widget.currentLanguage;
    final currentCropInfo = _crops.firstWhere(
      (c) => c['code'] == _selectedCrop,
      orElse: () => _crops[0],
    );

    try {
      final res = await ApiClient().dio.post('/diagnosis/diagnose/submit', data: {
        'forcedConfidence': confidenceTarget,
        'mediaIds': ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
        'qualityMetrics': {
          'blurScore': _sharpnessScore,
          'brightnessScore': _lightingScore,
          'isAcceptableQuality': _sharpnessScore >= 0.60,
        },
        'provisionalInference': {
          'modelName': 'agriscan-edge-quant-v1.4',
          'modelVersion': '1.4.2',
          'inferenceLatencyMs': 142,
          'topPrediction': _provisionalDiagnosis,
          'provisionalConfidence': confidenceTarget,
        },
        'context': {
          'cropSpecies': _selectedCrop,
          'cropVariety': _selectedCrop == 'BANANA' ? 'Grand Naine (G9)' : (_selectedCrop == 'SOYBEAN' ? 'JS 20-34' : 'Standard'),
          'affectedPlantPart': 'LEAF',
          'leafMorphology': currentCropInfo['morphology'],
          'weatherContext': {
            'relativeHumidityPercent': 82.0,
            'temperatureCelsius': 28.5
          }
        }
      });
      setState(() => _isAnalyzing = false);
      widget.onDiagnosisCompleted(res.data);
    } catch (e) {
      setState(() => _isAnalyzing = false);
      // Fallback offline simulated payload for the selected crop
      if (_selectedCrop == 'BANANA') {
        widget.onDiagnosisCompleted({
          'diagnosisId': 'demo-banana-sigatoka-${DateTime.now().millisecondsSinceEpoch}',
          'status': confidenceTarget >= 0.85
              ? 'COMPLETED_HIGH_CONFIDENCE'
              : confidenceTarget >= 0.55
                  ? 'ADAPTIVE_QUESTIONNAIRE_REQUIRED'
                  : 'ESCALATED_TO_SPECIALIST',
          'confidenceScore': confidenceTarget,
          'diagnosisCategory': 'FUNGAL_PATHOGEN',
          'botanicalValidation': {
            'cropIdentified': 'BANANA',
            'speciesName': 'Musa acuminata',
            'commonName': 'Grand Naine Banana / केला',
            'morphology': 'PENNI_PARALLEL',
            'confidence': 0.965
          },
          'primaryDiagnosis': {
            'code': 'DIS_BANANA_SIGATOKA',
            'commonName': lang == 'en' ? 'Black Sigatoka Leaf Spot' : 'ब्लैक सिगाटोका पर्ण धब्बा (Black Sigatoka)',
            'scientificName': 'Pseudocercospora fijiensis / Mycosphaerella fijiensis',
            'severity': 'HIGH',
            'confidence': confidenceTarget,
            'descriptionLocalized': lang == 'en'
                ? 'Elongated reddish-brown to dark brown necrotic streaks with yellow chlorotic halo parallel to secondary veins.'
                : 'पत्तियों की द्वितीयक शिराओं के समानांतर लाल-भूरे एवं काले धब्बे, जो बड़े होकर पत्ती के ऊतकों को सुखा देते हैं।',
          }
        });
      } else {
        widget.onDiagnosisCompleted({
          'diagnosisId': 'demo-diagnosis-${DateTime.now().millisecondsSinceEpoch}',
          'status': confidenceTarget >= 0.85
              ? 'COMPLETED_HIGH_CONFIDENCE'
              : confidenceTarget >= 0.55
                  ? 'ADAPTIVE_QUESTIONNAIRE_REQUIRED'
                  : 'ESCALATED_TO_SPECIALIST',
          'confidenceScore': confidenceTarget,
          'diagnosisCategory': 'NUTRITIONAL_DEFICIENCY',
          'botanicalValidation': {
            'cropIdentified': _selectedCrop,
            'confidence': 0.95
          },
          'primaryDiagnosis': {
            'code': 'DIS_ZINC_DEFICIENCY',
            'commonName': lang == 'en' ? 'Zinc Deficiency' : 'जिंक / जस्ता की कमी (Zinc Deficiency)',
            'scientificName': 'Nutritional Disorder - Micronutrient Zn',
            'severity': 'MODERATE',
            'confidence': confidenceTarget,
            'descriptionLocalized': AppLocalizations.get('step1NutrientDesc', lang),
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;
    final isQualityOk = _sharpnessScore >= 0.60 && _lightingScore >= 0.60;
    final currentCrop = _crops.firstWhere(
      (c) => c['code'] == _selectedCrop,
      orElse: () => _crops[0],
    );

    return Column(
      children: [
        // Crop Selection Pill Bar
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          color: AppColors.lightLeafTint,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _crops.map((c) {
                final isSelected = c['code'] == _selectedCrop;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    selectedColor: AppColors.primaryGreen,
                    backgroundColor: Colors.white,
                    label: Text(
                      lang == 'en' ? c['nameEn']! : c['nameHi']!,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                    selected: isSelected,
                    onSelected: (val) {
                      if (val) setState(() => _selectedCrop = c['code']!);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // Guided Camera Viewfinder Simulation (Edge-to-Edge)
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              // High-Res Leaf Image Simulation
              Container(
                color: Colors.black87,
                child: Image.network(
                  currentCrop['image'] ?? 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&auto=format&fit=crop&q=80',
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => const Center(
                    child: Icon(Icons.eco, size: 96, color: Colors.greenAccent),
                  ),
                ),
              ),

              // Viewfinder Framing Grid & Reticle
              Center(
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isQualityOk ? AppColors.emerald : Colors.redAccent,
                      width: 3,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.65),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isQualityOk ? Icons.check_circle : Icons.warning_amber,
                                color: isQualityOk ? Colors.greenAccent : Colors.amberAccent,
                                size: 15,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isQualityOk
                                    ? AppLocalizations.get('framingOptimal', lang)
                                    : AppLocalizations.get('stabilizeCamera', lang),
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Live On-Device Quality & Edge AI Gauge Card
              Positioned(
                bottom: 12,
                left: 14,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.85),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 4))
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Real-time quality meters
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildQualityIndicator(AppLocalizations.get('sharpness', lang), _sharpnessScore),
                          _buildQualityIndicator(AppLocalizations.get('lighting', lang), _lightingScore),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Divider(color: Colors.white24, height: 1),
                      const SizedBox(height: 6),
                      // On-Device Edge ML provisional tag
                      Row(
                        children: [
                          const Icon(Icons.memory, color: Colors.greenAccent, size: 18),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _provisionalDiagnosis,
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Bottom Capture Deck
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: AppColors.surface,
          child: Column(
            children: [
              if (_isAnalyzing)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(color: AppColors.primaryGreen),
                      const SizedBox(width: 12),
                      Text(
                        AppLocalizations.get('multimodalAnalyzing', lang),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                )
              else ...[
                // Primary Action Button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.camera_alt, size: 22),
                    label: Text(
                      AppLocalizations.get('analyzeBtn', lang),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () => _handleCapture(0.72),
                  ),
                ),
                const SizedBox(height: 6),
                // Scenario test buttons for demo validation
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton.icon(
                      icon: const Icon(Icons.bolt, size: 14, color: AppColors.primaryGreen),
                      label: Text(AppLocalizations.get('testHighConf', lang), style: const TextStyle(fontSize: 11)),
                      onPressed: () => _handleCapture(0.92),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.quiz, size: 14, color: AppColors.harvestAmber),
                      label: Text(AppLocalizations.get('testAmbiguous', lang), style: const TextStyle(fontSize: 11)),
                      onPressed: () => _handleCapture(0.72),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.support_agent, size: 14, color: Colors.red),
                      label: Text(AppLocalizations.get('testLowConf', lang), style: const TextStyle(fontSize: 11)),
                      onPressed: () => _handleCapture(0.48),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQualityIndicator(String title, double score) {
    final isGood = score >= 0.70;
    return Row(
      children: [
        Icon(isGood ? Icons.check_circle : Icons.warning, color: isGood ? Colors.greenAccent : Colors.amberAccent, size: 14),
        const SizedBox(width: 4),
        Text('$title: ${(score * 100).toInt()}%', style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }
}
