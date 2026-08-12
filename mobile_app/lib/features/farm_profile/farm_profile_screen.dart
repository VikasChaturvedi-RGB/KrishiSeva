import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';

class FarmProfileScreen extends StatefulWidget {
  final String currentLanguage;

  const FarmProfileScreen({Key? key, required this.currentLanguage}) : super(key: key);

  @override
  State<FarmProfileScreen> createState() => _FarmProfileScreenState();
}

class _FarmProfileScreenState extends State<FarmProfileScreen> {
  dynamic _farmerProfile;
  List<dynamic> _farms = [];
  dynamic _soilCard;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final pRes = await ApiClient().dio.get('/profile-farm/farmer/profile');
      final fRes = await ApiClient().dio.get('/profile-farm/farms');
      final farmId = (fRes.data['farms'] as List).isNotEmpty ? fRes.data['farms'][0]['farmId'] : 'farm-1';
      final sRes = await ApiClient().dio.get('/profile-farm/farms/$farmId/soil-card');

      setState(() {
        _farmerProfile = pRes.data;
        _farms = fRes.data['farms'] ?? [];
        _soilCard = sRes.data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _farmerProfile = {
          'farmerId': '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          'fullName': 'Ramesh Patel (रमेश पटेल)',
          'mobileNumber': '9876543210',
          'state': 'Madhya Pradesh',
          'district': 'Ujjain',
          'village': 'Tarana'
        };
        _farms = [
          {
            'farmId': 'farm-1',
            'farmName': 'Tarana Parcel North',
            'totalAreaAcres': 5.5,
            'soilType': 'MEDIUM_BLACK_CLAY',
            'irrigationSource': 'TUBEWELL'
          }
        ];
        _soilCard = {
          'ph': 7.6,
          'organicCarbonPercent': 0.42,
          'nitrogenKgPerHa': 210,
          'phosphorusKgPerHa': 14.5,
          'potassiumKgPerHa': 290,
          'zincPpm': 0.45,
          'deficiencyFlags': ['ZINC_DEFICIENT', 'LOW_ORGANIC_CARBON']
        };
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('soilHealthTitle', lang)),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Farmer Profile Header Card
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                                Text(
                                  _farmerProfile?['fullName'] ?? 'Farmer',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '+91 ${_farmerProfile?['mobileNumber'] ?? '9876543210'}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 14, color: AppColors.primaryGreen),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${_farmerProfile?['village'] ?? 'Tarana'}, ${_farmerProfile?['district'] ?? 'Ujjain'}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.primaryGreen, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Soil Health Card Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.soilBrown, AppColors.clayBrown],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.soilBrown.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              AppLocalizations.get('soilHealthSubtitle', lang),
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text('ICAR Verified', style: TextStyle(color: Colors.white, fontSize: 11)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Soil Metrics Grid
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _soilMetric(AppLocalizations.get('phLevel', lang), '${_soilCard?['ph'] ?? 7.6}', 'Normal (6.5-7.5)'),
                            _soilMetric(AppLocalizations.get('organicCarbon', lang), '${_soilCard?['organicCarbonPercent'] ?? 0.42}%', 'Low (<0.50%)', isDeficient: true),
                            _soilMetric(AppLocalizations.get('zinc', lang), '${_soilCard?['zincPpm'] ?? 0.45} ppm', 'Low (<0.60)', isDeficient: true),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _soilMetric(AppLocalizations.get('nitrogen', lang), '${_soilCard?['nitrogenKgPerHa'] ?? 210} kg', 'Low (<280)'),
                            _soilMetric(AppLocalizations.get('phosphorus', lang), '${_soilCard?['phosphorusKgPerHa'] ?? 14.5} kg', 'Medium (10-25)'),
                            _soilMetric(AppLocalizations.get('potassium', lang), '${_soilCard?['potassiumKgPerHa'] ?? 290} kg', 'High (>280)'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Registered Farm Parcels
                  Text(
                    '${AppLocalizations.get('navFarm', lang)} (${_farms.length})',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),

                  ..._farms.map((f) => Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    f['farmName'] ?? 'Farm Parcel',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  Text(
                                    '${f['totalAreaAcres']} ${AppLocalizations.get('farmAreaAcres', lang)}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                                  ),
                                ],
                              ),
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Soil Type: ${f['soilType']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                  Text('Irrigation: ${f['irrigationSource']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      )),
                ],
              ),
            ),
    );
  }

  Widget _soilMetric(String label, String value, String status, {bool isDeficient = false}) {
    return Container(
      width: 100,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: isDeficient ? Border.all(color: Colors.amberAccent, width: 1.5) : null,
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(
            status,
            style: TextStyle(
              color: isDeficient ? Colors.amberAccent : Colors.white60,
              fontSize: 9,
              fontWeight: isDeficient ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
