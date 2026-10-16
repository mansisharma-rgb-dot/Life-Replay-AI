class MoodData {
  final int moodScore;
  final int intensity;
  final String moodLabel;
  final String note;

  MoodData({
    this.moodScore = 7,
    this.intensity = 3,
    this.moodLabel = 'Content',
    this.note = '',
  });

  factory MoodData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return MoodData();
    return MoodData(
      moodScore: (json['mood_score'] ?? json['score'] ?? 7) as int,
      intensity: (json['intensity'] ?? 3) as int,
      moodLabel: (json['mood_label'] ?? json['label'] ?? 'Content').toString(),
      note: (json['note'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'mood_score': moodScore,
    'intensity': intensity,
    'mood_label': moodLabel,
    'note': note,
  };
}

class WellbeingData {
  final int energyLevel;
  final int stressLevel;
  final int focusLevel;
  final int motivationLevel;

  WellbeingData({
    this.energyLevel = 3,
    this.stressLevel = 2,
    this.focusLevel = 3,
    this.motivationLevel = 3,
  });

  factory WellbeingData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return WellbeingData();
    return WellbeingData(
      energyLevel: (json['energy_level'] ?? json['energy'] ?? 3) as int,
      stressLevel: (json['stress_level'] ?? json['stress'] ?? 2) as int,
      focusLevel: (json['focus_level'] ?? json['focus'] ?? 3) as int,
      motivationLevel: (json['motivation_level'] ?? json['motivation'] ?? 3) as int,
    );
  }

  Map<String, dynamic> toJson() => {
    'energy_level': energyLevel,
    'stress_level': stressLevel,
    'focus_level': focusLevel,
    'motivation_level': motivationLevel,
  };
}

class ActivitiesData {
  final double studyHours;
  final double workHours;
  final int exerciseMinutes;
  final int readingMinutes;
  final int meditationMinutes;
  final double sleepHours;
  final int waterIntakeMl;
  final int screenTimeMinutes;
  final double leisureHours;
  final int walkingSteps;
  final int caloriesBurned;

  ActivitiesData({
    this.studyHours = 0,
    this.workHours = 0,
    this.exerciseMinutes = 0,
    this.readingMinutes = 0,
    this.meditationMinutes = 0,
    this.sleepHours = 7.0,
    this.waterIntakeMl = 1500,
    this.screenTimeMinutes = 180,
    this.leisureHours = 0,
    this.walkingSteps = 4000,
    this.caloriesBurned = 0,
  });

  factory ActivitiesData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return ActivitiesData();
    return ActivitiesData(
      studyHours: ((json['study_hours'] ?? 0) as num).toDouble(),
      workHours: ((json['work_hours'] ?? 0) as num).toDouble(),
      exerciseMinutes: ((json['exercise_minutes'] ?? 0) as num).toInt(),
      readingMinutes: ((json['reading_minutes'] ?? 0) as num).toInt(),
      meditationMinutes: ((json['meditation_minutes'] ?? 0) as num).toInt(),
      sleepHours: ((json['sleep_hours'] ?? 7.0) as num).toDouble(),
      waterIntakeMl: ((json['water_intake_ml'] ?? 1500) as num).toInt(),
      screenTimeMinutes: ((json['screen_time_minutes'] ?? 180) as num).toInt(),
      leisureHours: ((json['leisure_hours'] ?? 0) as num).toDouble(),
      walkingSteps: ((json['walking_steps'] ?? 4000) as num).toInt(),
      caloriesBurned: ((json['calories_burned'] ?? 0) as num).toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
    'study_hours': studyHours,
    'work_hours': workHours,
    'exercise_minutes': exerciseMinutes,
    'reading_minutes': readingMinutes,
    'meditation_minutes': meditationMinutes,
    'sleep_hours': sleepHours,
    'water_intake_ml': waterIntakeMl,
    'screen_time_minutes': screenTimeMinutes,
    'leisure_hours': leisureHours,
    'walking_steps': walkingSteps,
    'calories_burned': caloriesBurned,
  };
}

class CheckinJournalData {
  final String title;
  final String content;

  CheckinJournalData({
    this.title = '',
    this.content = '',
  });

  factory CheckinJournalData.fromJson(Map<String, dynamic>? json) {
    if (json == null) return CheckinJournalData();
    return CheckinJournalData(
      title: (json['title'] ?? '').toString(),
      content: (json['content'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'title': title,
    'content': content,
  };
}

class HabitLogItem {
  final int? id;
  final int? habitId;
  final String name;
  final String icon;
  final int streak;
  final bool completed;

  HabitLogItem({
    this.id,
    this.habitId,
    required this.name,
    this.icon = '✨',
    this.streak = 0,
    this.completed = false,
  });

  factory HabitLogItem.fromJson(Map<String, dynamic> json) {
    return HabitLogItem(
      id: json['id'] is int ? json['id'] : null,
      habitId: json['habit_id'] is int ? json['habit_id'] : null,
      name: (json['name'] ?? 'Habit').toString(),
      icon: (json['icon'] ?? '✨').toString(),
      streak: ((json['streak'] ?? 0) as num).toInt(),
      completed: (json['completed'] ?? false) as bool,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    if (habitId != null) 'habit_id': habitId,
    'name': name,
    'icon': icon,
    'streak': streak,
    'completed': completed,
  };
}

class CheckinModel {
  final int? id;
  final String date;
  final int dailyRating;
  final bool isCompleted;
  final int? lifeScore;
  final Map<String, dynamic>? lifeScoreDetails;
  final MoodData mood;
  final WellbeingData wellbeing;
  final ActivitiesData activities;
  final CheckinJournalData journal;
  final List<HabitLogItem> habitLogs;
  final List<Map<String, dynamic>> goals;

  CheckinModel({
    this.id,
    required this.date,
    this.dailyRating = 7,
    this.isCompleted = false,
    this.lifeScore,
    this.lifeScoreDetails,
    required this.mood,
    required this.wellbeing,
    required this.activities,
    required this.journal,
    this.habitLogs = const [],
    this.goals = const [],
  });

  factory CheckinModel.fromJson(Map<String, dynamic> json) {
    int? parsedLifeScore;
    Map<String, dynamic>? parsedLifeScoreDetails;

    if (json['life_score'] is num) {
      parsedLifeScore = (json['life_score'] as num).toInt();
    } else if (json['life_score'] is Map<String, dynamic>) {
      parsedLifeScoreDetails = json['life_score'] as Map<String, dynamic>;
      if (parsedLifeScoreDetails['total_score'] is num) {
        parsedLifeScore = (parsedLifeScoreDetails['total_score'] as num).toInt();
      }
    }

    if (parsedLifeScoreDetails == null && json['life_score_details'] is Map<String, dynamic>) {
      parsedLifeScoreDetails = json['life_score_details'] as Map<String, dynamic>;
    }

    List<HabitLogItem> parsedHabits = [];
    if (json['habit_logs'] is List) {
      parsedHabits = (json['habit_logs'] as List)
          .whereType<Map<String, dynamic>>()
          .map((h) => HabitLogItem.fromJson(h))
          .toList();
    }

    List<Map<String, dynamic>> parsedGoals = [];
    if (json['goals'] is List) {
      parsedGoals = (json['goals'] as List).whereType<Map<String, dynamic>>().toList();
    }

    return CheckinModel(
      id: json['id'] is int ? json['id'] : null,
      date: json['date'] ?? DateTime.now().toIso8601String().split('T')[0],
      dailyRating: (json['daily_rating'] ?? 7) as int,
      isCompleted: (json['is_completed'] ?? false) as bool,
      lifeScore: parsedLifeScore,
      lifeScoreDetails: parsedLifeScoreDetails,
      mood: MoodData.fromJson(json['mood'] as Map<String, dynamic>?),
      wellbeing: WellbeingData.fromJson(json['wellbeing'] as Map<String, dynamic>?),
      activities: ActivitiesData.fromJson(json['activities'] as Map<String, dynamic>?),
      journal: CheckinJournalData.fromJson(json['journal'] as Map<String, dynamic>?),
      habitLogs: parsedHabits,
      goals: parsedGoals,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'date': date,
    'daily_rating': dailyRating,
    'is_completed': isCompleted,
    if (lifeScore != null) 'life_score': lifeScore,
    'mood': mood.toJson(),
    'wellbeing': wellbeing.toJson(),
    'activities': activities.toJson(),
    'journal': journal.toJson(),
    if (habitLogs.isNotEmpty) 'habit_logs': habitLogs.map((h) => h.toJson()).toList(),
    if (goals.isNotEmpty) 'goals': goals,
  };
}
