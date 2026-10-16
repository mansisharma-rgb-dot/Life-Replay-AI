import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../models/growth_report_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/error_state_view.dart';

class GrowthReportScreen extends StatefulWidget {
  const GrowthReportScreen({super.key});

  @override
  State<GrowthReportScreen> createState() => _GrowthReportScreenState();
}

class _GrowthReportScreenState extends State<GrowthReportScreen> {
  final ApiClient _api = ApiClient();
  String _selectedRange = '30d'; // '7d' | '30d' | '90d' | 'custom'

  DateTime? _customStartDate;
  DateTime? _customEndDate;

  GrowthReportModel? _report;
  GrowthReportModel? _previousReport; // For previous period comparison
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchReport();
    });
  }

  Future<void> _fetchReport() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final now = DateTime.now();
    DateTime start;
    DateTime end = DateTime(now.year, now.month, now.day);
    DateTime prevStart;
    DateTime prevEnd;

    int days = 30;
    if (_selectedRange == '7d') days = 7;
    if (_selectedRange == '90d') days = 90;

    if (_selectedRange == 'custom' && _customStartDate != null && _customEndDate != null) {
      start = _customStartDate!;
      end = _customEndDate!;
      final span = end.difference(start).inDays + 1;
      prevEnd = start.subtract(const Duration(days: 1));
      prevStart = prevEnd.subtract(Duration(days: span - 1));
    } else {
      start = end.subtract(Duration(days: days - 1));
      prevEnd = start.subtract(const Duration(days: 1));
      prevStart = prevEnd.subtract(Duration(days: days - 1));
    }

    final startStr = start.toIso8601String().split('T')[0];
    final endStr = end.toIso8601String().split('T')[0];
    final prevStartStr = prevStart.toIso8601String().split('T')[0];
    final prevEndStr = prevEnd.toIso8601String().split('T')[0];

    try {
      dynamic res;
      try {
        res = await _api.get(ApiConstants.reportsRange, queryParameters: {
          'start_date': startStr,
          'end_date': endStr,
        });
      } catch (rangeErr) {
        // Fallback to existing production endpoints if remote Render has not deployed /reports/range yet
        if (_selectedRange == '7d') {
          res = await _api.get(ApiConstants.reportsWeekly, queryParameters: {
            'start_date': startStr,
            'end_date': endStr,
          });
        } else if (_selectedRange == '30d') {
          res = await _api.get(ApiConstants.reportsMonthly, queryParameters: {
            'year': now.year,
            'month': now.month,
          });
        } else {
          try {
            res = await _api.get(ApiConstants.reportsMonthly, queryParameters: {
              'year': now.year,
              'month': now.month,
            });
          } catch (_) {
            rethrow;
          }
        }
      }

      GrowthReportModel current = GrowthReportModel(
        period: ReportPeriod(startDate: startStr, endDate: endStr, label: '$startStr to $endStr'),
        isEmpty: true,
      );

      if (res is Map<String, dynamic>) {
        current = GrowthReportModel.fromJson(res);
      }

      // Try fetching previous period for real comparison
      GrowthReportModel? prev;
      try {
        dynamic prevRes;
        try {
          prevRes = await _api.get(ApiConstants.reportsRange, queryParameters: {
            'start_date': prevStartStr,
            'end_date': prevEndStr,
          });
        } catch (_) {
          if (_selectedRange == '7d') {
            prevRes = await _api.get(ApiConstants.reportsWeekly, queryParameters: {
              'period': 'last_week',
            });
          } else if (_selectedRange == '30d') {
            final prevMonthDate = DateTime(now.year, now.month - 1, 1);
            prevRes = await _api.get(ApiConstants.reportsMonthly, queryParameters: {
              'year': prevMonthDate.year,
              'month': prevMonthDate.month,
            });
          }
        }

        if (prevRes is Map<String, dynamic> && prevRes['empty'] != true) {
          prev = GrowthReportModel.fromJson(prevRes);
        }
      } catch (_) {}

      setState(() {
        _report = current;
        _previousReport = prev;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _pickCustomRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: now,
      initialDateRange: DateTimeRange(
        start: _customStartDate ?? now.subtract(const Duration(days: 14)),
        end: _customEndDate ?? now,
      ),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surfaceDark,
              onSurface: AppColors.warmCream,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedRange = 'custom';
        _customStartDate = picked.start;
        _customEndDate = picked.end;
      });
      _fetchReport();
    }
  }

  void _exportReport() {
    final rep = _report;
    if (rep == null) return;

    final user = context.read<AuthProvider>().user;
    final userName = user?.fullName ?? 'User';

    final buffer = StringBuffer();
    buffer.writeln('==============================================');
    buffer.writeln('   LIFE REPLAY AI — PERSONAL GROWTH REPORT    ');
    buffer.writeln('==============================================');
    buffer.writeln('User: $userName');
    buffer.writeln('Period: ${rep.period.label.isNotEmpty ? rep.period.label : "${rep.period.startDate} - ${rep.period.endDate}"}');
    buffer.writeln('Generated: ${DateTime.now().toLocal()}');
    buffer.writeln('----------------------------------------------');
    buffer.writeln('METRICS SUMMARY:');
    buffer.writeln('• Total Check-in Days: ${rep.totalCheckinDays}');
    buffer.writeln('• Average Life Score: ${rep.averageLifeScore ?? "Not recorded"}');
    buffer.writeln('• Average Mood: ${rep.averageMood != null ? "${rep.averageMood!.toStringAsFixed(1)} / 10" : "Not recorded"}');
    buffer.writeln('• Deep Work Hours: ${(rep.totalStudyHours + rep.totalWorkHours).toStringAsFixed(1)}h (Study: ${rep.totalStudyHours}h, Work: ${rep.totalWorkHours}h)');
    buffer.writeln('• Average Sleep: ${rep.averageSleepHours != null ? "${rep.averageSleepHours!.toStringAsFixed(1)}h" : "Not recorded"}');
    buffer.writeln('• Average Water: ${rep.averageWaterIntakeMl != null ? "${rep.averageWaterIntakeMl} ml" : "Not recorded"}');
    buffer.writeln('• Habit Completion: ${rep.habitCompletionRate}%');
    buffer.writeln('• Goals Completed: ${rep.completedGoals}');
    buffer.writeln('• Achievements Unlocked: ${rep.achievementsUnlocked}');
    buffer.writeln('----------------------------------------------');

    if (rep.highlights.isNotEmpty) {
      buffer.writeln('HIGHLIGHTS & STRENGTHS:');
      for (final h in rep.highlights) {
        buffer.writeln('✓ ${h.title}: ${h.description}');
      }
      buffer.writeln('----------------------------------------------');
    }

    if (rep.challenges.isNotEmpty) {
      buffer.writeln('OBSERVED CHALLENGES / INCONSISTENCIES:');
      for (final c in rep.challenges) {
        buffer.writeln('! $c');
      }
      buffer.writeln('----------------------------------------------');
    }

    if (rep.reflectionText != null && rep.reflectionText!.isNotEmpty) {
      buffer.writeln('REFLECTION & NARRATIVE:');
      buffer.writeln(rep.reflectionText);
      buffer.writeln('----------------------------------------------');
    }

    if (rep.suggestionsText != null && rep.suggestionsText!.isNotEmpty) {
      buffer.writeln('GENTLE SUGGESTIONS:');
      buffer.writeln(rep.suggestionsText);
      buffer.writeln('----------------------------------------------');
    }

    buffer.writeln('Confidential & Personalized for $userName.');
    buffer.writeln('==============================================');

    Clipboard.setData(ClipboardData(text: buffer.toString()));

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceCardDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_outline_rounded, color: AppColors.accentMint),
            SizedBox(width: 10),
            Text('Report Exported!', style: TextStyle(fontSize: 16, color: AppColors.warmCream)),
          ],
        ),
        content: const Text(
          'Your verified Personal Growth Report has been formatted and copied to your clipboard. You can paste it into notes, documents, or share it securely.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Done', style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rep = _report;
    final prev = _previousReport;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Personal Growth Report'),
        elevation: 0,
        actions: [
          if (rep != null && !rep.isEmpty)
            IconButton(
              icon: const Icon(Icons.share_rounded, color: AppColors.lavenderGlow),
              tooltip: 'Export Report',
              onPressed: _exportReport,
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
              // Date Range Selector
              _buildRangeBar(),

              // Report Content
              Expanded(
                child: _isLoading
                    ? const LoadingView(message: 'Generating your growth report...')
                    : _errorMessage != null
                        ? ErrorStateView(
                            message: _errorMessage!,
                            onRetry: _fetchReport,
                          )
                        : rep == null || rep.isEmpty
                            ? _buildEmptyReportView()
                            : RefreshIndicator(
                                color: AppColors.primaryLight,
                                backgroundColor: AppColors.surfaceDark,
                                onRefresh: _fetchReport,
                                child: ListView(
                                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                                  children: [
                                    // 1. Period Title Banner
                                    _buildPeriodBanner(rep),
                                    const SizedBox(height: 18),

                                    // 2. Metrics & Previous Period Comparison
                                    _buildMetricsGrid(rep, prev),
                                    const SizedBox(height: 18),

                                    // 3. Observed Highlights
                                    if (rep.highlights.isNotEmpty) ...[
                                      _buildHighlightsCard(rep.highlights),
                                      const SizedBox(height: 18),
                                    ],

                                    // 4. Inconsistencies / Growth Opportunities
                                    if (rep.challenges.isNotEmpty) ...[
                                      _buildChallengesCard(rep.challenges),
                                      const SizedBox(height: 18),
                                    ],

                                    // 5. Reflection & Personalized Narrative
                                    if (rep.reflectionText != null && rep.reflectionText!.isNotEmpty) ...[
                                      _buildReflectionCard(rep.reflectionText!, rep.aiAvailable),
                                      const SizedBox(height: 18),
                                    ],

                                    // 6. Gentle Suggestions & Reflection Prompts
                                    if (rep.suggestionsText != null && rep.suggestionsText!.isNotEmpty) ...[
                                      _buildSuggestionsCard(rep.suggestionsText!),
                                      const SizedBox(height: 18),
                                    ],

                                    // 7. Export Button
                                    ElevatedButton.icon(
                                      onPressed: _exportReport,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.surfaceCardDark,
                                        foregroundColor: AppColors.primaryLight,
                                        side: const BorderSide(color: AppColors.primaryLight),
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      ),
                                      icon: const Icon(Icons.copy_rounded, size: 18),
                                      label: const Text(
                                        'Copy & Export Report Summary',
                                        style: TextStyle(fontWeight: FontWeight.w700),
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

  Widget _buildRangeBar() {
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
          children: [
            _buildRangeChip('7d', 'Last 7 Days'),
            const SizedBox(width: 8),
            _buildRangeChip('30d', 'Last 30 Days'),
            const SizedBox(width: 8),
            _buildRangeChip('90d', 'Last 90 Days'),
            const SizedBox(width: 8),
            ChoiceChip(
              label: Text(
                _selectedRange == 'custom' && _customStartDate != null
                    ? '${_customStartDate!.month}/${_customStartDate!.day} - ${_customEndDate!.month}/${_customEndDate!.day}'
                    : 'Custom Range 📅',
              ),
              selected: _selectedRange == 'custom',
              onSelected: (_) => _pickCustomRange(),
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: _selectedRange == 'custom' ? Colors.white : AppColors.textSecondaryDark,
              ),
              selectedColor: AppColors.primary,
              backgroundColor: AppColors.surfaceLightDark,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: _selectedRange == 'custom' ? AppColors.primaryLight : AppColors.borderDark,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRangeChip(String key, String label) {
    final isSelected = _selectedRange == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        setState(() => _selectedRange = key);
        _fetchReport();
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
        side: BorderSide(
          color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
        ),
      ),
    );
  }

  Widget _buildPeriodBanner(GrowthReportModel rep) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withAlpha(70),
            AppColors.surfaceCardDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primaryLight.withAlpha(90)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(60),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.assessment_rounded, color: AppColors.lavenderGlow, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'EXECUTIVE GROWTH REPORT',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                    color: AppColors.lavenderGlow,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  rep.period.label.isNotEmpty ? rep.period.label : '${rep.period.startDate} to ${rep.period.endDate}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.warmCream,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Based on ${rep.totalCheckinDays} verified recorded days',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(GrowthReportModel rep, GrowthReportModel? prev) {
    final double totalDeepWork = rep.totalStudyHours + rep.totalWorkHours;
    final double? prevDeepWork = prev != null ? (prev.totalStudyHours + prev.totalWorkHours) : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Core Performance Metrics',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricComparisonCard(
                'LOGGED CHECK-INS',
                '${rep.totalCheckinDays}',
                prev != null ? '${prev.totalCheckinDays}' : null,
                'days',
                AppColors.primaryLight,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricComparisonCard(
                'AVG LIFE SCORE',
                rep.averageLifeScore != null ? '${rep.averageLifeScore}' : '—',
                prev?.averageLifeScore != null ? '${prev!.averageLifeScore}' : null,
                '',
                AppColors.lavenderGlow,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricComparisonCard(
                'DEEP WORK',
                '${totalDeepWork.toStringAsFixed(1)}h',
                prevDeepWork != null ? '${prevDeepWork.toStringAsFixed(1)}h' : null,
                '',
                AppColors.accentMint,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricComparisonCard(
                'AVG MOOD',
                rep.averageMood != null ? rep.averageMood!.toStringAsFixed(1) : '—',
                prev?.averageMood != null ? prev!.averageMood!.toStringAsFixed(1) : null,
                '/ 10',
                AppColors.accentAmber,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricComparisonCard(
                'AVG SLEEP',
                rep.averageSleepHours != null ? '${rep.averageSleepHours!.toStringAsFixed(1)}h' : '—',
                prev?.averageSleepHours != null ? '${prev!.averageSleepHours!.toStringAsFixed(1)}h' : null,
                '',
                AppColors.periwinkle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricComparisonCard(
                'HABIT COMPLETION',
                '${rep.habitCompletionRate}%',
                prev != null ? '${prev.habitCompletionRate}%' : null,
                '',
                AppColors.accentMint,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricComparisonCard(
    String title,
    String current,
    String? previous,
    String unit,
    Color color,
  ) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      borderRadius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.6, color: color),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                current,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.warmCream),
              ),
              if (unit.isNotEmpty) ...[
                const SizedBox(width: 4),
                Text(unit, style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark)),
              ],
            ],
          ),
          const SizedBox(height: 4),
          if (previous != null)
            Text(
              'Prev period: $previous',
              style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
            )
          else
            const Text(
              'No previous baseline',
              style: TextStyle(fontSize: 10, color: AppColors.textMutedDark),
            ),
        ],
      ),
    );
  }

  Widget _buildHighlightsCard(List<ReportHighlight> highlights) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.star_rounded, color: AppColors.accentMint, size: 18),
              SizedBox(width: 8),
              Text(
                'Observed Strengths & Highlights',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...highlights.map((h) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.accentMint, size: 16),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            h.title,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            h.description,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildChallengesCard(List<String> challenges) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.flag_rounded, color: AppColors.accentCoral, size: 18),
              SizedBox(width: 8),
              Text(
                'Areas of Inconsistency',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...challenges.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppColors.accentCoral, size: 16),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        c,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, height: 1.4),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildReflectionCard(String text, bool aiVerified) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_stories_rounded, color: AppColors.lavenderGlow, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Growth Narrative & Reflection',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
                ),
              ),
              if (aiVerified) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(40),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text('AI Synthesized', style: TextStyle(fontSize: 9, color: AppColors.lavenderGlow, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Text(
            text,
            style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.textPrimaryDark),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionsCard(String text) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      borderRadius: 22,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_rounded, color: AppColors.accentAmber, size: 18),
              SizedBox(width: 8),
              Text(
                'Practical Reflection Prompts',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.warmCream),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            text,
            style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.textSecondaryDark),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyReportView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surfaceLightDark,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.assessment_outlined, size: 44, color: AppColors.lavenderGlow),
            ),
            const SizedBox(height: 18),
            const Text(
              'No Check-ins Found in this Window',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.warmCream),
            ),
            const SizedBox(height: 8),
            const Text(
              'A minimum of 1 recorded check-in is required to generate personal analytics and progress reports. Try selecting a broader date range or log today’s check-in.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textMutedDark, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                setState(() => _selectedRange = '30d');
                _fetchReport();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('View Last 30 Days', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}
