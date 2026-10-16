import 'package:flutter/material.dart';

class AppColors {
  // Brand Palette - Dreamy, Twilight, & Warm Accents
  static const Color primary = Color(0xFF7C3AED); // Radiant Violet
  static const Color primaryLight = Color(0xFFA78BFA); // Soft Lavender
  static const Color primaryDark = Color(0xFF5B21B6); // Deep Indigo
  static const Color periwinkle = Color(0xFFA5B4FC); // Celestial Periwinkle
  static const Color lavenderGlow = Color(0xFFC4B5FD); // Luminous Lavender
  
  static const Color secondary = Color(0xFFEC4899); // Rose Pink
  static const Color secondaryLight = Color(0xFFF472B6); // Soft Pink
  static const Color warmCream = Color(0xFFFFFBEB); // Warm Cream
  static const Color creamCard = Color(0xFFFDFBF7); // Cozy Light Cream
  
  static const Color accent = Color(0xFF06B6D4); // Soft Cyan / Sky
  static const Color accentMint = Color(0xFF10B981); // Emerald / Mint
  static const Color accentAmber = Color(0xFFF59E0B); // Warm Sun / Gold
  static const Color coralPeach = Color(0xFFFB7185); // Gentle Coral
  static const Color accentCoral = Color(0xFFFB7185); // Warm Coral / Rose Accent

  // Backgrounds - Dreamy Deep & Cozy Light
  static const Color backgroundDark = Color(0xFF0A071A); // Deepest Midnight Indigo
  static const Color deepTwilight = Color(0xFF120C29); // Rich Twilight Depth
  static const Color surfaceDark = Color(0xFF17112E); // Dark Lavender Surface
  static const Color surfaceLightDark = Color(0xFF221A42); // Elevated Card Dark
  static const Color surfaceCardDark = Color(0xFF1D1638); // Card Container Dark
  static const Color borderDark = Color(0xFF2E2356); // Subtle Glowing Border
  static const Color borderLightDark = Color(0xFF3F3172); // Active Border

  // Glassmorphic Accents
  static const Color glassSurface = Color(0x18FFFFFF); // Frosted Glass Fill
  static const Color glassBorder = Color(0x28FFFFFF); // Frosted Border
  static const Color glassHighlight = Color(0x38FFFFFF); // Top Specular Sheen

  static const Color backgroundLight = Color(0xFFF8F7FF); // Pure Lavender Tint
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceElevatedLight = Color(0xFFF1EEFD);
  static const Color borderLight = Color(0xFFE2DCF7);

  // Text Colors
  static const Color textPrimaryDark = Color(0xFFFAF9FF); // Crisp Starlight White
  static const Color textSecondaryDark = Color(0xFFB8AFD4); // Soft Periwinkle Mist
  static const Color textMutedDark = Color(0xFF7E74A3); // Twilight Muted
  static const Color textHighlight = Color(0xFFE0E7FF); // Bright Accent Text

  static const Color textPrimaryLight = Color(0xFF1E1538);
  static const Color textSecondaryLight = Color(0xFF594F7A);
  static const Color textMutedLight = Color(0xFF8E84B0);

  // Mood Palette
  static const Color moodEcstatic = Color(0xFFEC4899); // Joyful Pink
  static const Color moodHappy = Color(0xFF8B5CF6); // Bright Violet
  static const Color moodContent = Color(0xFF06B6D4); // Calm Cyan
  static const Color moodNeutral = Color(0xFF10B981); // Balanced Mint
  static const Color moodTired = Color(0xFFF59E0B); // Amber Sunset
  static const Color moodSad = Color(0xFF6366F1); // Indigo Rain
  static const Color moodStressed = Color(0xFFEF4444); // Warm Coral

  // Gradient definitions
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFF6366F1), Color(0xFFEC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient periwinkleGradient = LinearGradient(
    colors: [Color(0xFFA5B4FC), Color(0xFF818CF8), Color(0xFFC084FC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient celestialGradient = LinearGradient(
    colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF261047), Color(0xFF160E33), Color(0xFF0A071A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient auraGlowGradient = LinearGradient(
    colors: [Color(0x38A78BFA), Color(0x18EC4899), Colors.transparent],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGlowGradient = LinearGradient(
    colors: [Color(0x268B5CF6), Color(0x12EC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmSunsetGradient = LinearGradient(
    colors: [Color(0xFFF43F5E), Color(0xFFFB923C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient sereneOceanGradient = LinearGradient(
    colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient lushForestGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
