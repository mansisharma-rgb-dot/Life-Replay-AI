class HabitModel {
  final int id;
  final String name;
  final String icon;
  final String frequency;
  final String status;
  final int currentStreak;
  final int longestStreak;
  final String? createdAt;
  final bool completedToday;

  HabitModel({
    required this.id,
    required this.name,
    this.icon = '✨',
    this.frequency = 'daily',
    this.status = 'active',
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.createdAt,
    this.completedToday = false,
  });

  factory HabitModel.fromJson(Map<String, dynamic> json) {
    return HabitModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? json['title'] ?? 'Habit',
      icon: json['icon'] ?? '✨',
      frequency: json['frequency'] ?? 'daily',
      status: json['status'] ?? 'active',
      currentStreak: (json['current_streak'] ?? 0) as int,
      longestStreak: (json['longest_streak'] ?? 0) as int,
      createdAt: json['created_at'],
      completedToday: (json['completed_today'] ?? false) as bool,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'icon': icon,
    'frequency': frequency,
    'status': status,
  };

  HabitModel copyWith({
    bool? completedToday,
    int? currentStreak,
    int? longestStreak,
  }) {
    return HabitModel(
      id: id,
      name: name,
      icon: icon,
      frequency: frequency,
      status: status,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      createdAt: createdAt,
      completedToday: completedToday ?? this.completedToday,
    );
  }
}
