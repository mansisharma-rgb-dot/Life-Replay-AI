class GoalModel {
  final int id;
  final String title;
  final double progress;
  final double target;
  final String? category;
  final String? deadline;
  final String status;
  final String? createdAt;

  GoalModel({
    required this.id,
    required this.title,
    this.progress = 0.0,
    this.target = 100.0,
    this.category,
    this.deadline,
    this.status = 'active',
    this.createdAt,
  });

  double get percentage => target > 0 ? (progress / target).clamp(0.0, 1.0) : 0.0;
  bool get isCompleted => status == 'completed' || progress >= target;

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    return GoalModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      title: json['title'] ?? 'Goal',
      progress: ((json['progress'] ?? 0.0) as num).toDouble(),
      target: ((json['target'] ?? 100.0) as num).toDouble(),
      category: json['category'],
      deadline: json['deadline'],
      status: json['status'] ?? 'active',
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'progress': progress,
    'target': target,
    'category': category,
    'deadline': deadline,
    'status': status,
  };
}
