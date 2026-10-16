import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/document_model.dart';
import '../../providers/document_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/empty_state_view.dart';
import 'document_detail_screen.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'all'; // all, pdf, txt

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DocumentProvider>().fetchDocuments();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadDocument() async {
    try {
      final files = await FilePickerPlatform.instance.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt'],
      );

      if (files.isNotEmpty && files.first.path != null) {
        final filePath = files.first.path!;
        final fileName = files.first.name;

        if (!mounted) return;
        final docProvider = context.read<DocumentProvider>();

        final success = await docProvider.uploadDocument(filePath, fileName: fileName);
        if (!mounted) return;

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Document "$fileName" uploaded & extracted! ✨'),
              backgroundColor: AppColors.accentMint,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(docProvider.errorMessage ?? 'Failed to process document upload'),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not open file picker: $e'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final docProvider = context.watch<DocumentProvider>();
    final isLoading = docProvider.isLoading;
    final isUploading = docProvider.isUploading;
    final docs = docProvider.documents;

    final filtered = docs.where((d) {
      if (_selectedFilter != 'all' && d.fileType != _selectedFilter) {
        return false;
      }
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return d.title.toLowerCase().contains(q) ||
          d.originalName.toLowerCase().contains(q) ||
          d.summary.toLowerCase().contains(q) ||
          d.keyTopics.any((t) => t.toLowerCase().contains(q));
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Memories & Documents'),
        actions: [
          IconButton(
            icon: const Icon(Icons.upload_file_rounded, color: AppColors.primaryLight),
            tooltip: 'Upload Document',
            onPressed: isUploading ? null : _pickAndUploadDocument,
          ),
        ],
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: Column(
            children: [
              // Search & Filter Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLightDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderDark),
                  ),
                  child: TextField(
                    controller: _searchController,
                    style: const TextStyle(color: AppColors.textPrimaryDark, fontSize: 14),
                    onChanged: (val) => setState(() => _searchQuery = val.trim()),
                    decoration: const InputDecoration(
                      hintText: 'Search memories, notes & insights...',
                      prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMutedDark, size: 20),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ),

              // Filter Chips & Stats
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        _buildFilterChip('all', 'All (${docs.length})'),
                        const SizedBox(width: 8),
                        _buildFilterChip('pdf', 'PDFs'),
                        const SizedBox(width: 8),
                        _buildFilterChip('txt', 'TXT'),
                      ],
                    ),
                    Text(
                      '${docProvider.totalExtractedChars.toString()} chars',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMutedDark,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),

              // Uploading Banner
              if (isUploading)
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(40),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.primaryLight.withAlpha(100)),
                  ),
                  child: Row(
                    children: const [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primaryLight),
                      ),
                      SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'Extracting text and generating AI memory summaries...',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.warmCream),
                        ),
                      ),
                    ],
                  ),
                ),

              // Main List
              Expanded(
                child: isLoading
                    ? const LoadingView(message: 'Loading your document memories...')
                    : filtered.isEmpty
                        ? EmptyStateView(
                            imagePath: AppAssets.gratitudeReading,
                            title: _searchQuery.isEmpty ? 'No Documents Uploaded' : 'No Matching Documents',
                            description: _searchQuery.isEmpty
                                ? 'Upload PDFs or TXT documents. We automatically extract the content and generate structured summaries for your life story.'
                                : 'Try searching with different keywords.',
                            actionText: _searchQuery.isEmpty ? 'Upload PDF or TXT' : null,
                            onAction: _searchQuery.isEmpty ? _pickAndUploadDocument : null,
                          )
                        : RefreshIndicator(
                            color: AppColors.primaryLight,
                            backgroundColor: AppColors.surfaceDark,
                            onRefresh: () => docProvider.fetchDocuments(),
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final doc = filtered[index];
                                return _buildDocumentCard(doc);
                              },
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Document', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: isUploading ? null : _pickAndUploadDocument,
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppColors.textSecondaryDark,
          ),
        ),
      ),
    );
  }

  Widget _buildDocumentCard(DocumentModel doc) {
    final isPdf = doc.fileType == 'pdf';
    final isProcessing = doc.status == 'processing';
    final isError = doc.status == 'error';

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: AppCard(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DocumentDetailScreen(document: doc),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isError
                        ? const Color(0xFFEF4444).withAlpha(30)
                        : isPdf
                            ? const Color(0xFFEF4444).withAlpha(30)
                            : AppColors.primaryLight.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isError
                        ? Icons.error_outline_rounded
                        : isPdf
                            ? Icons.picture_as_pdf_rounded
                            : Icons.description_rounded,
                    color: isError
                        ? const Color(0xFFF87171)
                        : isPdf
                            ? const Color(0xFFF87171)
                            : AppColors.primaryLight,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doc.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimaryDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${doc.fileType.toUpperCase()} • ${doc.formattedFileSize} • ${doc.createdAt != null ? doc.createdAt!.split('T').first : ''}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMutedDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isProcessing)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                  )
                else
                  const Icon(Icons.chevron_right_rounded, color: AppColors.textMutedDark, size: 20),
              ],
            ),

            // Summary snippet if available
            if (doc.summary.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                doc.summary,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondaryDark,
                  height: 1.4,
                ),
              ),
            ],

            // Topics Chips & Extracted chars
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (doc.keyTopics.isNotEmpty)
                  Expanded(
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: doc.keyTopics.take(3).map((topic) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLightDark,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            topic,
                            style: const TextStyle(fontSize: 10, color: AppColors.lavenderGlow, fontWeight: FontWeight.w600),
                          ),
                        );
                      }).toList(),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Text(
                  '${doc.extractedChars} chars',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textMutedDark,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
