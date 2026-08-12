import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';

class AgronomistEscalationScreen extends StatefulWidget {
  final dynamic escalationDetails;
  final String currentLanguage;
  final VoidCallback onNewScan;

  const AgronomistEscalationScreen({
    Key? key,
    required this.escalationDetails,
    required this.currentLanguage,
    required this.onNewScan,
  }) : super(key: key);

  @override
  State<AgronomistEscalationScreen> createState() => _AgronomistEscalationScreenState();
}

class _AgronomistEscalationScreenState extends State<AgronomistEscalationScreen> {
  late int _remainingMinutes;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingMinutes = widget.escalationDetails['timeRemainingMinutes'] ?? 110;
    _timer = Timer.periodic(const Duration(minutes: 1), (t) {
      if (_remainingMinutes > 0) {
        setState(() => _remainingMinutes--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;
    final agronomistName = widget.escalationDetails['assignedAgronomistName'] ?? 'Dr. Suresh Verma (Senior Agronomist, KVK)';

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('escalationTitle', lang)),
        backgroundColor: AppColors.soilBrown,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // SLA Countdown Timer Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.soilBrown, AppColors.clayBrown],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.soilBrown.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Column(
                children: [
                  const Icon(Icons.timer, color: AppColors.harvestGold, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    AppLocalizations.get('slaCountdown', lang),
                    style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$_remainingMinutes ${AppLocalizations.get('minutesRemaining', lang)}',
                    style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    lang == 'en'
                        ? 'Specialist diagnosis and digital prescription guaranteed within 2 hours'
                        : '2 घंटे के भीतर विशेषज्ञ द्वारा पर्चा तैयार किया जाएगा',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Assigned Specialist Profile Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.get('assignedSpecialist', lang),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 26,
                          backgroundColor: AppColors.lightLeafTint,
                          child: Icon(Icons.psychology, color: AppColors.primaryGreen, size: 32),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(agronomistName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(height: 2),
                              const Text('ICAR-KVK Plant Pathology Division', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 2),
                              const Text('Specialization: Soybean & Pulse Nutrition', style: TextStyle(color: AppColors.primaryGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

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
}
