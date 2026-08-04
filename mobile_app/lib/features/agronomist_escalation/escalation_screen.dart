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
        title: const Text('कृषि वैज्ञानिक को अग्रेषित (Escalated)'),
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
                  const Text(
                    'मानव कृषि वैज्ञानिक SLA गारंटी',
                    style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$_remainingMinutes मिनट शेष',
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '2 घंटे के भीतर विशेषज्ञ द्वारा पर्चा तैयार किया जाएगा',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Assigned Specialist Profile Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 28,
                      backgroundColor: AppColors.lightLeafTint,
                      child: Icon(Icons.person, color: AppColors.primaryGreen, size: 36),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('नियुक्त पादप रोग विशेषज्ञ:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          const SizedBox(height: 2),
                          Text(agronomistName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.lightLeafTint,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('समीक्षा जारी (Under Review)', style: TextStyle(color: AppColors.primaryGreen, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Status Notice
            Card(
              color: AppColors.background,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: AppColors.primaryGreen, size: 20),
                        SizedBox(width: 8),
                        Text('यह केस क्यों अग्रेषित हुआ?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      'AI मॉडल ने पाया कि लक्षण मिश्रित हैं (जिंक की कमी बनाम रस्ट फफूंद)। गलत कीटनाशक के छिड़काव से फसल को नुकसान न हो, इसलिए KVK विशेषज्ञ इसकी स्वयं जांच कर रहे हैं।',
                      style: TextStyle(fontSize: 13, height: 1.4, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            ElevatedButton.icon(
              icon: const Icon(Icons.call),
              label: const Text('KVK हेल्पलाइन से बात करें'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.soilBrown),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('किसान कॉल सेंटर 1800-180-1551 से कनेक्ट हो रहा है...')),
                );
              },
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('अन्य पत्ती का फोटो लें'),
              onPressed: widget.onNewScan,
            ),
          ],
        ),
      ),
    );
  }
}
