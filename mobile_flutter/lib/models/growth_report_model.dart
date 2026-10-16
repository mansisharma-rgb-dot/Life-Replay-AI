class ReportPeriod {
  final String startDate;
  final String endDate;
  final String label;

  ReportPeriod({
    required this.startDate,
    required this.endDate,
    required this.label,
  });

  factory ReportPeriod.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return ReportPeriod(startDate: '', endDate: '', label: '');
    }
    return ReportPeriod(
      startDate: (json['start_date'] ?? '').toString(),
      endDate: (json['end_date'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
    );
  }
}

class ReportHighlight {
  final String title;
  final String description;

  ReportHighlight({required this.title, required this.description});

  factory ReportHighlight.fromJson(Map<String, dynamic> json) {
    return ReportHighlight(
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
    );
  }
}

class GrowthReportModel {
  final ReportPeriod period;
  final int totalCheckinDays;
  final int? averageLifeScore;
  final double? averageMood;
  final double totalStudyHours;
  final double totalWorkHours;
  final double? averageSleepHours;
  final int? averageWaterIntakeMl;
  final int habitCompletionRate;
  final int completedGoals;
  final int achievementsUnlocked;
  final List<Map<String, dynamic>> moodHistory;
  final List<Map<String, dynamic>> productivityHistory;
  final List<ReportHighlight> highlights;
  final List<String> challenges;
  final String? reflectionText;
  final String? suggestionsText;
  final bool aiAvailable;
  final bool isEmpty;

  GrowthReportModel({
    required this.period,
    this.totalCheckinDays = 0,
    this.averageLifeScore,
    this.averageMood,
    this.totalStudyHours = 0.0,
    this.totalWorkHours = 0.0,
    this.averageSleepHours,
    this.averageWaterIntakeMl,
    this.habitCompletionRate = 0,
    this.completedGoals = 0,
    this.achievementsUnlocked = 0,
    this.moodHistory = const [],
    this.productivityHistory = const [],
    this.highlights = const [],
    this.challenges = const [],
    this.reflectionText,
    this.suggestionsText,
    this.aiAvailable = false,
    this.isEmpty = true,
  });

  factory GrowthReportModel.fromJson(Map<String, dynamic> json) {
    final periodData = ReportPeriod.fromJson(json['period'] as Map<String, dynamic>?);
    final metrics = (json['metrics'] as Map<String, dynamic>?) ?? {};
    final isReportEmpty = json['empty'] == true || (metrics.isEmpty && json['narrative'] == null);

    List<ReportHighlight> highlightsList = [];
    if (json['highlights'] is List) {
      highlightsList = (json['highlights'] as List)
          .whereType<Map<String, dynamic>>()
          .map((h) => ReportHighlight.fromJson(h))
          .toList();
    }

    List<String> challengesList = [];
    if (json['challenges'] is List) {
      challengesList = (json['challenges'] as List)
          .map((c) => c.toString())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    String? reflection;
    String? suggestions;
    if (json['narrative'] is Map) {
      final narrative = json['narrative'] as Map<String, dynamic>;
      if (narrative['answer'] is Map) {
        final answer = narrative['answer'] as Map<String, dynamic>;
        reflection = answer['reflection']?.toString();
        suggestions = answer['suggestions']?.toString();
      } else if (narrative['reflection'] != null) {
        reflection = narrative['reflection']?.toString();
        suggestions = narrative['suggestions']?.toString();
      }
    }

    List<Map<String, dynamic>> moodHist = [];
    if (metrics['mood_history'] is List) {
      moodHist = (metrics['mood_history'] as List).whereType<Map<String, dynamic>>().toList();
    }

    List<Map<String, dynamic>> prodHist = [];
    if (metrics['productivity_history'] is List) {
      prodHist = (metrics['productivity_history'] as List).whereType<Map<String, dynamic>>().toList();
    }

    return GrowthReportModel(
      period: periodData,
      totalCheckinDays: ((metrics['total_checkin_days'] ?? 0) as num).toInt(),
      averageLifeScore: metrics['average_life_score'] is num ? (metrics['average_life_score'] as num).toInt() : null,
      averageMood: metrics['average_mood'] is num ? (metrics['average_mood'] as num).toDouble() : null,
      totalStudyHours: ((metrics['total_study_hours'] ?? 0.0) as num).toDouble(),
      totalWorkHours: ((metrics['total_work_hours'] ?? 0.0) as num).toDouble(),
      averageSleepHours: metrics['average_sleep_hours'] is num ? (metrics['average_sleep_hours'] as num).toDouble() : null,
      averageWaterIntakeMl: metrics['average_water_intake_ml'] is num ? (metrics['average_water_intake_ml'] as num).toInt() : null,
      habitCompletionRate: ((metrics['habit_completion_rate'] ?? 0) as num).toInt(),
      completedGoals: ((metrics['completed_goals'] ?? 0) as num).toInt(),
      achievementsUnlocked: ((metrics['achievements_unlocked'] ?? 0) as num).toInt(),
      moodHistory: moodHist,
      productivityHistory: prodHist,
      highlights: highlightsList,
      challenges: challengesList,
      reflectionText: reflection,
      suggestionsText: suggestions,
      aiAvailable: json['ai_available'] == true,
      isEmpty: isReportEmpty,
    );
  }
}
