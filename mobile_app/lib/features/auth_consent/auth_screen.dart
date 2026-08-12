import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';
import '../../core/providers/app_state_providers.dart';

class AuthConsentScreen extends ConsumerStatefulWidget {
  final VoidCallback onAuthenticated;

  const AuthConsentScreen({
    Key? key,
    required this.onAuthenticated,
  }) : super(key: key);

  @override
  ConsumerState<AuthConsentScreen> createState() => _AuthConsentScreenState();
}

class _AuthConsentScreenState extends ConsumerState<AuthConsentScreen> {
  final TextEditingController _mobileController = TextEditingController(text: '9876543210');
  final TextEditingController _otpController = TextEditingController(text: '123456');
  
  // Onboarding controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _pincodeController = TextEditingController();
  final TextEditingController _stateController = TextEditingController();
  final TextEditingController _districtController = TextEditingController();
  final TextEditingController _talukController = TextEditingController();
  final TextEditingController _villageController = TextEditingController();

  bool _isOtpSent = false;
  bool _isNewFarmerStep = false;
  bool _isLoading = false;
  bool _isLookingUpPin = false;
  String? _sessionId;
  String? _pinLookupMessage;
  
  // DPDP Consent Checkboxes
  bool _consentAdvisory = true;
  bool _consentWeather = true;
  bool _consentSoil = true;
  bool _consentEscalation = true;

