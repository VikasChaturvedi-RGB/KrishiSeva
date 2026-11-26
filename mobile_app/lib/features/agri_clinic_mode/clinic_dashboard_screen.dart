import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// 100% Non-Commercial B2C Self-Reliant Farming, Input Purity Testing & Free Govt Helpline Screen
/// Replaces the former retailer/clinic mode with pure farmer guidance (Zero Selling).
class ClinicDashboardScreen extends StatelessWidget {
  final String currentLanguage;

  const ClinicDashboardScreen({Key? key, required this.currentLanguage}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isEn = currentLanguage == 'en';

    final diyRemedies = [
      {
        'title': isEn ? 'Neemastra (Home Pest Shield)' : 'नीमास्त्र (घरेलू कीट रक्षक घोल)',
        'dose': isEn ? '1.5L / 15L Knapsack Pump • Saves ₹1,350/acre' : '1.5 लीटर / 15L पंप • बचत ₹1,350/एकड़',
        'desc': isEn
            ? 'Ferment 5kg crushed Neem leaves + 5L cow urine + 1kg cow dung in 100L water in shade for 48h. Strain & spray against whitefly/aphids.'
            : '5 किलो कुचली नीम पत्ती + 5L गोमूत्र + 1 किलो गोबर को 100L पानी में छाया में 48 घंटे रखकर छानें व सफेद मक्खी पर शाम को छिड़कें।'
      },
      {
        'title': isEn ? 'Jeevamrut (Soil Carbon Booster)' : 'जीवामृत (मृदा जैविक कार्बन वर्धक)',
        'dose': isEn ? '200L/acre with irrigation • Saves ₹1,800/acre' : '200L/एकड़ सिंचाई के साथ • बचत ₹1,800/एकड़',
        'desc': isEn
            ? 'Mix 10kg cow dung, 10L cow urine, 1.5kg jaggery, 1.5kg pulse flour & handful of bund soil in 180L water for 4–5 days.'
            : '10 किलो गोबर, 10L गोमूत्र, 1.5 किलो गुड़, 1.5 किलो बेसन व एक मुट्ठी मेड़ की मिट्टी 180L पानी में 4–5 दिन छाया में तैयार करें।'
      },
    ];

    final purityTests = [
      {
        'title': isEn ? 'DAP Purity Test (Statutory MRP: ₹1,350/50kg)' : 'असली डी.ए.पी. पहचान (सरकारी MRP: ₹1,350/50kg)',
        'desc': isEn
            ? 'Rub 5 granules with slaked lime on palm: real DAP emits pungent ammonia smell; swells to double size on hot pan.'
            : 'हथेली पर 5 दाने चूने के साथ रगड़ने पर तेज अमोनिया गंध आती है और गर्म तवे पर दाने फूलकर दोगुने होते हैं।'
      },
      {
        'title': isEn ? 'Zinc Sulphate Test (Catch MgSO4 Fraud)' : 'असली जिंक सल्फेट जांच (मिलावट पकड़ें)',
        'desc': isEn
            ? 'Mix clear DAP water solution with Zinc Sulphate solution: real ZnSO4 immediately curdles into a thick white precipitate.'
            : 'डीएपी के साफ घोल में मिलाने पर असली जिंक सल्फेट तुरंत गाढ़ा सफेद दही जैसा थक्का बनाता है।'
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(isEn ? 'DIY Bio-Remedies & Input Purity' : 'घरेलू जैविक नुस्खे व असली खाद परख'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              isEn
                  ? '🛡️ 100% Free B2C Farmer Guide • We never sell seeds, fertilizers, or pesticides.'
                  : '🛡️ 100% निःशुल्क किसान मार्गदर्शक • हम कोई खाद, बीज या दवाई नहीं बेचते।',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isEn ? '🌿 On-Farm Natural Remedies' : '🌿 घरेलू जैविक समाधान विधि',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...diyRemedies.map((r) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text(r['dose']!, style: const TextStyle(color: AppColors.primaryGreen, fontSize: 12, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Text(r['desc']!, style: const TextStyle(fontSize: 12.5)),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 12),
          Text(
            isEn ? '🧪 2-Minute Home Fertilizer Purity Tests' : '🧪 2-मिनट में नकली खाद पहचानें',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...purityTests.map((t) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 6),
                      Text(t['desc']!, style: const TextStyle(fontSize: 12.5)),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 12),
          Card(
            color: Colors.green.shade50,
            child: ListTile(
              leading: const Icon(Icons.phone_in_talk, color: AppColors.primaryGreen),
              title: Text(
                isEn ? 'Free Govt Kisan Call Centre: 1800-180-1551' : 'निःशुल्क किसान कॉल सेंटर: 1800-180-1551',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
              ),
              subtitle: Text(
                isEn ? '6 AM – 10 PM • All 22 Indian Languages • ₹0 Fee' : 'सुबह 6 – रात 10 बजे • 22 भारतीय भाषाएं • ₹0 शुल्क',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
