class DocumentModel {
  final int id;
  final String title;
  final String originalName;
  final String fileType;
  final int fileSize;
  final String summary;
  final String summaryType;
  final bool isLocalSummary;
  final String overview;
  final List<String> keyTopics;
  final List<String> keyPoints;
  final List<String> keyDates;
  final List<String> keywords;
  final String extractedText;
  final int extractedChars;
  final int extractedWords;
  final String status;
  final String? errorMessage;
  final String? createdAt;

  const DocumentModel({
    required this.id,
    required this.title,
    required this.originalName,
    required this.fileType,
    required this.fileSize,
    required this.summary,
    this.summaryType = 'ai',
    this.isLocalSummary = false,
    this.overview = '',
    this.keyTopics = const [],
    this.keyPoints = const [],
    this.keyDates = const [],
    this.keywords = const [],
    this.extractedText = '',
    this.extractedChars = 0,
    this.extractedWords = 0,
    required this.status,
    this.errorMessage,
    this.createdAt,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? json['original_name'] as String? ?? 'Untitled Document',
      originalName: json['original_name'] as String? ?? '',
      fileType: (json['file_type'] as String? ?? 'pdf').toLowerCase(),
      fileSize: json['file_size'] as int? ?? 0,
      summary: json['summary'] as String? ?? '',
      summaryType: json['summary_type'] as String? ?? 'ai',
      isLocalSummary: json['is_local_summary'] as bool? ?? false,
      overview: json['overview'] as String? ?? '',
      keyTopics: (json['key_topics'] as List?)?.map((e) => e.toString()).toList() ?? [],
      keyPoints: (json['key_points'] as List?)?.map((e) => e.toString()).toList() ?? [],
      keyDates: (json['key_dates'] as List?)?.map((e) => e.toString()).toList() ?? [],
      keywords: (json['keywords'] as List?)?.map((e) => e.toString()).toList() ?? [],
      extractedText: json['extracted_text'] as String? ?? '',
      extractedChars: json['extracted_chars'] as int? ?? (json['extracted_text'] as String? ?? '').length,
      extractedWords: json['extracted_words'] as int? ?? 0,
      status: json['status'] as String? ?? 'completed',
      errorMessage: json['error_message'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }

  String get formattedFileSize {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
