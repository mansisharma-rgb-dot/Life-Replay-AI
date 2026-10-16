import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../providers/checkin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/loading_view.dart';
import '../reports/growth_report_screen.dart';

class CheckinInsightsScreen extends StatefulWidget {
  const CheckinInsightsScreen({super.key});

  @override
  State<CheckinInsightsScreen> createState() => _CheckinInsightsScreenState();
}

class _CheckinInsightsScreenState extends State<CheckinInsightsScreen> {
  String _selectedRange = '30d';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadHistoryForInsights();
    });
  }

  void _loadHistoryForInsights() {
    int days = 30;
    if (_selectedRange == '7d') days = 7;
    if (_selectedRange == '14d') days = 14;
    if (_selectedRange == '90d') days = 90;

    final now = DateTime.now();
    final startDate = now.subtract(Duration(days: days)).toIso8601String().split('T')[0];
    final endDate = now.toIso8601String().split('T')[0];

    context.read<CheckinProvider>().fetchHistory(
      page: 1,
      perPage: 100,
      startDate: startDate,
      endDate: endDate,
      refresh: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final checkinProvider = context.watch<CheckinProvider>();
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    final history = checkinProvider.history;
    final isLoading = checkinProvider.isLoadingHistory && history.isEmpty;

    int totalExpectedDays = 30;
    if (_selectedRange == '7d') totalExpectedDays = 7;
    if (_selectedRange == '14d') totalExpectedDays = 14;
    if (_selectedRange == '90d') totalExpectedDays = 90;

    final int totalRecorded = history.length;
    final int completedCount = history.where((h) => h.isCompleted).length;
    final int completionRate = totalExpectedDays > 0
        ? ((totalRecorded / totalExpectedDays) * 100).clamp(0, 100).toInt()
        : 0;

    // Mood distribution calculation from actual records
    final Map<String, int> moodCounts = {};
    for (final h in history) {
      final label = h.mood.moodLabel.isNotEmpty ? h.mood.moodLabel : 'Content';
      moodCounts[label] = (moodCounts[label] ?? 0) + 1;
    }

    String topMood = 'None';
    int topMoodCount = 0;
    moodCounts.forEach((label, count) {
      if (count > topMoodCount) {
        topMoodCount = count;
        topMood = label;
      }
    });

    // Wellbeing calculations
    double avgEnergy = 0.0;
    double avgStress = 0.0;
    double avgFocus = 0.0;
    double avgMotivation = 0.0;
    if (history.isNotEmpty) {
      avgEnergy = history.fold(0.0, (s, h) => s + h.wellbeing.energyLevel) / history.length;
      avgStress = history.fold(0.0, (s, h) => s + h.wellbeing.stressLevel) / history.length;
      avgFocus = history.fold(0.0, (s, h) => s + h.wellbeing.focusLevel) / history.length;
      avgMotivation = history.fold(0.0, (s, h) => s + h.wellbeing.motivationLevel) / history.length;
    }

    // Day of week check-in consistency
    final Map<int, int> weekdayCheckins = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};
    for (final h in history) {
      try {
        final parts = h.date.split('T')[0].split('-');
        if (parts.length == 3) {
          final dt = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
          weekdayCheckins[dt.weekday] = (weekdayCheckins[dt.weekday] ?? 0) + 1;
        }
      } catch (_) {}
    }

    // Chronological points for mood trend line
    final sortedHistory = List.of(history)
      ..sort((a, b) => a.date.compareTo(b.date));
    final List<FlSpot> moodSpots = [];
    for (int i = 0; i < sortedHistory.length; i++) {
      moodSpots.add(FlSpot(i.toDouble(), sortedHistory[i].mood.moodScore.toDouble()));
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Personal Insights'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.assessment_rounded, color: AppColors.lavenderGlow),
            tooltip: 'Growth Reports',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const GrowthReportScreen()),
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
              // Time Range Selector
              _buildRangePills(),

              // Content Area
              Expanded(
                child: isLoading
                    ? const LoadingView(message: 'Analyzing check-in patterns...')
                    : RefreshIndicator(
                        color: AppColors.primaryLight,
                        backgroundColor: AppColors.surfaceDark,
                        onRefresh: () async => _loadHistoryForInsights(),
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                          children: [
                            // 1. Summary Statistics Cards
                            _buildSummarySection(
                              totalRecorded: totalRecorded,
                              completedCount: completedCount,
                              totalExpectedDays: totalExpectedDays,
                              completionRate: completionRate,
                              currentStreak: user?.currentStreak ?? 0,
                              longestStreak: user?.longestStreak ?? 0,
                              topMood: topMood,
                              topMoodCount: topMoodCount,
                            ),
                            const SizedBox(height: 18),

                            // 2. Mood Journey & Trend Chart
                            _buildMoodTrendCard(moodSpots, sortedHistory),
                            const SizedBox(height: 18),

                            // 3. Mood Distribution Breakdown
                            _buildMoodDistributionCard(moodCounts, totalRecorded),
                            const SizedBox(height: 18),

                            // 4. Wellbeing Metrics Balance
                            _buildWellbeingBalanceCard(
                              avgEnergy: avgEnergy,
                              avgStress: avgStress,
                              avgFocus: avgFocus,
                              avgMotivation: avgMotivation,
                              hasRecords: history.isNotEmpty,
                            ),
                            const SizedBox(height: 18),

                            // 5. Day-of-Week Check-in Consistency
                            _buildWeekdayConsistencyCard(weekdayCheckins),
                            const SizedBox(height: 18),

                            // 6. Transparent Personal Patterns & Observations
                            _buildObservationsCard(
                              totalRecorded: totalRecorded,
                              topMood: topMood,
                              topMoodCount: topMoodCount,
                              avgSleep: history.isNotEmpty
                                  ? (history.fold(0.0, (s, h) => s + h.activities.sleepHours) / history.length)
                                  : null,
                              avgEnergy: avgEnergy,
                              totalDeepWork: history.fold(0.0, (s, h) => s + h.activities.studyHours + h.activities.workHours),
                            ),
                            const SizedBox(height: 24),

                            // 7. Full Growth Report CTA Button
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const GrowthReportScreen()),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                elevation: 4,
                              ),
                              icon: const Icon(Icons.assessment_rounded),
                              label: const Text(
                                'Generate Full Growth Report',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                              ),
                            ),
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

  Widget _buildRangePills() {
    final ranges = [
      {'key': '7d', 'label': '7 Days'},
      {'key': '14d', 'label': '14 Days'},
      {'key': '30d', 'label': '30 Days'},
      {'key': '90d', 'label': '90 Days'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark.withAlpha(200),
        border: const Border(bottom: BorderSide(color: AppColors.borderDark)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: ranges.map((r) {
          final isSelected = r['key'] == _selectedRange;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: ChoiceChip(
              label: Text(r['label']!),
              selected: isSelected,
              onSelected: (_) {
                setState(() => _selectedRange = r['key']!);
                _loadHistoryForInsights();
              },
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : AppColors.textSecondaryDark,
              ),
              selectedColor: AppColors.primary,
              backgroundColor: AppColors.surfaceLightDark,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: isSelected ? AppColors.primaryLight : AppColors.borderDark),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSummarySection({
    required int totalRecorded,
    required int completedCount,
    required int totalExpectedDays,
    required int completionRate,
    required int currentStreak,
    required int longestStreak,
    required String topMood,
    required int topMoodCount,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pattern Summary',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                'CHECK-IN RATE',
                '$completionRate%',
                '$totalRecorded of $totalExpectedDays days recorded',
                Icons.check_circle_outline_rounded,
                AppColors.accentMint,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                'ACTIVE STREAK',
                '$currentStreak days',
                'Best: $longestStreak days',
                Icons.local_fire_department_rounded,
                AppColors.accentAmber,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                'TOP RECORDED MOOD',
                topMood,
                topMoodCount > 0 ? 'Recorded $topMoodCount times' : 'No entries yet',
                Icons.mood_rounded,
                AppColors.lavenderGlow,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                'LOGGED ENTRIES',
                '$totalRecorded',
                'In last $totalExpectedDays days',
                Icons.history_rounded,
                AppColors.primaryLight,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, String sub, IconData icon, Color color) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      borderRadius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5, color: color),
                ),
              ),
              const SizedBox(width: 4),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.warmCream),
          ),
          const SizedBox(height: 3),
          Text(
            sub,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
          ),
        ],
      ),
    );
  }

  Widget _buildMoodTrendCard(List<FlSpot> spots, List<dynamic> sorted) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.trending_up_rounded, color: AppColors.lavenderGlow, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Mood Journey Timeline',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
                  ),
                ],
              ),
              if (spots.isNotEmpty)
                Text(
                  '${spots.length} data points',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
                ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Displays actual recorded mood scores (1-10) in chronological order.',
            style: TextStyle(fontSize: 11, color: AppColors.textMutedDark),
          ),
          const SizedBox(height: 18),
          if (spots.length < 2)
            Container(
              height: 120,
              alignment: Alignment.center,
              child: Text(
                spots.isEmpty
                    ? 'No check-in records in this period to plot.'
                    : 'Log at least 2 check-ins to see your mood trend line.',
                style: const TextStyle(fontSize: 12, color: AppColors.textMutedDark),
              ),
            )
          else
            SizedBox(
              height: 140,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 26,
                        getTitlesWidget: (val, _) {
                          if (val == 2 || val == 6 || val == 10) {
                            return Text(
                              '${val.toInt()}',
                              style: const TextStyle(fontSize: 9, color: AppColors.textMutedDark),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                    bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minY: 1,
                  maxY: 10,
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: AppColors.lavenderGlow,
                      barWidth: 2.5,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                          radius: 3,
                          color: AppColors.lavenderGlow,
                          strokeWidth: 1.5,
                          strokeColor: AppColors.backgroundDark,
                        ),
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.lavenderGlow.withAlpha(25),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMoodDistributionCard(Map<String, int> moodCounts, int totalRecorded) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.pie_chart_outline_rounded, color: AppColors.accentMint, size: 18),
              SizedBox(width: 8),
              Text(
                'Mood Distribution',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Frequency of each feeling state recorded during this period.',
            style: TextStyle(fontSize: 11, color: AppColors.textMutedDark),
          ),
          const SizedBox(height: 14),
          if (moodCounts.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No recorded moods in this period.',
                style: TextStyle(fontSize: 12, color: AppColors.textMutedDark),
              ),
            )
          else ...[
            ...moodCounts.entries.map((entry) {
              final pct = totalRecorded > 0 ? (entry.value / totalRecorded) : 0.0;
              final asset = AppAssets.getCharacterForMood(entry.key);

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        SizedBox(
                          width: 22,
                          height: 22,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.asset(asset, fit: BoxFit.cover),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            entry.key,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark),
                          ),
                        ),
                        Text(
                          '${entry.value} (${(pct * 100).toInt()}%)',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.periwinkle),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct,
                        minHeight: 5,
                        backgroundColor: AppColors.surfaceLightDark,
                        valueColor: const AlwaysStoppedAnimation(AppColors.primaryLight),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildWellbeingBalanceCard({
    required double avgEnergy,
    required double avgStress,
    required double avgFocus,
    required double avgMotivation,
    required bool hasRecords,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.balance_rounded, color: AppColors.accentCoral, size: 18),
              SizedBox(width: 8),
              Text(
                'Wellbeing Pillars Average',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Computed from your self-reported 1-5 ratings across recorded days.',
            style: TextStyle(fontSize: 11, color: AppColors.textMutedDark),
          ),
          const SizedBox(height: 14),
          if (!hasRecords)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'No recorded wellbeing scores in this period.',
                style: TextStyle(fontSize: 12, color: AppColors.textMutedDark),
              ),
            )
          else
            Row(
              children: [
                _buildWellbeingColumn('⚡ Energy', avgEnergy, AppColors.accentAmber),
                const SizedBox(width: 8),
                _buildWellbeingColumn('💓 Stress', avgStress, AppColors.accentCoral),
                const SizedBox(width: 8),
                _buildWellbeingColumn('🎯 Focus', avgFocus, AppColors.primaryLight),
                const SizedBox(width: 8),
                _buildWellbeingColumn('🔋 Mot.', avgMotivation, AppColors.accentMint),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildWellbeingColumn(String label, double value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Column(
          children: [
            Text(
              value > 0 ? value.toStringAsFixed(1) : '—',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              '/ 5.0',
              style: const TextStyle(fontSize: 9, color: AppColors.textMutedDark),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeekdayConsistencyCard(Map<int, int> weekdayCheckins) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final maxVal = weekdayCheckins.values.fold(0, (max, val) => val > max ? val : max);

    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.calendar_view_week_rounded, color: AppColors.periwinkle, size: 18),
              SizedBox(width: 8),
              Text(
                'Weekly Consistency Pattern',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Number of check-ins completed on each day of the week.',
            style: TextStyle(fontSize: 11, color: AppColors.textMutedDark),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(7, (i) {
              final count = weekdayCheckins[i + 1] ?? 0;
              final double heightPct = maxVal > 0 ? (count / maxVal).clamp(0.15, 1.0) : 0.15;

              return Column(
                children: [
                  Text(
                    '$count',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.warmCream),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: 22,
                    height: 50 * heightPct,
                    decoration: BoxDecoration(
                      color: count > 0 ? AppColors.primary : AppColors.surfaceLightDark,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: count > 0 ? AppColors.primaryLight : AppColors.borderDark,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    days[i],
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMutedDark),
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildObservationsCard({
    required int totalRecorded,
    required String topMood,
    required int topMoodCount,
    required double? avgSleep,
    required double avgEnergy,
    required double totalDeepWork,
  }) {
    final List<String> observations = [];

    if (totalRecorded == 0) {
      observations.add("No check-ins logged in this window yet. Start logging your daily check-in to surface personal patterns.");
    } else {
      if (topMoodCount > 0) {
        observations.add("Your most frequently reported feeling was '$topMood' ($topMoodCount of $totalRecorded recorded entries).");
      }
      if (avgSleep != null && avgSleep > 0) {
        observations.add("Average sleep recorded: ${avgSleep.toStringAsFixed(1)} hours per night with an average energy score of ${avgEnergy > 0 ? '${avgEnergy.toStringAsFixed(1)}/5' : 'not logged'}.");
      }
      if (totalDeepWork > 0) {
        observations.add("Logged ${totalDeepWork.toStringAsFixed(1)} total hours of combined study and deep work across this timeframe.");
      }
      observations.add("Note: These observations represent descriptive historical summaries of your recorded entries and do not constitute clinical or medical diagnosis.");
    }

    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline_rounded, color: AppColors.accentAmber, size: 18),
              SizedBox(width: 8),
              Text(
                'Personal Pattern Observations',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...observations.map((obs) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(color: AppColors.primaryLight, fontSize: 14)),
                    Expanded(
                      child: Text(
                        obs,
                        style: const TextStyle(fontSize: 12, height: 1.4, color: AppColors.textSecondaryDark),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