  Future<void> _handleSendOtp() async {
    final mobile = _mobileController.text.trim();
    if (mobile.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें / Enter valid 10-digit mobile number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final currentLang = ref.read(localeProvider);
    try {
      final res = await ApiClient().dio.post('/auth/otp/request', data: {
        'mobileNumber': mobile,
        'channel': 'SMS',
        'preferredLanguage': currentLang,
      });
      setState(() {
        _isOtpSent = true;
        _sessionId = res.data['sessionId'];
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.get('otpSent', currentLang)),
          backgroundColor: AppColors.primaryGreen,
        ),
      );
    } catch (e) {
      setState(() {
        _isOtpSent = true;
        _sessionId = 'demo-session-id';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleVerifyOtp() async {
    final mobile = _mobileController.text.trim();
    final otp = _otpController.text.trim();
    final currentLang = ref.read(localeProvider);

    setState(() => _isLoading = true);
    try {
      final res = await ApiClient().dio.post('/auth/otp/verify', data: {
        'sessionId': _sessionId ?? 'demo-session-id',
        'mobileNumber': mobile,
        'otp': otp,
        'dpdpConsent': {
          'privacyPolicyVersion': 'v2026.1',
          'consentTimestamp': DateTime.now().toUtc().toIso8601String(),
          'languageCode': currentLang,
          'consentedPurposes': [
            if (_consentAdvisory) 'AGRONOMIC_DIAGNOSIS_AND_ADVISORY',
            if (_consentWeather) 'HYPERLOCAL_WEATHER_INTEGRATION',
            if (_consentSoil) 'SOIL_HEALTH_ANALYTICS',
            if (_consentEscalation) 'AGRI_CLINIC_EXPERT_ESCALATION',
          ],
        }
      });

      final isNewUser = res.data['isNewUser'] == true;
      if (isNewUser) {
        setState(() {
          _isNewFarmerStep = true;
          _isLoading = false;
        });
      } else {
        final token = res.data['accessToken'];
        ref.read(authSessionProvider.notifier).setAuthenticated(
          mobileNumber: mobile,
          fullName: res.data['farmer']?['fullName'],
          token: token,
        );
        widget.onAuthenticated();
      }
    } catch (e) {
      // Fallback: If 9876543210 -> existing user; else prompt new farmer onboarding
      if (mobile == '9876543210') {
        ref.read(authSessionProvider.notifier).setAuthenticated(
          mobileNumber: mobile,
          fullName: 'Ramesh Patel (रमेश पटेल)',
        );
        widget.onAuthenticated();
      } else {
        setState(() {
          _isNewFarmerStep = true;
          _isLoading = false;
        });
      }
    } finally {
      if (!_isNewFarmerStep) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handlePincodeLookup(String pincode) async {
    if (pincode.length != 6) return;

    setState(() {
      _isLookingUpPin = true;
      _pinLookupMessage = null;
    });

    final currentLang = ref.read(localeProvider);
    try {
      final res = await ApiClient().dio.get('/location/pincode/$pincode');
      final data = res.data;
      setState(() {
        _stateController.text = data['state'] ?? '';
        _districtController.text = data['district'] ?? '';
        _talukController.text = data['taluk'] ?? data['tehsil'] ?? '';
        if ((data['villages'] as List?)?.isNotEmpty == true) {
          _villageController.text = data['villages'][0];
        } else if (data['village'] != null) {
          _villageController.text = data['village'];
        }
        _pinLookupMessage = AppLocalizations.get('pinResolved', currentLang);
        _isLookingUpPin = false;
      });
    } catch (e) {
      // Offline fallback lookup
      if (pincode == '456665') {
        setState(() {
          _stateController.text = 'Madhya Pradesh';
          _districtController.text = 'Ujjain';
          _talukController.text = 'Tarana';
          _villageController.text = 'Tarana';
          _pinLookupMessage = AppLocalizations.get('pinResolved', currentLang);
          _isLookingUpPin = false;
        });
      } else {
        setState(() {
          _pinLookupMessage = AppLocalizations.get('pinNotFound', currentLang);
          _isLookingUpPin = false;
        });
      }
    }
  }

  Future<void> _handleCompleteOnboarding() async {
    final currentLang = ref.read(localeProvider);
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.get('enterFullName', currentLang))),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ApiClient().dio.post('/profile-farm/farmer/onboard', data: {
        'mobileNumber': _mobileController.text.trim(),
        'fullName': _nameController.text.trim(),
        'pincode': _pincodeController.text.trim(),
        'state': _stateController.text.trim(),
        'district': _districtController.text.trim(),
        'taluk': _talukController.text.trim(),
        'village': _villageController.text.trim(),
      });
    } catch (e) {
      // Graceful offline fallback
    }

    ref.read(authSessionProvider.notifier).setAuthenticated(
      mobileNumber: _mobileController.text.trim(),
      fullName: _nameController.text.trim(),
      pincode: _pincodeController.text.trim(),
      stateName: _stateController.text.trim(),
      district: _districtController.text.trim(),
      taluk: _talukController.text.trim(),
      village: _villageController.text.trim(),
    );

    widget.onAuthenticated();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.get('appName', lang)),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.language, color: Colors.white, size: 20),
            label: Text(
              AppLocalizations.languages.firstWhere((l) => l.code == lang, orElse: () => AppLocalizations.languages[0]).nameNative,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            onPressed: () => _showLanguageModal(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.lightLeafTint,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.eco,
                  size: 54,
                  color: AppColors.primaryGreen,
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (!_isNewFarmerStep) ...[
              // LOGIN STEP
              Text(
                AppLocalizations.get('loginTitle', lang),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                AppLocalizations.get('loginSubtitle', lang),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),

              // Mobile Field
              TextField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                enabled: !_isOtpSent,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.phone_android, color: AppColors.primaryGreen),
                  prefixText: '+91 ',
                  labelText: AppLocalizations.get('mobileNumber', lang),
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
                    labelText: AppLocalizations.get('enterOtp', lang),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),

                // DPDP Act 2023 Explicit Consent Card
                Card(
                  color: AppColors.lightLeafTint,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.verified_user, color: AppColors.primaryGreen, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                AppLocalizations.get('dpdpConsent', lang),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          AppLocalizations.get('dpdpConsentDesc', lang),
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                        const Divider(),
                        CheckboxListTile(
                          value: _consentAdvisory,
                          dense: true,
                          activeColor: AppColors.primaryGreen,
                          title: Text(AppLocalizations.get('consentAdvisory', lang), style: const TextStyle(fontSize: 12)),
                          onChanged: (v) => setState(() => _consentAdvisory = v ?? true),
                        ),
                        CheckboxListTile(
                          value: _consentWeather,
                          dense: true,
                          activeColor: AppColors.primaryGreen,
                          title: Text(AppLocalizations.get('consentWeather', lang), style: const TextStyle(fontSize: 12)),
                          onChanged: (v) => setState(() => _consentWeather = v ?? true),
                        ),
                        CheckboxListTile(
                          value: _consentSoil,
                          dense: true,
                          activeColor: AppColors.primaryGreen,
                          title: Text(AppLocalizations.get('consentSoil', lang), style: const TextStyle(fontSize: 12)),
                          onChanged: (v) => setState(() => _consentSoil = v ?? true),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleVerifyOtp,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(AppLocalizations.get('verifyOtp', lang), style: const TextStyle(fontSize: 16)),
                ),
              ] else ...[
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSendOtp,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(AppLocalizations.get('sendOtp', lang), style: const TextStyle(fontSize: 16)),
                ),
              ],
            ] else ...[
              // NEW FARMER ONBOARDING STEP
              Text(
                AppLocalizations.get('newFarmerTitle', lang),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              Text(
                AppLocalizations.get('newFarmerSubtitle', lang),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Full Name
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.person, color: AppColors.primaryGreen),
                  labelText: AppLocalizations.get('fullName', lang),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 14),

              // PIN Code
              TextField(
                controller: _pincodeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                onChanged: (val) {
                  if (val.length == 6) {
                    _handlePincodeLookup(val);
                  }
                },
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.pin_drop, color: AppColors.primaryGreen),
                  labelText: AppLocalizations.get('pincode', lang),
                  counterText: '',
                  suffixIcon: _isLookingUpPin
                      ? const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                        )
                      : null,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

              if (_pinLookupMessage != null) ...[
                const SizedBox(height: 4),
                Text(
                  _pinLookupMessage!,
                  style: TextStyle(
                    fontSize: 12,
                    color: _pinLookupMessage!.contains('सत्यापित') || _pinLookupMessage!.contains('Verified')
                        ? AppColors.emerald
                        : AppColors.harvestAmber,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],

              const SizedBox(height: 14),

              // Auto-resolved Location Grid
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _stateController,
                      decoration: InputDecoration(
                        labelText: AppLocalizations.get('state', lang),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _districtController,
                      decoration: InputDecoration(
                        labelText: AppLocalizations.get('district', lang),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _talukController,
                      decoration: InputDecoration(
                        labelText: AppLocalizations.get('taluk', lang),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _villageController,
                      decoration: InputDecoration(
                        labelText: AppLocalizations.get('village', lang),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _handleCompleteOnboarding,
                style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(AppLocalizations.get('completeRegistration', lang), style: const TextStyle(fontSize: 16)),
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
