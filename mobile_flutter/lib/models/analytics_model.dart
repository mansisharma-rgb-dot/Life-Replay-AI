class AnalyticsOverviewModel {
  final int averageLifeScore;
  final int currentStreak;
  final int longestStreak;
  final int totalXp;
  final int currentLevel;
  final int totalCheckins;
  final int completionRate;
  final double averageMood;
  final double totalStudyHours;
  final double totalExerciseHours;
  final double averageSleep;
  final double averageWaterIntake;

  AnalyticsOverviewModel({
    this.averageLifeScore = 0,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.totalXp = 0,
    this.currentLevel = 1,
    this.totalCheckins = 0,
    this.completionRate = 0,
    this.averageMood = 0.0,
    this.totalStudyHours = 0.0,
    this.totalExerciseHours = 0.0,
    this.averageSleep = 0.0,
    this.averageWaterIntake = 0.0,
  });

  factory AnalyticsOverviewModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) return AnalyticsOverviewModel();
    return AnalyticsOverviewModel(
      averageLifeScore: ((json['averageLifeScore'] ?? 0) as num).toInt(),
      currentStreak: ((json['currentStreak'] ?? 0) as num).toInt(),
      longestStreak: ((json['longestStreak'] ?? 0) as num).toInt(),
      totalXp: ((json['totalXp'] ?? 0) as num).toInt(),
      currentLevel: ((json['currentLevel'] ?? 1) as num).toInt(),
      totalCheckins: ((json['totalCheckins'] ?? 0) as num).toInt(),
      completionRate: ((json['completionRate'] ?? 0) as num).toInt(),
      averageMood: ((json['averageMood'] ?? 0.0) as num).toDouble(),
      totalStudyHours: ((json['totalStudyHours'] ?? 0.0) as num).toDouble(),
      totalExerciseHours: ((json['totalExerciseHours'] ?? 0.0) as num).toDouble(),
      averageSleep: ((json['averageSleep'] ?? 0.0) as num).toDouble(),
      averageWaterIntake: ((json['averageWaterIntake'] ?? 0.0) as num).toDouble(),
    );
  }
}

class LifeScorePoint {
  final String date;
  final int score;
  final double movingAverage;

  LifeScorePoint({
    required this.date,
    required this.score,
    this.movingAverage = 0,
  });

  factory LifeScorePoint.fromJson(Map<String, dynamic> json) {
    return LifeScorePoint(
      date: json['date'] ?? '',
      score: (json['score'] ?? 0) as int,
      movingAverage: ((json['movingAverage'] ?? 0) as num).toDouble(),
    );
  }
}

class MoodHistoryPoint {
  final String date;
  final int mood;

  MoodHistoryPoint({required this.date, required this.mood});

  factory MoodHistoryPoint.fromJson(Map<String, dynamic> json) {
    return MoodHistoryPoint(
      date: json['date'] ?? '',
      mood: (json['mood'] ?? 0) as int,
    );
  }
}

class HabitStatItem {
  final String name;
  final int completion;

  HabitStatItem({required this.name, required this.completion});

  factory HabitStatItem.fromJson(Map<String, dynamic> json) {
    return HabitStatItem(
      name: json['name'] as String? ?? '',
      completion: (json['completion'] as num? ?? 0).toInt(),
    );
  }
}

class HabitAnalyticsData {
  final int completionRate;
  final int consistencyScore;
  final List<HabitStatItem> habits;

  HabitAnalyticsData({
    this.completionRate = 0,
    this.consistencyScore = 0,
    this.habits = const [],
  });

  factory HabitAnalyticsData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return HabitAnalyticsData();
    return HabitAnalyticsData(
      completionRate: (json['completionRate'] as num? ?? 0).toInt(),
      consistencyScore: (json['consistencyScore'] as num? ?? 0).toInt(),
      habits: (json['habits'] as List?)
              ?.map((e) => HabitStatItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class SleepAnalyticsData {
  final double averageSleep;
  final String bestSleepDay;
  final String worstSleepDay;
  final List<Map<String, dynamic>> history;

  SleepAnalyticsData({
    this.averageSleep = 0.0,
    this.bestSleepDay = '-',
    this.worstSleepDay = '-',
    this.history = const [],
  });

  factory SleepAnalyticsData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return SleepAnalyticsData();
    return SleepAnalyticsData(
      averageSleep: ((json['averageSleep'] ?? 0.0) as num).toDouble(),
      bestSleepDay: json['bestSleepDay'] as String? ?? '-',
      worstSleepDay: json['worstSleepDay'] as String? ?? '-',
      history: (json['history'] as List?)?.whereType<Map<String, dynamic>>().toList() ?? [],
    );
  }
}

class WaterAnalyticsData {
  final double averageIntake;
  final int goalCompletion;
  final List<Map<String, dynamic>> history;

  WaterAnalyticsData({
    this.averageIntake = 0.0,
    this.goalCompletion = 0,
    this.history = const [],
  });

  factory WaterAnalyticsData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return WaterAnalyticsData();
    return WaterAnalyticsData(
      averageIntake: ((json['averageIntake'] ?? 0.0) as num).toDouble(),
      goalCompletion: (json['goalCompletion'] as num? ?? 0).toInt(),
      history: (json['history'] as List?)?.whereType<Map<String, dynamic>>().toList() ?? [],
    );
  }
}

class ProductivityAnalyticsData {
  final double studyHours;
  final double workHours;
  final double exerciseHours;
  final double readingHours;
  final double deepWork;
  final List<Map<String, dynamic>> distribution;
  final List<Map<String, dynamic>> history;

  ProductivityAnalyticsData({
    this.studyHours = 0.0,
    this.workHours = 0.0,
    this.exerciseHours = 0.0,
    this.readingHours = 0.0,
    this.deepWork = 0.0,
    this.distribution = const [],
    this.history = const [],
  });

  factory ProductivityAnalyticsData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return ProductivityAnalyticsData();
    return ProductivityAnalyticsData(
      studyHours: ((json['studyHours'] ?? 0.0) as num).toDouble(),
      workHours: ((json['workHours'] ?? 0.0) as num).toDouble(),
      exerciseHours: ((json['exerciseHours'] ?? 0.0) as num).toDouble(),
      readingHours: ((json['readingHours'] ?? 0.0) as num).toDouble(),
      deepWork: ((json['deepWork'] ?? 0.0) as num).toDouble(),
      distribution: (json['distribution'] as List?)?.whereType<Map<String, dynamic>>().toList() ?? [],
      history: (json['history'] as List?)?.whereType<Map<String, dynamic>>().toList() ?? [],
    );
  }
}
