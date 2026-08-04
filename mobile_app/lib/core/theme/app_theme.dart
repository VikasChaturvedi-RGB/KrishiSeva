import 'package:flutter/material.dart';

/// Nature-inspired high-contrast theme for Indian farmers and Agri-Clinics
/// Palette: Crop Leaf Green, Deep Soil Brown, Harvest Amber, Soft Field Tints
class AppColors {
  // Primary Greens
  static const Color primaryGreen = Color(0xFF1B5E20); // Deep Forest / Crop Green
  static const Color leafGreen = Color(0xFF2E7D32);    // Vibrant Leaf Green
  static const Color lightLeafTint = Color(0xFFE8F5E9);// Background Card Tint
  static const Color emerald = Color(0xFF388E3C);

  // Earth & Soil Tones
  static const Color soilBrown = Color(0xFF4E342E);    // Rich Loamy Soil
  static const Color clayBrown = Color(0xFF6D4C41);
  static const Color sandKhaki = Color(0xFFD7CCC8);

  // Harvest & Warning Tones
  static const Color harvestAmber = Color(0xFFF57C00); // Ripe Crop Amber
  static const Color harvestGold = Color(0xFFFFB300);
  static const Color warningOrange = Color(0xFFE65100);

  // Status & Priority Colors
  static const Color step1Nutrient = Color(0xFF2E7D32); // Step 1: Green
  static const Color step2Bio = Color(0xFFF57C00);      // Step 2: Amber
  static const Color step3Chemical = Color(0xFFC62828); // Step 3: Red (Caution)
  static const Color highConfidence = Color(0xFF2E7D32);
  static const Color mediumConfidence = Color(0xFFF57C00);
  static const Color lowConfidence = Color(0xFFD32F2F);

  // Neutral Tones
  static const Color background = Color(0xFFF7FAF7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1C2D1F);
  static const Color textSecondary = Color(0xFF4A634E);
  static const Color divider = Color(0xFFDCE7DC);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primaryGreen,
        primary: AppColors.primaryGreen,
        secondary: AppColors.soilBrown,
        tertiary: AppColors.harvestAmber,
        surface: AppColors.surface,
        background: AppColors.background,
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          letterSpacing: 0.2,
        ),
      ),
      cardTheme: CardTheme(
        color: AppColors.surface,
        elevation: 2,
        shadowColor: AppColors.primaryGreen.withOpacity(0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreen,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryGreen,
          side: const BorderSide(color: AppColors.primaryGreen, width: 2),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        headlineMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.normal, color: AppColors.textPrimary, height: 1.4),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.normal, color: AppColors.textSecondary),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      ),
    );
  }
}
