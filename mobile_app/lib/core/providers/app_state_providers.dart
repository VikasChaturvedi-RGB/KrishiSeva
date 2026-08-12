import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';

// Locale State Notifier
class LocaleNotifier extends StateNotifier<String> {
  LocaleNotifier() : super('hi');

  void setLocale(String languageCode) {
    state = languageCode;
    ApiClient().setLanguage(languageCode);
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, String>((ref) {
  return LocaleNotifier();
});

// UI Scale State Notifier (Compact: 0.85, Standard: 1.0, Large: 1.15)
class UiScaleNotifier extends StateNotifier<double> {
  UiScaleNotifier() : super(1.0);

  void setScale(double scale) {
    state = scale;
  }

  void cycleScale() {
    if (state == 1.0) {
      state = 1.15; // Large
    } else if (state == 1.15) {
      state = 0.85; // Compact
    } else {
      state = 1.0;  // Standard
    }
  }
}

final uiScaleProvider = StateNotifierProvider<UiScaleNotifier, double>((ref) {
  return UiScaleNotifier();
});

// Network State Notifier (Online / Offline Queue simulation)
class NetworkNotifier extends StateNotifier<bool> {
  NetworkNotifier() : super(true); // true = online

  void toggle() {
    state = !state;
  }
}

final networkStateProvider = StateNotifierProvider<NetworkNotifier, bool>((ref) {
  return NetworkNotifier();
});

// Auth & Farmer Profile State
class AuthSessionState {
  final bool isAuthenticated;
  final bool isNewFarmer;
  final String? mobileNumber;
  final String? fullName;
  final String? pincode;
  final String? stateName;
  final String? district;
  final String? taluk;
  final String? village;
  final String? token;

  const AuthSessionState({
    this.isAuthenticated = false,
    this.isNewFarmer = false,
    this.mobileNumber,
    this.fullName,
    this.pincode,
    this.stateName,
    this.district,
    this.taluk,
    this.village,
    this.token,
  });

  AuthSessionState copyWith({
    bool? isAuthenticated,
    bool? isNewFarmer,
    String? mobileNumber,
    String? fullName,
    String? pincode,
    String? stateName,
    String? district,
    String? taluk,
    String? village,
    String? token,
  }) {
    return AuthSessionState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isNewFarmer: isNewFarmer ?? this.isNewFarmer,
      mobileNumber: mobileNumber ?? this.mobileNumber,
      fullName: fullName ?? this.fullName,
      pincode: pincode ?? this.pincode,
      stateName: stateName ?? this.stateName,
      district: district ?? this.district,
      taluk: taluk ?? this.taluk,
      village: village ?? this.village,
      token: token ?? this.token,
    );
  }
}

class AuthSessionNotifier extends StateNotifier<AuthSessionState> {
  AuthSessionNotifier() : super(const AuthSessionState());

  void setAuthenticated({
    required String mobileNumber,
    String? fullName,
    String? token,
    String? pincode,
    String? stateName,
    String? district,
    String? taluk,
    String? village,
  }) {
    if (token != null) {
      ApiClient().setToken(token);
    }
    state = AuthSessionState(
      isAuthenticated: true,
      isNewFarmer: false,
      mobileNumber: mobileNumber,
      fullName: fullName ?? 'Ramesh Patel',
      pincode: pincode ?? '456665',
      stateName: stateName ?? 'Madhya Pradesh',
      district: district ?? 'Ujjain',
      taluk: taluk ?? 'Tarana',
      village: village ?? 'Tarana',
      token: token,
    );
  }

  void promptNewFarmerOnboarding({required String mobileNumber}) {
    state = AuthSessionState(
      isAuthenticated: false,
      isNewFarmer: true,
      mobileNumber: mobileNumber,
    );
  }

  void logout() {
    state = const AuthSessionState();
  }
}

final authSessionProvider = StateNotifierProvider<AuthSessionNotifier, AuthSessionState>((ref) {
  return AuthSessionNotifier();
});

// Active Bottom Navigation Tab
final activeTabProvider = StateProvider<int>((ref) => 0);
