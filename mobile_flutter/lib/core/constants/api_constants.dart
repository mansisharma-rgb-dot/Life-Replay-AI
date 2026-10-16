class ApiConstants {
  static const String baseUrl = 'https://life-replay-ai.onrender.com/api';
  
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Checkins
  static const String todayCheckin = '/checkins/today';
  static const String checkin = '/checkins/';
  static const String checkinHistory = '/checkins/history';
  static const String checkinDate = '/checkins/date/';

  // Reports
  static const String reportsRange = '/reports/range';
  static const String reportsWeekly = '/reports/weekly';
  static const String reportsMonthly = '/reports/monthly';

  // Journals & Documents
  static const String journals = '/journals/';
  static const String documents = '/documents/';

  // Goals
  static const String goals = '/goals/';
  static const String goalPredictions = '/goals/predictions';

  // Habits
  static const String habits = '/habits/';

  // Analytics
  static const String analyticsOverview = '/analytics/overview';
  static const String analyticsLifeScore = '/analytics/life-score';
  static const String analyticsMood = '/analytics/mood';
  static const String analyticsHabits = '/analytics/habits';
  static const String analyticsProductivity = '/analytics/productivity';
  static const String analyticsSleep = '/analytics/sleep';
  static const String analyticsWater = '/analytics/water';
  static const String analyticsGoals = '/analytics/goals';
  static const String analyticsAchievements = '/analytics/achievements';
  static const String analyticsCorrelations = '/analytics/correlations';

  // AI & Replay
  static const String aiOverview = '/ai/overview';
  static const String aiInsights = '/ai/insights';
  static const String aiRecommendations = '/ai/recommendations';
  static const String aiReplay = '/ai/replay';

  // Gamification & Achievements
  static const String achievements = '/achievements/';
  static const String gamificationStats = '/gamification/stats';

  // Profile
  static const String profile = '/profile/';
}
