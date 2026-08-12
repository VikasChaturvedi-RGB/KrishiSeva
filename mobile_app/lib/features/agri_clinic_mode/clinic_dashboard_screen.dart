import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
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
  String _filterQuery = '';

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
    final lang = widget.currentLanguage;
    final filteredFarmers = _farmers.where((f) {
      final name = (f['fullName'] ?? '').toString().toLowerCase();
      final mobile = (f['mobileNumber'] ?? '').toString();
      final village = (f['village'] ?? '').toString().toLowerCase();
      final q = _filterQuery.toLowerCase();
      return name.contains(q) || mobile.contains(q) || village.contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('clinicTitle', lang)),
        backgroundColor: AppColors.soilBrown,
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
                        children: [
                          const Icon(Icons.local_hospital, color: Colors.white, size: 36),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  AppLocalizations.get('clinicTitle', lang),
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  AppLocalizations.get('clinicSubtitle', lang),
                                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Search Bar
                    TextField(
                      controller: _searchController,
                      onChanged: (v) => setState(() => _filterQuery = v),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search, color: AppColors.soilBrown),
                        hintText: AppLocalizations.get('searchFarmer', lang),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.divider),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Escalated SLA Queue Card
                    if (_escalations.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppLocalizations.get('escalatedQueue', lang),
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.red),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_escalations.length} Active',
                              style: TextStyle(color: Colors.red.shade900, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ..._escalations.map((e) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(color: Colors.red.shade200),
                            ),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                                child: Icon(Icons.support_agent, size: 20),
                              ),
                              title: Text(e['farmerName'] ?? 'Farmer', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('${e['cropName']} - ${e['aiTentativePrediction']}'),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.timer, color: Colors.red, size: 18),
                                  Text(
                                    '${e['slaRemainingMinutes']}m',
                                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          )),
                      const SizedBox(height: 16),
                    ],

                    // Registered Farmers List
                    Text(
                      '${AppLocalizations.get('activeFarmers', lang)} (${filteredFarmers.length})',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),

                    ...filteredFarmers.map((f) => Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(14.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      f['fullName'] ?? 'Farmer',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.lightLeafTint,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '${f['totalAcreage']} ${AppLocalizations.get('farmAreaAcres', lang)}',
                                        style: const TextStyle(color: AppColors.primaryGreen, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.phone, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('+91 ${f['mobileNumber']}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                    const SizedBox(width: 12),
                                    const Icon(Icons.location_on, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('${f['village']}, ${f['district']}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Active Crop: ${f['activeCrop']}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                  ),
                                ),
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
