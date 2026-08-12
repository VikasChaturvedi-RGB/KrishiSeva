import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/theme/app_theme.dart';
import 'core/localization/app_localizations.dart';
import 'core/network/api_client.dart';
import 'core/providers/app_state_providers.dart';

import 'features/auth_consent/auth_screen.dart';
import 'features/guided_camera/guided_camera_screen.dart';
import 'features/nutrition_recommendation/recommendation_screen.dart';
import 'features/adaptive_questionnaire/questionnaire_screen.dart';
import 'features/agronomist_escalation/escalation_screen.dart';
import 'features/agri_clinic_mode/clinic_dashboard_screen.dart';
import 'features/farm_profile/farm_profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AgriScanApp()));
}

class AgriScanApp extends ConsumerWidget {
  const AgriScanApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLanguage = ref.watch(localeProvider);
    final uiScale = ref.watch(uiScaleProvider);

    return MaterialApp(
      title: 'AgriScan AI (कृषि स्वास्थ्य सहायक)',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: Locale(currentLanguage),
      supportedLocales: AppLocalizations.languages.map((l) => Locale(l.code)),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(uiScale),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: const RootOrchestrator(),
    );
  }
}

class RootOrchestrator extends ConsumerStatefulWidget {
  const RootOrchestrator({Key? key}) : super(key: key);

  @override
  ConsumerState<RootOrchestrator> createState() => _RootOrchestratorState();
}

class _RootOrchestratorState extends ConsumerState<RootOrchestrator> {
  bool _isAuthenticated = false;

  @override
  Widget build(BuildContext context) {
    if (!_isAuthenticated) {
      return AuthConsentScreen(
        onAuthenticated: () {
          setState(() => _isAuthenticated = true);
        },
      );
    }

    return const MainShellScreen();
  }
}

