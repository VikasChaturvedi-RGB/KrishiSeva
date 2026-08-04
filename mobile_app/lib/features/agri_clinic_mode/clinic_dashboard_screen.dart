import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/network/api_client.dart';

class ClinicDashboardScreen extends StatefulWidget {
  final String currentLanguage;

  const ClinicDashboardScreen({Key? key, required this.currentLanguage}) : super(key: key);

  @override
  State<ClinicDashboardScreen> createState() => _ClinicDashboardScreenState();
}

class _ClinicDashboardScreenState extends State<ClinicDashboardScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _farmers = [];
  List<dynamic> _escalations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadClinicData();
  }

  Future<void> _loadClinicData() async {
    setState(() => _isLoading = true);
    try {
      final fRes = await ApiClient().dio.get('/profile-farm/clinic/farmers');
      final eRes = await ApiClient().dio.get('/diagnosis/escalation/queue');
      setState(() {
        _farmers = fRes.data['farmers'] ?? [];
        _escalations = eRes.data['items'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _farmers = [
          {
            'farmerId': '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
            'fullName': 'Ramesh Patel (रमेश पटेल)',
            'mobileNumber': '9876543210',
            'village': 'Tarana',
            'district': 'Ujjain',
            'totalAcreage': 5.5,
            'activeCrop': 'Soybean (JS 20-34)'
          },
          {
            'farmerId': '8a1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb55',
            'fullName': 'Suresh Dhakad (सुरेश धाकड़)',
            'mobileNumber': '9826012345',
            'village': 'Mahidpur',
            'district': 'Ujjain',
            'totalAcreage': 8.0,
            'activeCrop': 'Cotton (Bt-II)'
          }
        ];
        _escalations = [
          {
            'escalationId': '9ea85f64-5717-4562-b3fc-2c963f66af99',
            'farmerName': 'Ramesh Patel',
            'cropName': 'Soybean',
            'aiTentativePrediction': 'Zinc Deficiency vs Rust (52% ambiguous)',
            'slaRemainingMinutes': 105,
            'status': 'PENDING_ASSIGNMENT'
          }
        ];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('कृषि-क्लिनिक एवं केंद्र डैशबोर्ड (Pro Clinic)'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : RefreshIndicator(
              onRefresh: _loadClinicData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Clinic Header Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.soilBrown,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.local_hospital, color: Colors.white, size: 36),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'कृषक सेवा केंद्र एवं एग्री-क्लिनिक #MP-41',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'CIB&RC अधिकृत | सॉइल हेल्थ कार्ड लिंक्ड',
                                  style: TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Active Agronomist Escalations (SLA Alert Queue)
                    if (_escalations.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'SLA विशेषज्ञ कतार (Pending Escalations)',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.soilBrown),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(12)),
                            child: Text(
                              '${_escalations.length} Active',
                              style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          )
                        ],
                      ),
                      const SizedBox(height: 10),
                      ..._escalations.map((esc) => Card(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Colors.redAccent, width: 1),
                            ),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFFFEBEE),
                                child: Icon(Icons.timer, color: Colors.red),
                              ),
                              title: Text('${esc['farmerName']} - ${esc['cropName']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('${esc['aiTentativePrediction']}\nSLA शेष: ${esc['slaRemainingMinutes']} मिनट'),
                              trailing: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryGreen,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                child: const Text('समीक्षा करें', style: TextStyle(fontSize: 12)),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('कृषि वैज्ञानिक समीक्षा विंडो खुली...')),
                                  );
                                },
                              ),
                            ),
                          )),
                      const SizedBox(height: 20),
                    ],

                    // Farmer Portfolio Search
                    const Text(
                      'पंजीकृत किसान पोर्टफोलियो (Farmers)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.soilBrown),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'किसान का नाम या मोबाइल नंबर खोजें...',
                        prefixIcon: const Icon(Icons.search, color: AppColors.primaryGreen),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.divider)),
                      ),
                      onChanged: (val) {
                        // Dynamic filter simulation
                      },
                    ),
                    const SizedBox(height: 12),

                    ..._farmers.map((farmer) => Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(farmer['fullName'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(color: AppColors.lightLeafTint, borderRadius: BorderRadius.circular(8)),
                                      child: Text('${farmer['totalAcreage']} एकड़', style: const TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12)),
                                    )
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text('मोबाइल: +91-${farmer['mobileNumber']} | गाँव: ${farmer['village']}, ${farmer['district']}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text('वर्तमान फसल: ${farmer['activeCrop']}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.soilBrown)),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        icon: const Icon(Icons.camera_alt, size: 16),
                                        label: const Text('जांच पर्चा बनाएँ', style: TextStyle(fontSize: 12)),
                                        onPressed: () {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text('${farmer['fullName']} के लिए त्वरित जांच प्रारंभ')),
                                          );
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    ElevatedButton.icon(
                                      icon: const Icon(Icons.picture_as_pdf, size: 16),
                                      label: const Text('PDF पर्चा', style: TextStyle(fontSize: 12)),
                                      onPressed: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('अधिकृत कृषि-क्लिनिक PDF पर्चा तैयार हो रहा है...')),
                                        );
                                      },
                                    )
                                  ],
                                )
                              ],
                            ),
                          ),
                        )),
                  ],
                ),
              ),
            ),
    );
  }
}
