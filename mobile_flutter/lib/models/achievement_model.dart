class AchievementModel {
  final int id;
  final String idStr;
  final String name;
  final String description;
  final String icon;
  final String? unlockedAt;
  final String category;
  final bool isUnlocked;

  AchievementModel({
    required this.id,
    this.idStr = '',
    required this.name,
    required this.description,
    this.icon = '🏆',
    this.unlockedAt,
    this.category = 'General',
    this.isUnlocked = false,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    final rawIdStr = json['id_str']?.toString() ?? '';
    final rawName = json['name'] ?? json['title'] ?? 'Achievement';
    final isUn = json['unlocked_at'] != null || (json['is_unlocked'] == true);

    return AchievementModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      idStr: rawIdStr.isNotEmpty ? rawIdStr : rawName.toLowerCase().replaceAll(' ', '_'),
      name: rawName,
      description: json['description'] ?? '',
      icon: json['icon'] ?? '🏆',
      unlockedAt: json['unlocked_at'],
      category: json['category'] ?? _deriveCategory(rawIdStr.isNotEmpty ? rawIdStr : rawName),
      isUnlocked: isUn,
    );
  }

  static String _deriveCategory(String key) {
    final lower = key.toLowerCase();
    if (lower.contains('streak') || lower.contains('flame') || lower.contains('monthly') || lower.contains('week')) {
      return 'Consistency';
    }
    if (lower.contains('journal') || lower.contains('reflect') || lower.contains('book')) {
      return 'Reflection';
    }
    if (lower.contains('early') || lower.contains('night') || lower.contains('sun') || lower.contains('moon')) {
      return 'Rhythm';
    }
    if (lower.contains('skill') || lower.contains('apprentice') || lower.contains('master')) {
      return 'Mastery';
    }
    return 'Milestones';
  }

  String get rarityTier {
    final key = '${idStr.toLowerCase()} ${name.toLowerCase()}';
    if (key.contains('streak_30') || key.contains('monthly') || key.contains('perfect_week')) {
      return 'Celestial Legendary';
    }
    if (key.contains('goal') || key.contains('apprentice') || key.contains('mastery')) {
      return 'Astral Epic';
    }
    if (key.contains('streak_7') || key.contains('journal') || key.contains('early') || key.contains('night')) {
      return 'Luminary Rare';
    }
    return 'Dawn Common';
  }

  int get xpReward => 25;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'id_str': idStr,
      'name': name,
      'description': description,
      'icon': icon,
      'unlocked_at': unlockedAt,
      'category': category,
      'is_unlocked': isUnlocked,
    };
  }
}
