class AppAssets {
  // Characters
  static const String affirmationHeart = 'assets/characters/affirmation_heart.jpg';
  static const String aiHelper = 'assets/characters/ai_helper.jpg';
  static const String celestialMoon = 'assets/characters/celestial_moon.jpg';
  static const String gratitudeReading = 'assets/characters/gratitude_reading.jpg';
  static const String moodBear = 'assets/characters/mood_bear.jpg';
  static const String moodContent = 'assets/characters/mood_content.jpg';
  static const String moodExcited = 'assets/characters/mood_excited.jpg';
  static const String moodFocused = 'assets/characters/mood_focused.jpg';
  static const String moodHappy = 'assets/characters/mood_happy.jpg';
  static const String moodRelaxed = 'assets/characters/mood_relaxed.jpg';
  static const String moodSad = 'assets/characters/mood_sad.jpg';
  static const String moodStressed = 'assets/characters/mood_stressed.jpg';
  static const String sleepBetter = 'assets/characters/sleep_better.jpg';

  // Branding & Backgrounds
  static const String logo = 'assets/images/logo.png';
  static const String logoEmblem = 'assets/images/logo-emblem.png';
  static const String logoIcon = 'assets/images/logo-icon.png';
  static const String favicon = 'assets/images/favicon.png';
  static const String bgCalm = 'assets/images/bg-calm.png';
  static const String bgCore = 'assets/images/bg-core.png';
  static const String bgJourney = 'assets/images/bg-journey.png';

  // Mood to character asset helper
  static String getCharacterForMood(String moodLabel) {
    final lower = moodLabel.toLowerCase();
    if (lower.contains('happy') || lower.contains('joy') || lower.contains('great')) {
      return moodHappy;
    } else if (lower.contains('excite') || lower.contains('ecstatic')) {
      return moodExcited;
    } else if (lower.contains('focus') || lower.contains('product')) {
      return moodFocused;
    } else if (lower.contains('relax') || lower.contains('calm') || lower.contains('peace')) {
      return moodRelaxed;
    } else if (lower.contains('sad') || lower.contains('down') || lower.contains('cry')) {
      return moodSad;
    } else if (lower.contains('stress') || lower.contains('anxious') || lower.contains('overwhelm')) {
      return moodStressed;
    } else if (lower.contains('content')) {
      return moodContent;
    }
    return moodBear;
  }
}
