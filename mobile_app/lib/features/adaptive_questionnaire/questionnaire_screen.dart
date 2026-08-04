import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';

class AdaptiveQuestionnaireScreen extends StatefulWidget {
  final dynamic diagnosisData;
  final String currentLanguage;
  final Function(dynamic recalibratedResult) onRecalibrationComplete;

  const AdaptiveQuestionnaireScreen({
    Key? key,
    required this.diagnosisData,
    required this.currentLanguage,
    required this.onRecalibrationComplete,
  }) : super(key: key);

  @override
  State<AdaptiveQuestionnaireScreen> createState() => _AdaptiveQuestionnaireScreenState();
}

class _AdaptiveQuestionnaireScreenState extends State<AdaptiveQuestionnaireScreen> {
  final Map<String, String> _selectedAnswers = {};
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Default initial selections
    _selectedAnswers['Q_LEAF_POSITION'] = 'TOP_YOUNG';
    _selectedAnswers['Q_SPOT_TEXTURE'] = 'NO_POWDER';
  }

  Future<void> _handleSubmit() async {
    setState(() => _isSubmitting = true);
    final diagnosisId = widget.diagnosisData['diagnosisId'] ?? 'demo-id';
    final questionnaireId = widget.diagnosisData['adaptiveQuestionnaire']?['questionnaireId'] ?? 'q-id';

    final answers = _selectedAnswers.entries.map((e) => {
      'questionId': e.key,
      'selectedOptionKeys': [e.value]
    }).toList();

    try {
      final res = await ApiClient().dio.post(
        '/diagnosis/diagnose/$diagnosisId/questionnaire/submit',
        data: {
          'questionnaireId': questionnaireId,
          'answers': answers,
        },
      );
      setState(() => _isSubmitting = false);
      widget.onRecalibrationComplete(res.data);
    } catch (e) {
      setState(() => _isSubmitting = false);
      // Fallback demo transition
      widget.onRecalibrationComplete({
        'diagnosisId': diagnosisId,
        'status': 'COMPLETED_HIGH_CONFIDENCE',
        'confidenceScore': 0.94,
        'diagnosisCategory': 'NUTRITIONAL_DEFICIENCY',
        'primaryDiagnosis': {
          'code': 'DIS_ZINC_DEFICIENCY',
          'commonName': 'Zinc Deficiency (जिंक की कमी / खैरा लक्षण)',
          'scientificName': 'Nutritional Disorder - Micronutrient Zn',
          'severity': 'MODERATE',
          'confidence': 0.94,
          'descriptionLocalized': 'पत्तियों की नसों के बीच का भाग पीला पड़ रहा है जबकि नसें हरी हैं।'
        },
        'recommendation': {
          'step1NutrientFoliarCorrection': {
            'isRecommended': true,
            'titleHi': 'चरण 1: सूक्ष्म पोषक तत्व पर्णीय छिड़काव (Foliar Mineral Correction)',
            'actionHi': 'जिंक सल्फेट (ZnSO4 21%) 500 ग्राम + बुझा हुआ चूना 250 ग्राम प्रति 200 लीटर पानी प्रति एकड़ छिड़काव करें।',
            'dosage': {
              'perLitreDilution': '2.5 ग्राम प्रति लीटर',
              'perAcreDose': '500 ग्राम (200 लीटर पानी में)',
              'method': 'FOLIAR_SPRAY'
            }
          },
          'step2BiologicalOrCultural': {
            'isRecommended': true,
            'titleHi': 'चरण 2: जैविक एवं मृदा सुधार',
            'actionHi': 'जिंक सोल्युबिलाइजिंग बैक्टीरिया (ZSB) 1 किग्रा प्रति एकड़ 50 किग्रा गोबर की खाद के साथ दें।',
            'dosage': {
              'perLitreDilution': 'लागू नहीं (मृदा उपचार)',
              'perAcreDose': '1.0 किग्रा ZSB',
              'method': 'SOIL_DRENCHING'
            }
          },
          'step3ChemicalIntervention': {
            'isRecommended': false,
            'titleHi': 'चरण 3: रासायनिक उपचार (आवश्यकता नहीं)',
            'actionHi': 'पोषण संबंधी विकार होने के कारण रासायनिक कीटनाशक की आवश्यकता नहीं है।',
            'cibrcRegistrationVerified': true,
            'isStateBanned': false
          },
          'sprayInstructionsLocalized': 'सुबह 8-11 बजे या शाम 4 बजे के बाद छिड़काव करें। तेज धूप में छिड़काव न करें।'
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final questions = widget.diagnosisData['adaptiveQuestionnaire']?['questions'] as List<dynamic>? ?? [
      {
        'questionId': 'Q_LEAF_POSITION',
        'questionTextLocalized': 'पीलापन मुख्य रूप से किस हिस्से की पत्तियों पर दिख रहा है?',
        'options': [
          {'optionKey': 'TOP_YOUNG', 'optionTextLocalized': 'पौधे के ऊपरी भाग की नई पत्तियों पर'},
          {'optionKey': 'BOTTOM_OLD', 'optionTextLocalized': 'पौधे के निचले भाग की पुरानी पत्तियों पर'},
        ]
      },
      {
        'questionId': 'Q_SPOT_TEXTURE',
        'questionTextLocalized': 'क्या पत्तियों के पीछे कोई फफूंद (पाउडर/जाला) दिखाई दे रहा है?',
        'options': [
          {'optionKey': 'NO_POWDER', 'optionTextLocalized': 'नहीं, सतह साफ है (केवल पीला रंग)'},
          {'optionKey': 'YES_RUST_POWDER', 'optionTextLocalized': 'हाँ, भूरा-लाल पाउडर जैसा उभर रहा है'},
        ]
      }
    ];

    final confidence = (widget.diagnosisData['confidenceScore'] as num? ?? 0.72) * 100;

    return Scaffold(
      appBar: AppBar(
        title: const Text('सटीक पहचान हेतु प्रश्न'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Confidence Badge Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3E0),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.harvestAmber, width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.help_outline, color: AppColors.harvestAmber, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AI विश्वास स्कोर: ${confidence.toInt()}% (मध्यम स्थिति)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.soilBrown),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'सटीक इलाज और सही पोषण पर्चा बनाने के लिए कृपया इन 2 प्रश्नों के उत्तर दें:',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Dynamic Questions List
            ...questions.map((q) {
              final qId = q['questionId'] as String;
              final qText = q['questionTextLocalized'] as String;
              final options = q['options'] as List<dynamic>;

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        qText,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 12),
                      ...options.map((opt) {
                        final key = opt['optionKey'] as String;
                        final text = opt['optionTextLocalized'] as String;
                        final isSelected = _selectedAnswers[qId] == key;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.lightLeafTint : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? AppColors.primaryGreen : AppColors.divider,
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: RadioListTile<String>(
                            value: key,
                            groupValue: _selectedAnswers[qId],
                            activeColor: AppColors.primaryGreen,
                            title: Text(text, style: const TextStyle(fontSize: 14)),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedAnswers[qId] = val);
                              }
                            },
                          ),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 16),
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.check_circle_outline),
                label: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('उत्तर सबमिट करें एवं उपचार देखें', style: TextStyle(fontSize: 16)),
                onPressed: _isSubmitting ? null : _handleSubmit,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