class MainShellScreen extends ConsumerStatefulWidget {
  const MainShellScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends ConsumerState<MainShellScreen> {
  dynamic _latestDiagnosisResult;
  dynamic _activeAdaptiveQuestionnaire;
  dynamic _activeEscalationDetails;

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(localeProvider);
    final uiScale = ref.watch(uiScaleProvider);
    final isOnline = ref.watch(networkStateProvider);
    final currentIndex = ref.watch(activeTabProvider);

    // Active Diagnosis Result (Fallback demo payload if not yet scanned)
    final diagResult = _latestDiagnosisResult ?? {
      'diagnosisId': 'demo-diag-001',
      'status': 'COMPLETED_HIGH_CONFIDENCE',
      'confidenceScore': 0.94,
      'diagnosisCategory': 'NUTRITIONAL_DEFICIENCY',
      'primaryDiagnosis': {
        'code': 'DIS_ZINC_DEFICIENCY',
        'commonName': 'Zinc Deficiency (जिंक की कमी)',
        'scientificName': 'Nutritional Disorder - Micronutrient Zn',
        'severity': 'MODERATE',
        'confidence': 0.94,
        'descriptionLocalized': AppLocalizations.get('step1NutrientDesc', lang),
      },
      'recommendation': {
        'step1NutrientFoliarCorrection': {
          'isRecommended': true,
          'titleHi': 'चरण 1: सूक्ष्म पोषक तत्व पर्णीय छिड़काव (Foliar Mineral Correction)',
          'titleEn': 'Step 1: Foliar Mineral Correction (Zinc Sulphate)',
          'actionHi': 'जिंक सल्फेट (ZnSO4 21%) 500 ग्राम + बुझा हुआ चूना 250 ग्राम प्रति 200 लीटर पानी प्रति एकड़ छिड़काव करें।',
          'actionEn': 'Foliar spray Zinc Sulphate (ZnSO4 21%) 500g + Slaked Lime 250g per 200L water/acre.',
          'dosage': {
            'perLitreDilution': '2.5 g/L (ग्राम/लीटर)',
            'perAcreDose': '500g in 200L water',
            'method': 'FOLIAR_SPRAY'
          }
        },
        'step2BiologicalOrCultural': {
          'isRecommended': true,
          'titleHi': 'चरण 2: जैविक एवं मृदा सुधार',
          'titleEn': 'Step 2: Biological & Soil Bio-control',
          'actionHi': 'जिंक सोल्युबिलाइजिंग बैक्टीरिया (ZSB) 1 किग्रा प्रति एकड़ 50 किग्रा गोबर की खाद के साथ दें।',
          'actionEn': 'Apply Zinc Solubilizing Bacteria (ZSB) 1 kg/acre mixed with 50 kg enriched FYM.',
          'dosage': {
            'perLitreDilution': 'N/A (Soil Amendment)',
            'perAcreDose': '1.0 kg ZSB',
            'method': 'SOIL_DRENCHING'
          }
        },
        'step3ChemicalIntervention': {
          'isRecommended': false,
          'titleHi': 'चरण 3: रासायनिक उपचार (आवश्यकता नहीं)',
          'titleEn': 'Step 3: Chemical Treatment (Exempt/Not Required)',
          'actionHi': 'पोषण संबंधी कमी के कारण रासायनिक कीटनाशक वर्जित है।',
          'actionEn': 'Chemical pesticide prohibited due to nutritional deficiency disorder.',
          'cibrcRegNo': 'EXEMPT'
        },
        'sprayInstructionsLocalized': AppLocalizations.get('sprayMorningEvening', lang),
      }
    };

    // Sub-screens
    Widget rxScreen;
    if (_activeAdaptiveQuestionnaire != null) {
      rxScreen = AdaptiveQuestionnaireScreen(
        diagnosisData: _activeAdaptiveQuestionnaire,
        currentLanguage: lang,
        onRecalibrationComplete: (recalibratedResult) {
          setState(() {
            _latestDiagnosisResult = recalibratedResult;
            _activeAdaptiveQuestionnaire = null;
            ref.read(activeTabProvider.notifier).state = 1;
          });
        },
      );
    } else if (_activeEscalationDetails != null) {
      rxScreen = AgronomistEscalationScreen(
        escalationDetails: _activeEscalationDetails,
        currentLanguage: lang,
        onNewScan: () {
          setState(() {
            _activeEscalationDetails = null;
            ref.read(activeTabProvider.notifier).state = 0;
          });
        },
      );
    } else {
      rxScreen = RecommendationScreen(
        diagnosisResult: diagResult,
        currentLanguage: lang,
        onNewScan: () => ref.read(activeTabProvider.notifier).state = 0,
      );
    }

    final screens = [
      GuidedCameraScreen(
        currentLanguage: lang,
        onDiagnosisCompleted: (result) {
          final status = result['status'];
          if (status == 'ADAPTIVE_QUESTIONNAIRE_REQUIRED') {
            setState(() {
              _activeAdaptiveQuestionnaire = result;
              _activeEscalationDetails = null;
              ref.read(activeTabProvider.notifier).state = 1;
            });
          } else if (status == 'ESCALATED_TO_SPECIALIST') {
            setState(() {
              _activeEscalationDetails = result;
              _activeAdaptiveQuestionnaire = null;
              ref.read(activeTabProvider.notifier).state = 1;
            });
          } else {
            setState(() {
              _latestDiagnosisResult = result;
              _activeAdaptiveQuestionnaire = null;
              _activeEscalationDetails = null;
              ref.read(activeTabProvider.notifier).state = 1;
            });
          }
        },
      ),
      rxScreen,
      ClinicDashboardScreen(currentLanguage: lang),
      FarmProfileScreen(currentLanguage: lang),
    ];

    final currentLangObj = AppLocalizations.languages.firstWhere(
      (l) => l.code == lang,
      orElse: () => AppLocalizations.languages[0],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppLocalizations.get('appName', lang),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        actions: [
          // UI Scaling Toggle Button
          IconButton(
            tooltip: '${AppLocalizations.get('uiScale', lang)}: ${uiScale == 0.85 ? 'Compact' : uiScale == 1.15 ? 'Large' : 'Standard'}',
            icon: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.format_size, color: Colors.white, size: 22),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: AppColors.harvestGold,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      uiScale == 0.85 ? 'S' : uiScale == 1.15 ? 'L' : 'M',
                      style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () => ref.read(uiScaleProvider.notifier).cycleScale(),
          ),

          // Persistent Global Language Switcher Pill
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => _showLanguageModal(context),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white38),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.language, color: Colors.white, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      currentLangObj.nameNative,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: IndexedStack(
        index: currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (idx) => ref.read(activeTabProvider.notifier).state = idx,
        backgroundColor: Colors.white,
        indicatorColor: AppColors.lightLeafTint,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.camera_alt_outlined),
            selectedIcon: const Icon(Icons.camera_alt, color: AppColors.primaryGreen),
            label: AppLocalizations.get('navCamera', lang),
          ),
          NavigationDestination(
            icon: const Icon(Icons.medication_liquid_outlined),
            selectedIcon: const Icon(Icons.medication_liquid, color: AppColors.primaryGreen),
            label: AppLocalizations.get('navRx', lang),
          ),
          NavigationDestination(
            icon: const Icon(Icons.local_hospital_outlined),
            selectedIcon: const Icon(Icons.local_hospital, color: AppColors.primaryGreen),
            label: AppLocalizations.get('navClinic', lang),
          ),
          NavigationDestination(
            icon: const Icon(Icons.terrain_outlined),
            selectedIcon: const Icon(Icons.terrain, color: AppColors.primaryGreen),
            label: AppLocalizations.get('navFarm', lang),
          ),
        ],
      ),
    );
  }

  void _showLanguageModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final currentLang = ref.watch(localeProvider);
        return Container(
          padding: const EdgeInsets.all(20),
          height: MediaQuery.of(context).size.height * 0.75,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppLocalizations.get('selectLanguage', currentLang),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(),
              Expanded(
                child: ListView.builder(
                  itemCount: AppLocalizations.languages.length,
                  itemBuilder: (ctx, i) {
                    final item = AppLocalizations.languages[i];
                    final isSelected = item.code == currentLang;
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isSelected ? AppColors.primaryGreen : AppColors.divider,
                        foregroundColor: isSelected ? Colors.white : AppColors.textPrimary,
                        child: Text(item.code.toUpperCase().substring(0, item.code.length > 2 ? 2 : item.code.length)),
                      ),
                      title: Text(item.nameNative, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(item.nameEnglish),
                      trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primaryGreen) : null,
                      onTap: () {
                        ref.read(localeProvider.notifier).setLocale(item.code);
                        Navigator.pop(ctx);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
