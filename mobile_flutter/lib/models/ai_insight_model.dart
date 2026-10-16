class InsightItem {
  final String title;
  final String category;
  final String message;
  final String priority;

  InsightItem({
    required this.title,
    required this.category,
    required this.message,
    this.priority = 'medium',
  });

  factory InsightItem.fromJson(Map<String, dynamic> json) {
    return InsightItem(
      title: json['title'] ?? 'Growth Insight',
      category: json['category'] ?? 'general',
      message: json['message'] ?? '',
      priority: json['priority'] ?? 'medium',
    );
  }
}

class RecommendationItem {
  final String title;
  final String action;
  final String category;
  final String priority;

  RecommendationItem({
    required this.title,
    required this.action,
    required this.category,
    this.priority = 'medium',
  });

  factory RecommendationItem.fromJson(Map<String, dynamic> json) {
    return RecommendationItem(
      title: json['title'] ?? json['action'] ?? 'Suggested Action',
      action: json['action'] ?? json['description'] ?? '',
      category: json['category'] ?? 'routine',
      priority: json['priority'] ?? 'medium',
    );
  }
}

class AIOverviewModel {
  final String summary;
  final String? encouragement;
  final List<InsightItem> insights;
  final List<RecommendationItem> recommendations;

  AIOverviewModel({
    required this.summary,
    this.encouragement,
    this.insights = const [],
    this.recommendations = const [],
  });

  factory AIOverviewModel.fromJson(Map<String, dynamic> json) {
    final insightsData = json['insights'];
    List<InsightItem> parsedInsights = [];
    String summary = 'AI Growth Analysis ready.';
    String? encouragement;

    if (insightsData is Map<String, dynamic>) {
      summary = insightsData['summary'] ?? summary;
      encouragement = insightsData['encouragement'];
      if (insightsData['insights'] is List) {
        parsedInsights = (insightsData['insights'] as List)
            .map((item) => InsightItem.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } else if (insightsData is List) {
      parsedInsights = insightsData
          .map((item) => InsightItem.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    final recsData = json['recommendations'];
    List<RecommendationItem> parsedRecs = [];
    if (recsData is Map<String, dynamic>) {
      if (recsData['recommendations'] is List) {
        parsedRecs = (recsData['recommendations'] as List)
            .map((item) => RecommendationItem.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } else if (recsData is List) {
      parsedRecs = recsData
          .map((item) => RecommendationItem.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return AIOverviewModel(
      summary: summary,
      encouragement: encouragement,
      insights: parsedInsights,
      recommendations: parsedRecs,
    );
  }
}

class AIReplayResult {
  final String answer;
  final String? narrative;
  final List<Map<String, dynamic>> memories;

  AIReplayResult({
    required this.answer,
    this.narrative,
    this.memories = const [],
  });

  factory AIReplayResult.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> mems = [];
    final context = json['context'];
    if (context is Map && context['timeline'] is List) {
      mems = (context['timeline'] as List).whereType<Map<String, dynamic>>().toList();
    }

    return AIReplayResult(
      answer: json['answer'] ?? json['narrative'] ?? 'Life Replay generated.',
      narrative: json['narrative'],
      memories: mems,
    );
  }
}
