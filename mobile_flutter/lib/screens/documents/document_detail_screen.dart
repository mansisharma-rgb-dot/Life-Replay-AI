import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/document_model.dart';
import '../../providers/document_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';

class DocumentDetailScreen extends StatefulWidget {
  final DocumentModel document;

  const DocumentDetailScreen({super.key, required this.document});

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen> {
  late DocumentModel _doc;
  bool _isLoading = false;
  bool _isCopied = false;

  @override
  void initState() {
    super.initState();
    _doc = widget.document;
    _refreshDoc();
  }

  Future<void> _refreshDoc() async {
    setState(() => _isLoading = true);
    final updated = await context.read<DocumentProvider>().getDocument(_doc.id);
    if (mounted && updated != null) {
      setState(() {
        _doc = updated;
        _isLoading = false;
      });
    } else if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _copyExtractedText() {
    if (_doc.extractedText.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: _doc.extractedText));
      setState(() => _isCopied = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Extracted text copied to clipboard ✨'),
          duration: Duration(seconds: 2),
        ),
      );
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isCopied = false);
      });
    }
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Document Memory?', style: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${_doc.title}"? This will remove its extracted text, summaries, and memory records.',
          style: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMutedDark)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<DocumentProvider>().deleteDocument(_doc.id);
              if (mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Document deleted successfully')),
                  );
                  Navigator.pop(context);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to delete document')),
                  );
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isPdf = _doc.fileType == 'pdf';

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: Text(
          _doc.title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444)),
            tooltip: 'Delete Document',
            onPressed: _confirmDelete,
          ),
        ],
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.primaryLight),
                )
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  children: [
                    // Document Meta Header Card
                    AppCard(
                      hasGlow: true,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isPdf
                                      ? const Color(0xFFEF4444).withAlpha(40)
                                      : AppColors.primaryLight.withAlpha(40),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isPdf
                                        ? const Color(0xFFEF4444).withAlpha(90)
                                        : AppColors.primaryLight.withAlpha(90),
                                  ),
                                ),
                                child: Icon(
                                  isPdf ? Icons.picture_as_pdf_rounded : Icons.description_rounded,
                                  color: isPdf ? const Color(0xFFF87171) : AppColors.primaryLight,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _doc.title,
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textPrimaryDark,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${_doc.fileType.toUpperCase()} • ${_doc.formattedFileSize} • ${_doc.createdAt != null ? _doc.createdAt!.split('T').first : ''}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondaryDark,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              _buildMetaBadge(
                                icon: Icons.text_fields_rounded,
                                label: '${_doc.extractedChars} chars extracted',
                                color: AppColors.lavenderGlow,
                              ),
                              _buildMetaBadge(
                                icon: _doc.isLocalSummary ? Icons.bolt_rounded : Icons.auto_awesome_rounded,
                                label: _doc.isLocalSummary ? 'Local Analysis' : 'AI Analyzed',
                                color: AppColors.accentMint,
                              ),
                              _buildMetaBadge(
                                icon: Icons.check_circle_rounded,
                                label: _doc.status.toUpperCase(),
                                color: _doc.status == 'completed'
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFF59E0B),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // AI Overview & Summary Card
                    if (_doc.summary.isNotEmpty || _doc.overview.isNotEmpty) ...[
                      AppCard(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.auto_awesome_rounded, color: AppColors.primaryLight, size: 20),
                                const SizedBox(width: 8),
                                const Text(
                                  'AI Summary & Insights',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimaryDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _doc.overview.isNotEmpty ? _doc.overview : _doc.summary,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondaryDark,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Key Topics / Tags
                    if (_doc.keyTopics.isNotEmpty) ...[
                      AppCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Key Topics',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimaryDark,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _doc.keyTopics.map((topic) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceLightDark,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.primaryLight.withAlpha(60)),
                                  ),
                                  child: Text(
                                    topic,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primaryLight,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Key Points
                    if (_doc.keyPoints.isNotEmpty) ...[
                      AppCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Core Takeaways',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimaryDark,
                              ),
                            ),
                            const SizedBox(height: 10),
                            ..._doc.keyPoints.map((point) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('• ', style: TextStyle(color: AppColors.primaryLight, fontSize: 16)),
                                    Expanded(
                                      child: Text(
                                        point,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: AppColors.textSecondaryDark,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Extracted Text Section
                    AppCard(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.article_outlined, color: AppColors.lavenderGlow, size: 20),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Extracted Text',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textPrimaryDark,
                                    ),
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: Icon(
                                  _isCopied ? Icons.check_circle_rounded : Icons.copy_rounded,
                                  color: _isCopied ? AppColors.accentMint : AppColors.textMutedDark,
                                  size: 20,
                                ),
                                tooltip: 'Copy Extracted Text',
                                onPressed: _copyExtractedText,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (_doc.extractedText.isEmpty)
                            const Text(
                              'No readable text could be extracted from this document.',
                              style: TextStyle(fontSize: 13, color: AppColors.textMutedDark),
                            )
                          else
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceDark.withAlpha(200),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.borderDark),
                              ),
                              child: SelectableText(
                                _doc.extractedText,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontFamily: 'monospace',
                                  color: AppColors.warmCream,
                                  height: 1.5,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildMetaBadge({required IconData icon, required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(70)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }
}
