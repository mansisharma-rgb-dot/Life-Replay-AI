class JournalModel {
  final int id;
  final String date;
  final String title;
  final String content;
  final int? moodScore;
  final String? moodLabel;
  final List<String> tags;
  final String? createdAt;

  JournalModel({
    required this.id,
    required this.date,
    required this.title,
    required this.content,
    this.moodScore,
    this.moodLabel,
    this.tags = const [],
    this.createdAt,
  });

  factory JournalModel.fromJson(Map<String, dynamic> json) {
    var rawTags = json['tags'];
    List<String> parsedTags = [];
    if (rawTags is List) {
      parsedTags = rawTags.map((e) => e.toString()).toList();
    }

    return JournalModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      date: json['date'] ?? '',
      title: json['title'] ?? 'Untitled Reflection',
      content: json['content'] ?? '',
      moodScore: json['mood_score'] != null ? (json['mood_score'] as num).toInt() : null,
      moodLabel: json['mood_label'],
      tags: parsedTags,
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'date': date,
    'title': title,
    'content': content,
    'mood_score': moodScore,
    'mood_label': moodLabel,
    'tags': tags,
  };
}
