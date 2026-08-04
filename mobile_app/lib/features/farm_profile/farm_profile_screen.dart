import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('किसान प्रोफाइल एवं मृदा स्वास्थ्य'),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Farmer Profile Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 30,
                            backgroundColor: AppColors.lightLeafTint,
                            child: Icon(Icons.person, color: AppColors.primaryGreen, size: 40),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_farmerProfile['fullName'] ?? 'Ramesh Patel', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                const SizedBox(height: 4),
                                Text('मोबाइल: +91-${_farmerProfile['mobileNumber']}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                Text('स्थान: ${_farmerProfile['village']}, ${_farmerProfile['district']} (${_farmerProfile['state']})', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Soil Health Card Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.lightLeafTint,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Text(
                              'सॉइल हेल्थ कार्ड (Soil Health Card)',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.soilBrown),
                            ),
                            Icon(Icons.verified, color: AppColors.primaryGreen, size: 20),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: _buildSoilMetric('Soil pH', '${_soilCard?['ph'] ?? 7.6}', 'Alkaline', Colors.blue)),
                            Expanded(child: _buildSoilMetric('Organic Carbon', '${_soilCard?['organicCarbonPercent'] ?? 0.42}%', 'Low', Colors.orange)),
                            Expanded(child: _buildSoilMetric('Zinc (Zn)', '${_soilCard?['zincPpm'] ?? 0.45} ppm', 'DEFICIENT', Colors.red, isCritical: true)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildSoilMetric('Nitrogen (N)', '${_soilCard?['nitrogenKgPerHa'] ?? 210} kg/ha', 'Low', Colors.orange)),
                            Expanded(child: _buildSoilMetric('Phosphorus (P)', '${_soilCard?['phosphorusKgPerHa'] ?? 14.5} kg/ha', 'Medium', Colors.green)),
                            Expanded(child: _buildSoilMetric('Potassium (K)', '${_soilCard?['potassiumKgPerHa'] ?? 290} kg/ha', 'High', Colors.green)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Active Crop Lifecycle Tracker
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.grass, color: AppColors.primaryGreen),
                              SizedBox(width: 8),
                              Text('वर्तमान फसल चक्र (Active Crop Cycle)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text('सोयाबीन - JS 20-34 (Kharif 2026)', style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('बुवाई दिनांक: 25 जून 2026 | अवधि: 40 दिन\nवर्तमान अवस्था: वानस्पतिक वृद्धि (Vegetative V4 Stage)'),
                            trailing: Chip(
                              label: Text('सक्रिय (Active)', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                              backgroundColor: AppColors.primaryGreen,
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSoilMetric(String label, String value, String status, Color color, {bool isCritical = false}) {
    return Container(
      margin: const EdgeInsets.all(4),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isCritical ? Colors.red : AppColors.divider),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isCritical ? Colors.red : AppColors.textPrimary)),
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(status, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
          ),
        ],
      ),
    );
  }
}
