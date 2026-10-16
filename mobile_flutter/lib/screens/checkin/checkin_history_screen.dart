import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/checkin_model.dart';
import '../../providers/checkin_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/error_state_view.dart';
import '../../widgets/empty_state_view.dart';
import 'checkin_detail_sheet.dart';
import 'checkin_calendar_screen.dart';

class CheckinHistoryScreen extends StatefulWidget {
  const CheckinHistoryScreen({super.key});

  @override
  State<CheckinHistoryScreen> createState() => _CheckinHistoryScreenState();
}

class _CheckinHistoryScreenState extends State<CheckinHistoryScreen> {
  final List<Map<String, String>> _periodOptions = [
    {'key': 'all', 'label': 'All Time'},
    {'key': 'this_week', 'label': 'This Week'},
    {'key': 'last_week', 'label': 'Last Week'},
    {'key': 'this_month', 'label': 'This Month'},
    {'key': 'last_month', 'label': 'Last Month'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CheckinProvider>().fetchHistory(page: 1, refresh: true);
    });
  }

  String _formatEntryDate(String dateStr) {
    try {
      final parts = dateStr.split('T')[0].split('-');
      if (parts.length == 3) {
        final d = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${weekdays[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}, ${d.year}';
      }
    } catch (_) {}
    return dateStr;
  }

  @override
  Widget build(BuildContext context) {
    final checkinProvider = context.watch<CheckinProvider>();
    final history = checkinProvider.history;
    final isLoading = checkinProvider.isLoadingHistory && history.isEmpty;
    final error = checkinProvider.historyError;
    final selectedPeriod = checkinProvider.selectedPeriod;

    // Derived summary metrics from real loaded records
    final int totalEntries = history.length;
    final int completedCount = history.where((h) => h.isCompleted).length;

    final scores = history
        .map((h) => h.lifeScore)
        .whereType<int>()
        .where((s) => s > 0)
        .toList();
    final int? avgLifeScore = scores.isNotEmpty
        ? (scores.reduce((a, b) => a + b) / scores.length).round()
        : null;

    final ratings = history
        .map((h) => h.dailyRating)
        .where((r) => r > 0)
        .toList();
    final double? avgRating = ratings.isNotEmpty
        ? (ratings.reduce((a, b) => a + b) / ratings.length)
        : null;

    final double totalDeepWorkHours = history.fold(0.0, (sum, h) {
      return sum + h.activities.studyHours + h.activities.workHours;
    });

    final sleepList = history
        .map((h) => h.activities.sleepHours)
        .where((s) => s > 0)
        .toList();
    final double? avgSleep = sleepList.isNotEmpty
        ? (sleepList.reduce((a, b) => a + b) / sleepList.length)
        : null;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Check-in History'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_rounded, color: AppColors.lavenderGlow),
            tooltip: 'Interactive Calendar',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CheckinCalendarScreen()),
              );
            },
          ),
        ],
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // 1. Period Filter Tabs Strip
              _buildPeriodFilterBar(checkinProvider, selectedPeriod),

              // 2. Main Content
              Expanded(
                child: isLoading
                    ? const LoadingView(message: 'Loading check-in history...')
                    : error != null && history.isEmpty
                        ? ErrorStateView(
                            message: error,
                            onRetry: () => checkinProvider.fetchHistory(page: 1, refresh: true),
                          )
                        : RefreshIndicator(
                            color: AppColors.primaryLight,
                            backgroundColor: AppColors.surfaceDark,
                            onRefresh: () => checkinProvider.fetchHistory(page: 1, refresh: true),
                            child: ListView(
                              padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                              children: [
                                // Summary statistics card
                                if (history.isNotEmpty)
                                  _buildSummaryHeader(
                                    totalEntries: totalEntries,
                                    completedCount: completedCount,
                                    avgLifeScore: avgLifeScore,
                                    avgRating: avgRating,
                                    totalDeepWorkHours: totalDeepWorkHours,
                                    avgSleep: avgSleep,
                                  ),
                                const SizedBox(height: 16),

                                // History entries list or empty state
                                if (history.isEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 40),
                                    child: EmptyStateView(
                                      title: 'No check-ins found',
                                      description: selectedPeriod == 'all'
                                          ? 'Your journey is just beginning. Complete your daily check-in to build your personal history!'
                                          : 'No check-ins recorded for this period. Try selecting another filter or log today’s check-in.',
                                      actionText: selectedPeriod != 'all' ? 'Show All History' : null,
                                      onAction: selectedPeriod != 'all'
                                          ? () => checkinProvider.setSelectedPeriod('all')
                                          : null,
                                    ),
                                  )
                                else ...[
                                  Text(
                                    'Logged Check-ins (${history.length})',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textPrimaryDark,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  ...history.map((item) => _buildCheckinCard(context, item)),

                                  // Pagination load more
                                  if (checkinProvider.hasMoreHistory)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 12, bottom: 20),
                                      child: Center(
                                        child: ElevatedButton.icon(
                                          onPressed: checkinProvider.isLoadingHistory
                                              ? null
                                              : () {
                                                  checkinProvider.fetchHistory(
                                                    page: checkinProvider.historyCurrentPage + 1,
                                                  );
                                                },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.surfaceCardDark,
                                            foregroundColor: AppColors.primaryLight,
                                            side: const BorderSide(color: AppColors.primaryLight),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(16),
                                            ),
                                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                          ),
                                          icon: checkinProvider.isLoadingHistory
                                              ? const SizedBox(
                                                  width: 16,
                                                  height: 16,
                                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                                                )
                                              : const Icon(Icons.expand_more_rounded),
                                          label: Text(
                                            checkinProvider.isLoadingHistory ? 'Loading...' : 'Load Earlier Records',
                                            style: const TextStyle(fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ],
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPeriodFilterBar(CheckinProvider provider, String selectedPeriod) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark.withAlpha(200),
        border: const Border(bottom: BorderSide(color: AppColors.borderDark)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: _periodOptions.map((opt) {
            final isSelected = opt['key'] == selectedPeriod;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(opt['label']!),
                selected: isSelected,
                onSelected: (_) => provider.setSelectedPeriod(opt['key']!),
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : AppColors.textSecondaryDark,
                ),
                selectedColor: AppColors.primary,
                backgroundColor: AppColors.surfaceLightDark,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(
                    color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildSummaryHeader({
    required int totalEntries,
    required int completedCount,
    required int? avgLifeScore,
    required double? avgRating,
    required double totalDeepWorkHours,
    required double? avgSleep,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Period Overview',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.warmCream,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(40),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$completedCount complete',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryLight),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildSummaryItem(
                'Logged Days',
                '$totalEntries',
                Icons.calendar_today_rounded,
                AppColors.primaryLight,
              ),
              const SizedBox(width: 8),
              _buildSummaryItem(
                'Avg Score',
                avgLifeScore != null ? '$avgLifeScore' : (avgRating != null ? '${avgRating.toStringAsFixed(1)}/10' : '—'),
                Icons.auto_awesome_rounded,
                AppColors.lavenderGlow,
              ),
              const SizedBox(width: 8),
              _buildSummaryItem(
                'Deep Work',
                '${totalDeepWorkHours.toStringAsFixed(1)}h',
                Icons.schedule_rounded,
                AppColors.accentMint,
              ),
              const SizedBox(width: 8),
              _buildSummaryItem(
                'Avg Sleep',
                avgSleep != null ? '${avgSleep.toStringAsFixed(1)}h' : '—',
                Icons.bedtime_rounded,
                AppColors.periwinkle,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
              ),
            ),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                maxLines: 1,
                softWrap: false,
                style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMutedDark,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckinCard(BuildContext context, CheckinModel item) {
    final acts = item.activities;
    final mood = item.mood;
    final wb = item.wellbeing;
    final habits = item.habitLogs;
    final habitsCompleted = habits.where((h) => h.completed).length;
    final moodAsset = AppAssets.getCharacterForMood(mood.moodLabel);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        borderRadius: 22,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Date & Status Pill
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_rounded, size: 16, color: AppColors.lavenderGlow),
                    const SizedBox(width: 6),
                    Text(
                      _formatEntryDate(item.date),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.warmCream,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: item.isCompleted
                        ? AppColors.accentMint.withAlpha(35)
                        : AppColors.accentAmber.withAlpha(35),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: item.isCompleted
                          ? AppColors.accentMint.withAlpha(100)
                          : AppColors.accentAmber.withAlpha(100),
                    ),
                  ),
                  child: Text(
                    item.isCompleted ? 'Completed' : 'Draft',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: item.isCompleted ? AppColors.accentMint : AppColors.accentAmber,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Middle: Character & Mood info & Score Badges
            Row(
              children: [
                // Plush Avatar
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primaryLight.withAlpha(80), width: 1.5),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(moodAsset, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            mood.moodLabel.isNotEmpty ? mood.moodLabel : 'Content',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimaryDark,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (item.lifeScore != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(50),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Score: ${item.lifeScore}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.lavenderGlow),
                              ),
                            ),
                          if (item.dailyRating > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.accentAmber.withAlpha(40),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '★ ${item.dailyRating}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.accentAmber),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (mood.note.isNotEmpty)
                        Text(
                          '"${mood.note}"',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                            color: AppColors.textSecondaryDark,
                          ),
                        )
                      else
                        Text(
                          'Mood: ${mood.moodScore}/10 • Intensity: ${mood.intensity}/5',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Wellbeing & Activity Mini Indicators
            Row(
              children: [
                _buildMiniMetric('⚡', 'Energy', '${wb.energyLevel}/5'),
                const SizedBox(width: 6),
                _buildMiniMetric('🛌', 'Sleep', '${acts.sleepHours}h'),
                const SizedBox(width: 6),
                _buildMiniMetric('💼', 'Deep Work', '${(acts.studyHours + acts.workHours).toStringAsFixed(1)}h'),
                const SizedBox(width: 6),
                _buildMiniMetric('💧', 'Water', '${acts.waterIntakeMl}ml'),
              ],
            ),

            if (habits.isNotEmpty || item.journal.content.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (habits.isNotEmpty)
                    Text(
                      'Habits: $habitsCompleted/${habits.length} done',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.accentMint),
                    ),
                  if (habits.isNotEmpty && item.journal.content.isNotEmpty)
                    const Text(' • ', style: TextStyle(color: AppColors.textMutedDark)),
                  if (item.journal.content.isNotEmpty)
                    const Expanded(
                      child: Text(
                        'Reflection logged 📖',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.periwinkle),
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),

            // View Details Action Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => CheckinDetailSheet.show(context, item),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryLight,
                  side: BorderSide(color: AppColors.primaryLight.withAlpha(80)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('View Complete Check-in', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    SizedBox(width: 6),
                    Icon(Icons.arrow_forward_rounded, size: 14),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniMetric(String emoji, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 11)),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.warmCream),
            ),
          ],
        ),
      ),
    );
  }
}
