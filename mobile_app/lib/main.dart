import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/localization/app_localizations.dart';
import 'features/auth_consent/auth_screen.dart';
import 'features/guided_camera/guided_camera_screen.dart';
import 'features/adaptive_questionnaire/questionnaire_screen.dart';
import 'features/nutrition_recommendation/recommendation_screen.dart';
import 'features/agronomist_escalation/escalation_screen.dart';
import 'features/agri_clinic_mode/clinic_dashboard_screen.dart';
import 'features/farm_profile/farm_profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AgriScanApp()));
}

class AgriScanApp extends StatefulWidget {
  const AgriScanApp({Key? key}) : super(key: key);

  @override
  State<AgriScanApp> createState() => _AgriScanAppState();
}

class _AgriScanAppState extends State<AgriScanApp> {
  String _currentLanguage = 'hi';
  bool _isAuthenticated = true; // Default true for instant exploration

  void _setLanguage(String lang) {
    setState(() => _currentLanguage = lang);
  }

  void _setAuthenticated() {
    setState(() => _isAuthenticated = true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Krishi Swasthya Sahayak (AgriScan AI)',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _isAuthenticated
          ? MainShellScreen(
              currentLanguage: _currentLanguage,
              onLanguageChange: _setLanguage,
            )
          : AuthConsentScreen(
              currentLanguage: _currentLanguage,
              onLanguageChange: _setLanguage,
              onAuthenticated: _setAuthenticated,
            ),
    );
  }
}

class MainShellScreen extends StatefulWidget {
  final String currentLanguage;
  final Function(String) onLanguageChange;

  const MainShellScreen({
    Key? key,
    required this.currentLanguage,
    required this.onLanguageChange,
  }) : super(key: key);

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _currentIndex = 0;
  dynamic _latestDiagnosisResult;

  void _handleDiagnosisCompleted(dynamic result) {
    setState(() => _latestDiagnosisResult = result);
    final status = result['status'];

    if (status == 'ADAPTIVE_QUESTIONNAIRE_REQUIRED') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => AdaptiveQuestionnaireScreen(
            diagnosisData: result,
            currentLanguage: widget.currentLanguage,
            onRecalibrationComplete: (recalibrated) {
              Navigator.pop(ctx);
              setState(() {
                _latestDiagnosisResult = recalibrated;
                _currentIndex = 1; // Go to recommendation tab
              });
            },
          ),
        ),
      );
    } else if (status == 'ESCALATED_TO_SPECIALIST') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => AgronomistEscalationScreen(
            escalationDetails: result['escalationDetails'] ?? {
              'assignedAgronomistName': 'Dr. Suresh Verma (Senior Agronomist, KVK)',
              'timeRemainingMinutes': 110
            },
            currentLanguage: widget.currentLanguage,
            onNewScan: () {
              Navigator.pop(ctx);
              setState(() => _currentIndex = 0);
            },
          ),
        ),
      );
    } else {
      // High confidence instant
      setState(() => _currentIndex = 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      GuidedCameraScreen(
        currentLanguage: widget.currentLanguage,
        onDiagnosisCompleted: _handleDiagnosisCompleted,
      ),
      RecommendationScreen(
        diagnosisResult: _latestDiagnosisResult ?? {
          'diagnosisId': 'demo-default',
          'confidenceScore': 0.94,
          'primaryDiagnosis': {
            'code': 'DIS_ZINC_DEFICIENCY',
            'commonName': 'जिंक / जस्ता की कमी (Zinc Deficiency)',
            'scientificName': 'Nutritional Disorder - Micronutrient Zn',
            'severity': 'MODERATE',
            'descriptionLocalized': 'पत्तियों की नसों के बीच का भाग पीला पड़ रहा है जबकि नसें हरी हैं।'
          },
          'recommendation': {
            'step1NutrientFoliarCorrection': {
              'isRecommended': true,
              'titleHi': 'चरण 1: सूक्ष्म पोषक तत्व पर्णीय सुधार (सर्वप्रथम)',
              'actionHi': 'जिंक सल्फेट (ZnSO4 21%) 500 ग्राम + चूना 250 ग्राम प्रति 200 लीटर पानी प्रति एकड़ छिड़काव करें।',
              'dosage': {'perLitreDilution': '2.5 ग्राम प्रति लीटर', 'perAcreDose': '500 ग्राम प्रति एकड़'}
            },
            'step2BiologicalOrCultural': {
              'isRecommended': true,
              'titleHi': 'चरण 2: जैविक एवं मृदा उपचार',
              'actionHi': 'जिंक सोल्युबिलाइजिंग बैक्टीरिया (ZSB) 1 किग्रा प्रति एकड़ 50 किग्रा गोबर की खाद के साथ मिट्टी में मिलाएं।',
              'dosage': {'perAcreDose': '1.0 किग्रा ZSB'}
            },
            'step3ChemicalIntervention': {
              'isRecommended': false,
              'titleHi': 'चरण 3: रासायनिक उपचार (आवश्यकता नहीं)',
              'actionHi': 'पोषण संबंधी कमी के कारण रासायनिक कीटनाशक वर्जित है।',
              'cibrcRegNo': 'EXEMPT'
            },
            'sprayInstructionsLocalized': 'सुबह 8-11 बजे या शाम 4 बजे के बाद छिड़काव करें।'
          }
        },
        currentLanguage: widget.currentLanguage,
        onNewScan: () => setState(() => _currentIndex = 0),
      ),
      ClinicDashboardScreen(currentLanguage: widget.currentLanguage),
      FarmProfileScreen(currentLanguage: widget.currentLanguage),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: Colors.white,
        indicatorColor: AppColors.lightLeafTint,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.camera_alt_outlined),
            selectedIcon: Icon(Icons.camera_alt, color: AppColors.primaryGreen),
            label: 'फसल जांच (Camera)',
          ),
          NavigationDestination(
            icon: Icon(Icons.medication_liquid_outlined),
            selectedIcon: Icon(Icons.medication_liquid, color: AppColors.primaryGreen),
            label: 'पोषण पर्चा (Rx)',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_hospital_outlined),
            selectedIcon: Icon(Icons.local_hospital, color: AppColors.primaryGreen),
            label: 'क्लिनिक (Clinic)',
          ),
          NavigationDestination(
            icon: Icon(Icons.terrain_outlined),
            selectedIcon: Icon(Icons.terrain, color: AppColors.primaryGreen),
            label: 'मृदा/खेत (Farm)',
          ),
        ],
      ),
    );
  }
}
