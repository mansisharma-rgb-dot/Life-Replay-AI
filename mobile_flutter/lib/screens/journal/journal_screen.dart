import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../providers/journal_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/mood_badge.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/atmospheric_background.dart';
import 'journal_edit_screen.dart';
import '../documents/documents_screen.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});

  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JournalProvider>().fetchJournals();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final journalProvider = context.watch<JournalProvider>();
    final isLoading = journalProvider.isLoading;
    final allJournals = journalProvider.journals;

    final filtered = allJournals.where((j) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return j.title.toLowerCase().contains(q) || j.content.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Journal & Reflections'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_present_rounded, color: AppColors.lavenderGlow, size: 24),
            tooltip: 'PDF & Document Memories',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DocumentsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primaryLight, size: 26),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const JournalEditScreen()),
              );
            },
          ),
        ],
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: Column(
            children: [
            // Search Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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
                    hintText: 'Search memories & reflections...',
                    prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMutedDark, size: 20),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Content
            Expanded(
              child: isLoading
                  ? const LoadingView(message: 'Retrieving your reflections...')
                  : filtered.isEmpty
                      ? EmptyStateView(
                          imagePath: AppAssets.gratitudeReading,
                          title: _searchQuery.isEmpty ? 'Your Journal is Empty' : 'No Results Found',
                          description: _searchQuery.isEmpty
                              ? 'Capture a thought, gratitude moment, or daily experience to preserve it forever.'
                              : 'Try adjusting your search keywords.',
                          actionText: _searchQuery.isEmpty ? 'Write Reflection' : null,
                          onAction: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const JournalEditScreen()),
                            );
                          },
                        )
                      : RefreshIndicator(
                          color: AppColors.primaryLight,
                          backgroundColor: AppColors.surfaceDark,
                          onRefresh: () => context.read<JournalProvider>().fetchJournals(),
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) {
                              final journal = filtered[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: AppCard(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => JournalEditScreen(journal: journal),
                                      ),
                                    );
                                  },
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            journal.date,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.textMutedDark,
                                            ),
                                          ),
                                          if (journal.moodScore != null)
                                            MoodBadge(
                                              moodScore: journal.moodScore!,
                                              label: journal.moodLabel,
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        journal.title,
                                        style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.textPrimaryDark,
                                        ),
                                      ),
                                      if (journal.content.isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          journal.content,
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: AppColors.textSecondaryDark,
                                            height: 1.4,
                                          ),
                                        ),
                                      ],
                                      if (journal.tags.isNotEmpty) ...[
                                        const SizedBox(height: 10),
                                        Wrap(
                                          spacing: 6,
                                          children: journal.tags.map((tag) {
                                            return Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppColors.surfaceLightDark,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                '#$tag',
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.primaryLight,
                                                ),
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.edit_rounded, color: Colors.white),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const JournalEditScreen()),
          );
        },
      ),
    );
  }
}
