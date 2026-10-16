class UserModel {
  final int id;
  final String fullName;
  final String email;
  final String? avatarUrl;
  final int currentStreak;
  final int longestStreak;
  final int totalXp;
  final int level;
  final String? bio;
  final String? aiStyle;
  final String? aiCoaching;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.avatarUrl,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.totalXp = 0,
    this.level = 1,
    this.bio,
    this.aiStyle,
    this.aiCoaching,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      fullName: json['full_name'] ?? json['fullName'] ?? 'Traveler',
      email: json['email'] ?? '',
      avatarUrl: json['avatar_url'],
      currentStreak: json['current_streak'] is int ? json['current_streak'] : (json['streak'] ?? 0),
      longestStreak: json['longest_streak'] ?? 0,
      totalXp: json['total_xp'] is int ? json['total_xp'] : (json['xp'] ?? 0),
      level: json['level'] is int ? json['level'] : 1,
      bio: json['bio'],
      aiStyle: json['ai_style'],
      aiCoaching: json['ai_coaching'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'avatar_url': avatarUrl,
      'current_streak': currentStreak,
      'longest_streak': longestStreak,
      'total_xp': totalXp,
      'level': level,
      'bio': bio,
      'ai_style': aiStyle,
      'ai_coaching': aiCoaching,
    };
  }

  UserModel copyWith({
    int? id,
    String? fullName,
    String? email,
    String? avatarUrl,
    int? currentStreak,
    int? longestStreak,
    int? totalXp,
    int? level,
    String? bio,
    String? aiStyle,
    String? aiCoaching,
  }) {
    return UserModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      totalXp: totalXp ?? this.totalXp,
      level: level ?? this.level,
      bio: bio ?? this.bio,
      aiStyle: aiStyle ?? this.aiStyle,
      aiCoaching: aiCoaching ?? this.aiCoaching,
    );
  }
}
