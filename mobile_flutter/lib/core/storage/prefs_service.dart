import 'package:shared_preferences/shared_preferences.dart';

class PrefsService {
  static const String _onboardingKey = 'onboarding_completed';
  static const String _themeModeKey = 'app_theme_mode';
  static const String _avatarAssetKey = 'user_avatar_asset';
  static const String _reduceMotionKey = 'reduce_motion';
  static const String _notifyCheckinKey = 'notify_checkin';
  static const String _notifyAchievementsKey = 'notify_achievements';
  static const String _notifyHabitsKey = 'notify_habits';
  static const String _privacyAnalyticsKey = 'privacy_analytics';

  static Future<bool> isOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  static Future<void> setOnboardingCompleted(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, value);
  }

  static Future<String> getThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_themeModeKey) ?? 'dark';
  }

  static Future<void> setThemeMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModeKey, mode);
  }

  static Future<String> getAvatarAsset() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_avatarAssetKey) ?? 'assets/illustrations/mood_bear.png';
  }

  static Future<void> setAvatarAsset(String assetPath) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_avatarAssetKey, assetPath);
  }

  static Future<bool> isReduceMotion() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_reduceMotionKey) ?? false;
  }

  static Future<void> setReduceMotion(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_reduceMotionKey, value);
  }

  static Future<bool> isNotifyCheckin() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notifyCheckinKey) ?? true;
  }

  static Future<void> setNotifyCheckin(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifyCheckinKey, value);
  }

  static Future<bool> isNotifyAchievements() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notifyAchievementsKey) ?? true;
  }

  static Future<void> setNotifyAchievements(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifyAchievementsKey, value);
  }

  static Future<bool> isNotifyHabits() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notifyHabitsKey) ?? true;
  }

  static Future<void> setNotifyHabits(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifyHabitsKey, value);
  }

  static Future<bool> isPrivacyAnalyticsEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_privacyAnalyticsKey) ?? true;
  }

  static Future<void> setPrivacyAnalyticsEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_privacyAnalyticsKey, value);
  }
}
