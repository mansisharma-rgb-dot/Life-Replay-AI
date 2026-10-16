import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/analytics_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/error_state_view.dart';
import '../../widgets/atmospheric_background.dart';
import 'checkin_insights_screen.dart';
import '../reports/growth_report_screen.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final List<String> _ranges = ['7d', '14d', '30d', '90d', '1y'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnalyticsProvider>().fetchAnalytics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final analyticsProvider = context.watch<AnalyticsProvider>();
    final overview = analyticsProvider.overview;
    final lifeScores = analyticsProvider.lifeScores;
    final moodHistory = analyticsProvider.moodHistory;
    final moodDistribution = analyticsProvider.moodDistribution;
    final habitData = analyticsProvider.habitData;
    final productivityData = analyticsProvider.productivityData;
    final sleepData = analyticsProvider.sleepData;
    final waterData = analyticsProvider.waterData;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Personal Growth Analytics'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.insights_rounded, color: AppColors.accentMint),
            tooltip: 'Check-in Insights',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CheckinInsightsScreen()),
              );
            },
          ),
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
          child: analyticsProvider.isLoading
              ? const LoadingView(message: 'Calculating your growth analytics...')
              : analyticsProvider.errorMessage != null && overview == null
                  ? ErrorStateView(
                      message: analyticsProvider.errorMessage!,
                      onRetry: () => analyticsProvider.fetchAnalytics(),
                    )
                  : RefreshIndicator(
                      color: AppColors.primaryLight,
                      backgroundColor: AppColors.surfaceDark,
                      onRefresh: () => analyticsProvider.fetchAnalytics(),
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        children: [
                          // Top Banner: Check-in Insights & Growth Reports Hub
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.primary.withAlpha(60),
                                  AppColors.surfaceCardDark,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const CheckinInsightsScreen()),
                                      );
                                    },
                                    icon: const Icon(Icons.insights_rounded, size: 16, color: AppColors.accentMint),
                                    label: const Text(
                                      'Check-in Insights',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.warmCream),
                                    ),
                                  ),
                                ),
                                Container(width: 1, height: 20, color: AppColors.borderDark),
                                Expanded(
                                  child: TextButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const GrowthReportScreen()),
                                      );
                                    },
                                    icon: const Icon(Icons.assessment_rounded, size: 16, color: AppColors.lavenderGlow),
                                    label: const Text(
                                      'Growth Reports',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.warmCream),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 1. Time Range Selector Pills
                          _buildRangeSelector(analyticsProvider),
                          const SizedBox(height: 18),

                          // 2. Life Score Hero Card
                          _buildLifeScoreCard(overview),
                          const SizedBox(height: 18),

                          // 3. Metric Overview 4-Grid
                          _buildMetricsGrid(overview),
                          const SizedBox(height: 20),

                          // 4. Life Score Timeline Line Chart
                          _buildLifeScoreTimeline(lifeScores),
                          const SizedBox(height: 20),

                          // 5. Mood Journey & Trend Chart
                          _buildMoodTrendSection(moodHistory, moodDistribution),
                          const SizedBox(height: 20),

                          // 6. Habit Completion & Consistency
                          _buildHabitsAnalyticsSection(habitData),
                          const SizedBox(height: 20),

                          // 7. Productivity & Deep Work Breakdown
                          _buildProductivitySection(productivityData),
                          const SizedBox(height: 20),

                          // 8. Sleep & Recovery Rhythm
                          _buildSleepAnalyticsSection(sleepData),
                          const SizedBox(height: 20),

                          // 9. Hydration & Vitality
                          _buildWaterAnalyticsSection(waterData),
                          const SizedBox(height: 30),
                        ],
                      ),
                    ),
        ),
      ),
    );
  }

  // ─── 1. TIME RANGE SELECTOR ─────────────────────────────────────────────────
  Widget _buildRangeSelector(AnalyticsProvider provider) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _ranges.map((range) {
          final isSelected = provider.selectedRange == range;
          String label = range.toUpperCase();
          if (range == '7d') label = '7 DAYS';
          if (range == '14d') label = '14 DAYS';
          if (range == '30d') label = '1 MONTH';
          if (range == '90d') label = '3 MONTHS';
          if (range == '1y') label = '1 YEAR';

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(label),
              selected: isSelected,
              selectedColor: AppColors.primary,
              backgroundColor: AppColors.surfaceDark,
              side: BorderSide(
                color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
              ),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondaryDark,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
              onSelected: (val) {
                if (val) provider.fetchAnalytics(range: range);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  // ─── 2. LIFE SCORE HERO CARD ────────────────────────────────────────────────
  Widget _buildLifeScoreCard(dynamic overview) {
    final score = overview?.averageLifeScore ?? 0;

    return AppCard(
      hasGlow: true,
      gradient: const LinearGradient(
        colors: [Color(0xFF2E174D), Color(0xFF19102B)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      padding: const EdgeInsets.all(22),
      child: Row(
        children: [
          SizedBox(
            width: 84,
            height: 84,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: score > 0 ? (score / 100).clamp(0.0, 1.0) : 0.05,
                  strokeWidth: 8,
                  backgroundColor: AppColors.surfaceLightDark,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                ),
                Center(
                  child: Text(
                    '$score',
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Average Life Score',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  score >= 75
                      ? 'Exceptional harmony across mood, habits, and focus.'
                      : score >= 50
                          ? 'Consistent steady rhythm with good baseline growth.'
                          : 'Check in daily to build your baseline and unlock deeper insights.',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryDark,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── 3. METRICS 4-GRID ──────────────────────────────────────────────────────
  Widget _buildMetricsGrid(dynamic overview) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      children: [
        _buildMetricTile('Avg Mood', '${overview?.averageMood ?? 0.0}', '✨', AppColors.primaryLight),
        _buildMetricTile('Current Streak', '${overview?.currentStreak ?? 0} Days', '🔥', const Color(0xFFF97316)),
        _buildMetricTile('Check-ins', '${overview?.totalCheckins ?? 0}', '📝', AppColors.accent),
        _buildMetricTile('Consistency', '${overview?.completionRate ?? 0}%', '🎯', AppColors.accentMint),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, String emoji, Color accentColor) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, fontWeight: FontWeight.w600)),
              Text(emoji, style: const TextStyle(fontSize: 16)),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimaryDark,
            ),
          ),
        ],
      ),
    );
  }

  // ─── 4. LIFE SCORE TIMELINE CHART ──────────────────────────────────────────
  Widget _buildLifeScoreTimeline(List<dynamic> lifeScores) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Life Score Timeline',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              if (lifeScores.isNotEmpty)
                Text(
                  '${lifeScores.length} data points',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark, fontWeight: FontWeight.bold),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (lifeScores.length < 2)
            Container(
              height: 150,
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text('🌱', style: TextStyle(fontSize: 28)),
                  SizedBox(height: 8),
                  Text(
                    'Complete 2 or more daily check-ins to generate your trend graph.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                  ),
                ],
              ),
            )
          else
            SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) => FlLine(
                      color: AppColors.borderDark,
                      strokeWidth: 0.8,
                    ),
                  ),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 32,
                        getTitlesWidget: (val, _) => Text(
                          val.toInt().toString(),
                          style: const TextStyle(color: AppColors.textMutedDark, fontSize: 10),
                        ),
                      ),
                    ),
                    bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minY: 0,
                  maxY: 100,
                  lineBarsData: [
                    LineChartBarData(
                      spots: lifeScores.asMap().entries.map((entry) {
                        return FlSpot(entry.key.toDouble(), entry.value.score.toDouble());
                      }).toList(),
                      isCurved: true,
                      color: AppColors.primaryLight,
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.primary.withAlpha(40),
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

  // ─── 5. MOOD JOURNEY & DISTRIBUTION ─────────────────────────────────────────
  Widget _buildMoodTrendSection(List<dynamic> moodHistory, List<dynamic> moodDistribution) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Mood Trajectory & Distribution',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
          ),
          const SizedBox(height: 14),

          // Mood line chart if available
          if (moodHistory.length >= 2) ...[
            SizedBox(
              height: 130,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) => FlLine(color: AppColors.borderDark, strokeWidth: 0.6),
                  ),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 24,
                        getTitlesWidget: (val, _) => Text('${val.toInt()}', style: const TextStyle(color: AppColors.textMutedDark, fontSize: 9)),
                      ),
                    ),
                    bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minY: 1,
                  maxY: 10,
                  lineBarsData: [
                    LineChartBarData(
                      spots: moodHistory.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.mood.toDouble())).toList(),
                      isCurved: true,
                      color: AppColors.accentMint,
                      barWidth: 2.5,
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Distribution Bars
          if (moodDistribution.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: Text('No mood data for this timeframe.', style: TextStyle(fontSize: 12, color: AppColors.textMutedDark)),
              ),
            )
          else
            ...moodDistribution.map((item) {
              final name = item['name'] ?? '';
              final val = item['value'] ?? 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(name, style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark)),
                    ),
                    Expanded(
                      flex: 5,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (val is num && val > 0) ? (val / 100).clamp(0.05, 1.0) : 0.0,
                          minHeight: 6,
                          backgroundColor: AppColors.surfaceLightDark,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('$val%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimaryDark)),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ─── 6. HABIT ANALYTICS ─────────────────────────────────────────────────────
  Widget _buildHabitsAnalyticsSection(dynamic habitData) {
    final habits = habitData?.habits ?? [];
    final completionRate = habitData?.completionRate ?? 0;
    final consistencyScore = habitData?.consistencyScore ?? 0;

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'Habit Completion & Momentum',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '$completionRate% Done',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.accentMint),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Momentum row
          Row(
            children: [
              _buildMiniMetric('Completion Rate', '$completionRate%'),
              const SizedBox(width: 14),
              _buildMiniMetric('Consistency Score', '$consistencyScore/100'),
            ],
          ),
          const SizedBox(height: 14),

          if (habits.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: Text('No habit records tracked yet.', style: TextStyle(fontSize: 12, color: AppColors.textMutedDark)),
              ),
            )
          else
            ...habits.map((h) {
              final name = h.name;
              final comp = h.completion;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.warmCream)),
                        Text('$comp%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryLight)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: comp > 0 ? (comp / 100).clamp(0.0, 1.0) : 0.0,
                        minHeight: 5,
                        backgroundColor: AppColors.surfaceLightDark,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentMint),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ─── 7. PRODUCTIVITY & DEEP WORK ───────────────────────────────────────────
  Widget _buildProductivitySection(dynamic prodData) {
    final study = prodData?.studyHours ?? 0.0;
    final work = prodData?.workHours ?? 0.0;
    final deepWork = prodData?.deepWork ?? (study + work);
    final exercise = prodData?.exerciseHours ?? 0.0;

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Productivity & Deep Work',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildRhythmStat('Deep Work', '${deepWork.toStringAsFixed(1)}h', '⚡', AppColors.primaryLight),
              _buildRhythmStat('Study', '${study.toStringAsFixed(1)}h', '📚', AppColors.accent),
              _buildRhythmStat('Work', '${work.toStringAsFixed(1)}h', '💼', AppColors.lavenderGlow),
              _buildRhythmStat('Exercise', '${exercise.toStringAsFixed(1)}h', '🏃', AppColors.accentMint),
            ],
          ),
        ],
      ),
    );
  }

  // ─── 8. SLEEP & RECOVERY ────────────────────────────────────────────────────
  Widget _buildSleepAnalyticsSection(dynamic sleepData) {
    final avgSleep = sleepData?.averageSleep ?? 0.0;
    final bestDay = sleepData?.bestSleepDay ?? '-';
    final worstDay = sleepData?.worstSleepDay ?? '-';
    final history = sleepData?.history ?? [];

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Sleep & Rest Rhythm',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
              ),
              Text(
                '${avgSleep.toStringAsFixed(1)} hrs avg',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.lavenderGlow),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMiniMetric('Best Rest Day', bestDay),
              const SizedBox(width: 14),
              _buildMiniMetric('Lowest Rest Day', worstDay),
            ],
          ),
          if (history.length >= 2) ...[
            const SizedBox(height: 14),
            SizedBox(
              height: 100,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minY: 0,
                  maxY: 12,
                  lineBarsData: [
                    LineChartBarData(
                      spots: history.asMap().entries.map((e) {
                        final hrs = (e.value['hours'] as num? ?? 0.0).toDouble();
                        return FlSpot(e.key.toDouble(), hrs);
                      }).toList(),
                      isCurved: true,
                      color: AppColors.lavenderGlow,
                      barWidth: 2.5,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.lavenderGlow.withAlpha(30),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ─── 9. WATER & HYDRATION ───────────────────────────────────────────────────
  Widget _buildWaterAnalyticsSection(dynamic waterData) {
    final avgIntake = waterData?.averageIntake ?? 0.0;
    final goalCompletion = waterData?.goalCompletion ?? 0;

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Hydration & Vitality',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
              ),
              Text(
                '💧 ${avgIntake.toStringAsFixed(1)} L/day',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.accent),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMiniMetric('Average Intake', '${avgIntake.toStringAsFixed(1)} Liters'),
              const SizedBox(width: 14),
              _buildMiniMetric('Goal Target Met', '$goalCompletion% of days'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniMetric(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceLightDark,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimaryDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildRhythmStat(String label, String value, String emoji, Color accentColor) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.textPrimaryDark)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryDark)),
      ],
    );
  }
}
