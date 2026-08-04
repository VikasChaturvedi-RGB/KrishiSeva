import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';

class AuthConsentScreen extends StatefulWidget {
  final VoidCallback onAuthenticated;
  final String currentLanguage;
  final Function(String) onLanguageChange;

  const AuthConsentScreen({
    Key? key,
    required this.onAuthenticated,
    required this.currentLanguage,
    required this.onLanguageChange,
  }) : super(key: key);

  @override
  State<AuthConsentScreen> createState() => _AuthConsentScreenState();
}

class _AuthConsentScreenState extends State<AuthConsentScreen> {
  final TextEditingController _mobileController = TextEditingController(text: '9876543210');
  final TextEditingController _otpController = TextEditingController(text: '123456');

  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _sessionId;
  
  // DPDP Consent Checkboxes
  bool _consentAdvisory = true;
  bool _consentWeather = true;
  bool _consentSoil = true;
  bool _consentEscalation = true;

  Future<void> _handleSendOtp() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.post('/auth/otp/request', data: {
        'mobileNumber': _mobileController.text.trim(),
        'channel': 'SMS',
        'preferredLanguage': widget.currentLanguage,
      });
      setState(() {
        _isOtpSent = true;
        _sessionId = res.data['sessionId'];
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to ${_mobileController.text}. (Demo OTP: 123456)'),
          backgroundColor: AppColors.primaryGreen,
        ),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      // Fallback for offline demo
      setState(() {
        _isOtpSent = true;
        _sessionId = 'demo-session-id';
      });
    }
  }

  Future<void> _handleVerifyOtp() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.post('/auth/otp/verify', data: {
        'sessionId': _sessionId ?? 'demo-session-id',
        'mobileNumber': _mobileController.text.trim(),
        'otp': _otpController.text.trim(),
        'dpdpConsent': {
          'privacyPolicyVersion': 'v2026.1',
          'consentTimestamp': DateTime.now().toUtc().toIso8601String(),
          'languageCode': widget.currentLanguage,
          'consentedPurposes': [
            if (_consentAdvisory) 'AGRONOMIC_DIAGNOSIS_AND_ADVISORY',
            if (_consentWeather) 'HYPERLOCAL_WEATHER_INTEGRATION',
            if (_consentSoil) 'SOIL_HEALTH_ANALYTICS',
            if (_consentEscalation) 'AGRI_CLINIC_EXPERT_ESCALATION',
          ],
        }
      });
      if (res.data['accessToken'] != null) {
        ApiClient().setToken(res.data['accessToken']);
      }
      widget.onAuthenticated();
    } catch (e) {
      // Local demo fallback
      widget.onAuthenticated();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.currentLanguage;
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('appName', lang)),
        actions: [
          IconButton(
            icon: const Icon(Icons.translate, color: Colors.white),
            tooltip: 'Change Language / भाषा बदलें',
            onPressed: () => _showLanguageModal(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.lightLeafTint,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.eco,
                  size: 64,
                  color: AppColors.primaryGreen,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              AppLocalizations.get('loginTitle', lang),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              AppLocalizations.get('loginSubtitle', lang),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 32),

            // Mobile Number Input Field
            TextField(
              controller: _mobileController,
              keyboardType: TextInputType.phone,
              enabled: !_isOtpSent,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.phone_android, color: AppColors.primaryGreen),
                prefixText: '+91 ',
                labelText: '10-Digit Mobile Number (मोबाइल नंबर)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),

            if (_isOtpSent) ...[
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.lock_clock, color: AppColors.primaryGreen),
                  labelText: 'Enter 6-Digit OTP (ओटीपी दर्ज करें)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),

              // DPDP Act 2023 Explicit Consent Card
              Card(
                color: AppColors.lightLeafTint,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.security, color: AppColors.primaryGreen, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'DPDP Act 2023 Data Consent (स्पष्ट सहमति)',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.get('dpdpConsentDesc', lang),
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const Divider(),
                      CheckboxListTile(
                        value: _consentAdvisory,
                        dense: true,
                        activeColor: AppColors.primaryGreen,
                        title: const Text('AI Crop Pathology & Advisory (फसल निदान)'),
                        onChanged: (v) => setState(() => _consentAdvisory = v ?? true),
                      ),
                      CheckboxListTile(
                        value: _consentWeather,
                        dense: true,
                        activeColor: AppColors.primaryGreen,
                        title: const Text('Hyperlocal Weather & Location (मौसम और स्थान)'),
                        onChanged: (v) => setState(() => _consentWeather = v ?? true),
                      ),
                      CheckboxListTile(
                        value: _consentSoil,
                        dense: true,
                        activeColor: AppColors.primaryGreen,
                        title: const Text('Soil Health Card Integration (मृदा परीक्षण कार्ड)'),
                        onChanged: (v) => setState(() => _consentSoil = v ?? true),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleVerifyOtp,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(AppLocalizations.get('verifyOtp', lang)),
              ),
            ] else ...[
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSendOtp,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(AppLocalizations.get('sendOtp', lang)),
              ),
            ],
          ],
        ),
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
        return Container(
          padding: const EdgeInsets.all(20),
          height: MediaQuery.of(context).size.height * 0.7,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select Language / भाषा चुनें (Top 20 Indian Languages)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  itemCount: AppLocalizations.languages.length,
                  itemBuilder: (ctx, i) {
                    final item = AppLocalizations.languages[i];
                    final isSelected = item.code == widget.currentLanguage;
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isSelected ? AppColors.primaryGreen : AppColors.divider,
                        foregroundColor: isSelected ? Colors.white : AppColors.textPrimary,
                        child: Text(item.code.toUpperCase().substring(0, 2)),
                      ),
                      title: Text(item.nameNative, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(item.nameEnglish),
                      trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primaryGreen) : null,
                      onTap: () {
                        widget.onLanguageChange(item.code);
                        ApiClient().setLanguage(item.code);
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
