import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/checkin_model.dart';
import '../../providers/checkin_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import 'checkin_detail_sheet.dart';
import 'checkin_history_screen.dart';

class CheckinCalendarScreen extends StatefulWidget {
  const CheckinCalendarScreen({super.key});

  @override
  State<CheckinCalendarScreen> createState() => _CheckinCalendarScreenState();
}

class _CheckinCalendarScreenState extends State<CheckinCalendarScreen> {
  late DateTime _currentMonth;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _currentMonth = DateTime(now.year, now.month, 1);
    _selectedDate = DateTime(now.year, now.month, now.day);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCalendarData();
    });
  }

  void _loadCalendarData() {
    context.read<CheckinProvider>().fetchCalendarMonth(_currentMonth);
    _fetchDetailsForSelectedDate();
  }

  void _fetchDetailsForSelectedDate() {
    final dateStr = _formatDateKey(_selectedDate);
    context.read<CheckinProvider>().fetchCheckinByDate(dateStr);
  }

  String _formatDateKey(DateTime d) {
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  String _formatDisplayDate(DateTime d) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${weekdays[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  String _formatMonthYear(DateTime d) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${months[d.month - 1]} ${d.year}';
  }

  void _prevMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1, 1);
    });
    context.read<CheckinProvider>().fetchCalendarMonth(_currentMonth);
  }

  void _nextMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 1);
    });
    context.read<CheckinProvider>().fetchCalendarMonth(_currentMonth);
  }

  void _goToday() {
    final now = DateTime.now();
    setState(() {
      _currentMonth = DateTime(now.year, now.month, 1);
      _selectedDate = DateTime(now.year, now.month, now.day);
    });
    context.read<CheckinProvider>().fetchCalendarMonth(_currentMonth);
    _fetchDetailsForSelectedDate();
  }

  List<DateTime> _getDaysInMonth(DateTime month) {
    final days = <DateTime>[];
    var curr = DateTime(month.year, month.month, 1);
    while (curr.month == month.month) {
      days.add(curr);
      curr = curr.add(const Duration(days: 1));
    }
    return days;
  }

  Color _getMoodColor(String label) {
    final lower = label.toLowerCase();
    if (lower.contains('ecstatic') || lower.contains('excited') || lower.contains('joy')) {
      return AppColors.lavenderGlow;
    }
    if (lower.contains('happy') || lower.contains('content')) {
      return AppColors.accentMint;
    }
    if (lower.contains('focused') || lower.contains('productive')) {
      return AppColors.primaryLight;
    }
    if (lower.contains('stressed') || lower.contains('anxious')) {
      return AppColors.accentCoral;
    }
    if (lower.contains('sad') || lower.contains('tired')) {
      return AppColors.periwinkle;
    }
    return AppColors.accentMint;
  }

  @override
  Widget build(BuildContext context) {
    final checkinProvider = context.watch<CheckinProvider>();
    final checkinMap = checkinProvider.calendarCheckinMap;
    final selectedCheckin = checkinProvider.selectedDateCheckin;
    final isLoadingDetails = checkinProvider.isLoadingDateDetails;

    final now = DateTime.now();
    final todayKey = _formatDateKey(now);
    final selectedKey = _formatDateKey(_selectedDate);

    final days = _getDaysInMonth(_currentMonth);
    final int firstWeekday = days.first.weekday; // 1 = Monday ... 7 = Sunday
    // For Sunday-start calendar: Sunday = 0, Monday = 1 ... Saturday = 6
    final int startPadding = firstWeekday % 7;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Check-in Calendar'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.lavenderGlow),
            tooltip: 'View History List',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CheckinHistoryScreen()),
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
          child: RefreshIndicator(
            color: AppColors.primaryLight,
            backgroundColor: AppColors.surfaceDark,
            onRefresh: () async {
              await checkinProvider.fetchCalendarMonth(_currentMonth);
              _fetchDetailsForSelectedDate();
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
              children: [
                // 1. Calendar Container Card
                AppCard(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 26,
                  child: Column(
                    children: [
                      // Month & Navigation Controls Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _formatMonthYear(_currentMonth),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppColors.warmCream,
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.chevron_left_rounded, color: AppColors.lavenderGlow),
                                onPressed: _prevMonth,
                                visualDensity: VisualDensity.compact,
                              ),
                              TextButton(
                                onPressed: _goToday,
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  backgroundColor: AppColors.surfaceLightDark,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: const Text(
                                  'Today',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primaryLight,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.chevron_right_rounded, color: AppColors.lavenderGlow),
                                onPressed: _nextMonth,
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Weekday Labels Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: const [
                          _WeekdayHeader('S'),
                          _WeekdayHeader('M'),
                          _WeekdayHeader('T'),
                          _WeekdayHeader('W'),
                          _WeekdayHeader('T'),
                          _WeekdayHeader('F'),
                          _WeekdayHeader('S'),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Calendar Days Grid
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 7,
                          mainAxisSpacing: 6,
                          crossAxisSpacing: 6,
                          childAspectRatio: 1.0,
                        ),
                        itemCount: startPadding + days.length,
                        itemBuilder: (context, index) {
                          if (index < startPadding) {
                            return const SizedBox.shrink();
                          }

                          final date = days[index - startPadding];
                          final dateKey = _formatDateKey(date);
                          final hasCheckin = checkinMap.containsKey(dateKey);
                          final checkinEntry = checkinMap[dateKey];
                          final isToday = dateKey == todayKey;
                          final isSelected = dateKey == selectedKey;

                          Color indicatorColor = AppColors.primaryLight;
                          if (checkinEntry != null) {
                            indicatorColor = _getMoodColor(checkinEntry.mood.moodLabel);
                          }

                          return InkWell(
                            onTap: () {
                              setState(() => _selectedDate = date);
                              _fetchDetailsForSelectedDate();
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withAlpha(140)
                                    : hasCheckin
                                        ? AppColors.surfaceDark.withAlpha(200)
                                        : Colors.transparent,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.lavenderGlow
                                      : isToday
                                          ? AppColors.primaryLight.withAlpha(140)
                                          : hasCheckin
                                              ? indicatorColor.withAlpha(80)
                                              : Colors.white.withAlpha(10),
                                  width: isSelected ? 2.0 : (isToday ? 1.5 : 1.0),
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: AppColors.primary.withAlpha(100),
                                          blurRadius: 10,
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  // Day number
                                  Text(
                                    '${date.day}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: isSelected || isToday ? FontWeight.w900 : FontWeight.w600,
                                      color: isSelected
                                          ? Colors.white
                                          : isToday
                                              ? AppColors.lavenderGlow
                                              : hasCheckin
                                                  ? AppColors.warmCream
                                                  : AppColors.textMutedDark,
                                    ),
                                  ),

                                  // Glowing dot indicator for saved checkin
                                  if (hasCheckin)
                                    Positioned(
                                      bottom: 4,
                                      child: Container(
                                        width: 5,
                                        height: 5,
                                        decoration: BoxDecoration(
                                          color: isSelected ? Colors.white : indicatorColor,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: indicatorColor.withAlpha(180),
                                              blurRadius: 4,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 12),
                      // Legend
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildLegendItem(AppColors.primaryLight, 'Checked In'),
                          const SizedBox(width: 16),
                          _buildLegendItem(AppColors.lavenderGlow, 'Today'),
                          const SizedBox(width: 16),
                          _buildLegendItem(Colors.transparent, 'No Entry', borderColor: AppColors.borderDark),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 2. Selected Date Check-in Summary Panel
                _buildSelectedDateDetails(
                  context,
                  date: _selectedDate,
                  checkin: selectedCheckin,
                  isLoading: isLoadingDetails,
                  isToday: selectedKey == todayKey,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, {Color? borderColor}) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: borderColor != null ? Border.all(color: borderColor) : null,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
        ),
      ],
    );
  }

  Widget _buildSelectedDateDetails(
    BuildContext context, {
    required DateTime date,
    required CheckinModel? checkin,
    required bool isLoading,
    required bool isToday,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with date & status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDisplayDate(date),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.warmCream,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isToday ? "Today's Record" : "Historical Record",
                      style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
                    ),
                  ],
                ),
              ),
              if (checkin != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: checkin.isCompleted
                        ? AppColors.accentMint.withAlpha(35)
                        : AppColors.accentAmber.withAlpha(35),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: checkin.isCompleted
                          ? AppColors.accentMint.withAlpha(120)
                          : AppColors.accentAmber.withAlpha(120),
                    ),
                  ),
                  child: Text(
                    checkin.isCompleted ? 'Completed' : 'Draft',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: checkin.isCompleted ? AppColors.accentMint : AppColors.accentAmber,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),

          if (isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.primaryLight, strokeWidth: 2),
              ),
            )
          else if (checkin == null)
            _buildEmptyDayState(context, isToday: isToday)
          else ...[
            // Score & Rating Banner
            Row(
              children: [
                if (checkin.lifeScore != null)
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceDark,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.borderDark),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.auto_awesome_rounded, color: AppColors.lavenderGlow, size: 16),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Life Score', style: TextStyle(fontSize: 9, color: AppColors.textMutedDark)),
                              Text(
                                '${checkin.lifeScore}',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.lavenderGlow),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                if (checkin.lifeScore != null && checkin.dailyRating > 0)
                  const SizedBox(width: 8),
                if (checkin.dailyRating > 0)
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceDark,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.borderDark),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 16),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Rating', style: TextStyle(fontSize: 9, color: AppColors.textMutedDark)),
                              Text(
                                '${checkin.dailyRating} / 10',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.accentAmber),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Mood details
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceDark,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderDark),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.asset(
                        AppAssets.getCharacterForMood(checkin.mood.moodLabel),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          checkin.mood.moodLabel.isNotEmpty ? checkin.mood.moodLabel : 'Content',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimaryDark),
                        ),
                        if (checkin.mood.note.isNotEmpty)
                          Text(
                            '"${checkin.mood.note}"',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textSecondaryDark),
                          )
                        else
                          Text(
                            'Mood score: ${checkin.mood.moodScore}/10',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Wellbeing & Activity Mini-Row
            Row(
              children: [
                _buildMiniCell('⚡ Energy', '${checkin.wellbeing.energyLevel}/5'),
                const SizedBox(width: 6),
                _buildMiniCell('🛌 Sleep', '${checkin.activities.sleepHours}h'),
                const SizedBox(width: 6),
                _buildMiniCell('💧 Water', '${checkin.activities.waterIntakeMl}ml'),
                const SizedBox(width: 6),
                _buildMiniCell('💼 Deep Work', '${(checkin.activities.studyHours + checkin.activities.workHours).toStringAsFixed(1)}h'),
              ],
            ),
            const SizedBox(height: 14),

            // View Complete Check-in Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => CheckinDetailSheet.show(context, checkin),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.open_in_full_rounded, size: 16),
                label: const Text('View Full Check-in Details', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyDayState(BuildContext context, {required bool isToday}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark.withAlpha(120),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderDark.withAlpha(120)),
      ),
      child: Column(
        children: [
          Icon(
            isToday ? Icons.history_toggle_off_rounded : Icons.event_busy_rounded,
            size: 36,
            color: AppColors.textMutedDark,
          ),
          const SizedBox(height: 10),
          Text(
            isToday ? 'No check-in recorded yet for today' : 'No check-in recorded for this date',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textSecondaryDark),
          ),
          const SizedBox(height: 4),
          Text(
            isToday
                ? 'Capture your feelings, habits, and activities to earn XP and maintain your streak.'
                : 'Select any highlighted date on the calendar with a glowing dot to inspect saved check-ins.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark, height: 1.4),
          ),
          if (isToday) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentMint,
                foregroundColor: AppColors.backgroundDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
              icon: const Icon(Icons.add_task_rounded, size: 16),
              label: const Text("Log Today's Check-in", style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMiniCell(String label, String value) {
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
            Text(label, style: const TextStyle(fontSize: 9, color: AppColors.textMutedDark)),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.warmCream),
            ),
          ],
        ),
      ),
    );
  }
}

class _WeekdayHeader extends StatelessWidget {
  final String label;
  const _WeekdayHeader(this.label);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.lavenderGlow,
        ),
      ),
    );
  }
}
