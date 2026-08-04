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
  String _selectedCrop = 'SOYBEAN';
  double _sharpnessScore = 0.88; // 0.0 to 1.0 (Laplacian variance)
  double _lightingScore = 0.82;  // 0.0 to 1.0 (Exposure metric)
  bool _isOfflineMode = false;
  bool _isAnalyzing = false;
  String _provisionalDiagnosis = 'Soybean Zinc Deficiency (78% Provisional)';

  final List<Map<String, String>> _crops = [
    {'code': 'SOYBEAN', 'nameHi': 'सोयाबीन (Soybean)', 'nameEn': 'Soybean'},
    {'code': 'PADDY', 'nameHi': 'धान (Paddy/Rice)', 'nameEn': 'Paddy'},
    {'code': 'COTTON', 'nameHi': 'कपास (Cotton)', 'nameEn': 'Cotton'},
    {'code': 'TOMATO', 'nameHi': 'टमाटर (Tomato)', 'nameEn': 'Tomato'},
    {'code': 'WHEAT', 'nameHi': 'गेहूँ (Wheat)', 'nameEn': 'Wheat'},
  ];

  Future<void> _handleCapture(double confidenceTarget) async {
    setState(() => _isAnalyzing = true);
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
          'inferenceLatencyMs': 160,
          'topPrediction': _provisionalDiagnosis,
          'provisionalConfidence': confidenceTarget,
        },
        'context': {
          'cropSpecies': _selectedCrop,
          'cropVariety': 'JS 20-34',
          'affectedPlantPart': 'LEAF',
          'weatherContext': {
            'relativeHumidityPercent': 78.0,
            'temperatureCelsius': 29.0
          }
        }
      });
      setState(() => _isAnalyzing = false);
      widget.onDiagnosisCompleted(res.data);
    } catch (e) {
      setState(() => _isAnalyzing = false);
      // Fallback offline mock payload
      widget.onDiagnosisCompleted({
        'diagnosisId': 'demo-diagnosis-123',
        'status': confidenceTarget >= 0.85
            ? 'COMPLETED_HIGH_CONFIDENCE'
            : confidenceTarget >= 0.55
                ? 'ADAPTIVE_QUESTIONNAIRE_REQUIRED'
                : 'ESCALATED_TO_SPECIALIST',
        'confidenceScore': confidenceTarget,
        'diagnosisCategory': 'NUTRITIONAL_DEFICIENCY',
        'primaryDiagnosis': {
          'code': 'DIS_ZINC_DEFICIENCY',
          'commonName': 'Zinc Deficiency (जिंक / जस्ता की कमी)',
          'scientificName': 'Nutritional Disorder - Micronutrient Zn',
          'severity': 'MODERATE',
          'confidence': confidenceTarget,
          'descriptionLocalized': 'पत्तियों की नसों के बीच का भाग पीला पड़ रहा है जबकि नसें हरी हैं।'
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;
    final isQualityOk = _sharpnessScore >= 0.60 && _lightingScore >= 0.60;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('captureLeaf', lang)),
        actions: [
          Row(
            children: [
              Icon(_isOfflineMode ? Icons.cloud_off : Icons.cloud_done, size: 18, color: Colors.white),
              const SizedBox(width: 4),
              Text(_isOfflineMode ? 'Offline Queue' : 'Online AI', style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 12),
            ],
          )
        ],
      ),
      body: Column(
        children: [
          // Crop Selector Bar
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

          // Guided Camera Viewfinder Simulation
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Simulated Camera Feed Leaf Image
                Container(
                  color: Colors.black87,
                  child: Image.network(
                    'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=800&auto=format&fit=crop&q=80',
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, stack) => const Center(
                      child: Icon(Icons.spa, size: 96, color: Colors.greenAccent),
                    ),
                  ),
                ),

                // Viewfinder Guidance Grid & Reticle
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
                              color: Colors.black.withOpacity(0.6),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isQualityOk ? Icons.check_circle : Icons.warning_amber,
                                  color: isQualityOk ? Colors.greenAccent : Colors.amberAccent,
                                  size: 16,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isQualityOk ? 'Framing Optimal' : 'Stabilize Camera',
                                  style: const TextStyle(color: Colors.white, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Live On-Device Quality & Provisional Edge AI Bar
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.85),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Real-time quality meters
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildQualityIndicator('Sharpness / स्पष्टता', _sharpnessScore),
                            _buildQualityIndicator('Lighting / प्रकाश', _lightingScore),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Divider(color: Colors.white24, height: 1),
                        const SizedBox(height: 8),
                        // On-Device Edge ML provisional tag
                        Row(
                          children: [
                            const Icon(Icons.memory, color: Colors.greenAccent, size: 18),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                _provisionalDiagnosis,
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
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

          // Capture Control Deck (Supports 3 Trigger Scenarios for Demo Review)
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Column(
              children: [
                if (_isAnalyzing)
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppColors.primaryGreen),
                        SizedBox(width: 12),
                        Text('Multimodal Cloud AI Analyzing...', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )
                else ...[
                  // Primary Capture Trigger Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.camera_alt, size: 24),
                      label: const Text('Capture & Diagnose (जांच शुरू करें)', style: TextStyle(fontSize: 16)),
                      onPressed: () => _handleCapture(0.72), // Default 72% triggers Adaptive Questionnaire
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Scenario quick triggers for testing all 3 confidence tiers
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      TextButton.icon(
                        icon: const Icon(Icons.bolt, size: 14, color: AppColors.primaryGreen),
                        label: const Text('Test High (92%)', style: TextStyle(fontSize: 11)),
                        onPressed: () => _handleCapture(0.92),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.quiz, size: 14, color: AppColors.harvestAmber),
                        label: const Text('Test Ambiguous (72%)', style: TextStyle(fontSize: 11)),
                        onPressed: () => _handleCapture(0.72),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.support_agent, size: 14, color: Colors.red),
                        label: const Text('Test Low (48% SLA)', style: TextStyle(fontSize: 11)),
                        onPressed: () => _handleCapture(0.48),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
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
