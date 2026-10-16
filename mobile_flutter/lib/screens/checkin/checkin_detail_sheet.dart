import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/checkin_model.dart';
import '../../widgets/app_card.dart';

class CheckinDetailSheet extends StatelessWidget {
  final CheckinModel checkin;

  const CheckinDetailSheet({super.key, required this.checkin});

  static Future<void> show(BuildContext context, CheckinModel checkin) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CheckinDetailSheet(checkin: checkin),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final parts = dateStr.split('T')[0].split('-');
      if (parts.length == 3) {
        final d = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return '${weekdays[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}, ${d.year}';
      }
    } catch (_) {}
    return dateStr;
  }

  String _formatActivityValue(num? val, String unit) {
    if (val == null || val == 0) return '0 $unit';
    if (val is double && val % 1 != 0) {
      return '${val.toStringAsFixed(1)} $unit';
    }
    return '${val.toInt()} $unit';
  }

  @override
  Widget build(BuildContext context) {
    final acts = checkin.activities;
    final mood = checkin.mood;
    final wb = checkin.wellbeing;
    final journal = checkin.journal;
    final habits = checkin.habitLogs;
    final goals = checkin.goals;
    final lifeScore = checkin.lifeScore;
    final lifeScoreDetails = checkin.lifeScoreDetails;

    final moodAsset = AppAssets.getCharacterForMood(mood.moodLabel);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: AppColors.backgroundDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(
          top: BorderSide(color: AppColors.lavenderGlow, width: 1.5),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.textMutedDark.withAlpha(90),
              borderRadius: BorderRadius.circular(10),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(45),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
                  ),
                  child: const Icon(Icons.event_note_rounded, color: AppColors.primaryLight, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _formatDate(checkin.date),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.warmCream,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
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
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  checkin.isCompleted ? Icons.check_circle_rounded : Icons.edit_note_rounded,
                                  size: 12,
                                  color: checkin.isCompleted ? AppColors.accentMint : AppColors.accentAmber,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  checkin.isCompleted ? 'Completed Check-in' : 'Saved Draft',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: checkin.isCompleted ? AppColors.accentMint : AppColors.accentAmber,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            checkin.date.split('T')[0],
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMutedDark,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: AppColors.textSecondaryDark),
                  tooltip: 'Close',
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.borderDark, height: 1),

          // Scrollable details body
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              children: [
                // 1. Life Score & Daily Rating Banner
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.primary.withAlpha(60),
                              AppColors.surfaceCardDark,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.auto_awesome_rounded, size: 14, color: AppColors.lavenderGlow),
                                SizedBox(width: 6),
                                Text(
                                  'LIFE SCORE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                    color: AppColors.lavenderGlow,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              lifeScore != null ? '$lifeScore' : '—',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: AppColors.warmCream,
                              ),
                            ),
                            if (lifeScoreDetails != null && lifeScoreDetails['breakdown'] is Map) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Act: ${lifeScoreDetails['breakdown']['activities'] ?? 0} • Mood: ${lifeScoreDetails['breakdown']['mood'] ?? 0} • Well: ${lifeScoreDetails['breakdown']['wellbeing'] ?? 0}',
                                style: const TextStyle(
                                  fontSize: 9,
                                  color: AppColors.textMutedDark,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.accentAmber.withAlpha(50),
                              AppColors.surfaceCardDark,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.accentAmber.withAlpha(80)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.star_rounded, size: 14, color: AppColors.accentAmber),
                                SizedBox(width: 6),
                                Text(
                                  'SATISFACTION',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                    color: AppColors.accentAmber,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              checkin.dailyRating > 0 ? '${checkin.dailyRating} / 10' : 'Not rated',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: AppColors.warmCream,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Self-assessed daily score',
                              style: TextStyle(
                                fontSize: 9,
                                color: AppColors.textMutedDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // 2. Mood & Emotional State Card
                AppCard(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 22,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.mood_rounded, color: AppColors.secondary, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Mood & Emotional State',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.warmCream,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: AppColors.primaryLight.withAlpha(100), width: 1.5),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withAlpha(60),
                                  blurRadius: 12,
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Image.asset(moodAsset, fit: BoxFit.cover),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  mood.moodLabel.isNotEmpty ? mood.moodLabel : 'Content',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimaryDark,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    _buildPill('Score: ${mood.moodScore}/10', AppColors.primaryLight),
                                    const SizedBox(width: 6),
                                    _buildPill('Intensity: ${mood.intensity}/5', AppColors.periwinkle),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (mood.note.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceDark,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.borderDark),
                          ),
                          child: Text(
                            '"${mood.note}"',
                            style: const TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: AppColors.textSecondaryDark,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 3. Wellbeing 4-Pillar Grid
                AppCard(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 22,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.spa_rounded, color: AppColors.accentMint, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Wellbeing Pillars',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.warmCream,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildWellbeingItem('⚡ Energy', '${wb.energyLevel}/5', AppColors.accentAmber),
                          const SizedBox(width: 8),
                          _buildWellbeingItem('💓 Stress', '${wb.stressLevel}/5', AppColors.accentCoral),
                          const SizedBox(width: 8),
                          _buildWellbeingItem('🎯 Focus', '${wb.focusLevel}/5', AppColors.primaryLight),
                          const SizedBox(width: 8),
                          _buildWellbeingItem('🔋 Mot.', '${wb.motivationLevel}/5', AppColors.accentMint),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 4. Tracked Daily Activities
                AppCard(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 22,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.directions_run_rounded, color: AppColors.accentCoral, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Recorded Activities',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.warmCream,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildActivityChip('🛌 Sleep', _formatActivityValue(acts.sleepHours, 'hrs')),
                          _buildActivityChip('💧 Hydration', _formatActivityValue(acts.waterIntakeMl, 'ml')),
                          _buildActivityChip('📚 Study', _formatActivityValue(acts.studyHours, 'hrs')),
                          _buildActivityChip('💼 Work', _formatActivityValue(acts.workHours, 'hrs')),
                          _buildActivityChip('🏃 Exercise', _formatActivityValue(acts.exerciseMinutes, 'min')),
                          _buildActivityChip('📖 Reading', _formatActivityValue(acts.readingMinutes, 'min')),
                          _buildActivityChip('🧘 Meditation', _formatActivityValue(acts.meditationMinutes, 'min')),
                          _buildActivityChip('📱 Screen', _formatActivityValue(acts.screenTimeMinutes, 'min')),
                          _buildActivityChip('🚶 Steps', _formatActivityValue(acts.walkingSteps, 'steps')),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 5. Habits Checklist
                if (habits.isNotEmpty) ...[
                  AppCard(
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
                                Icon(Icons.task_alt_rounded, color: AppColors.lavenderGlow, size: 18),
                                SizedBox(width: 8),
                                Text(
                                  'Daily Habits',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.warmCream,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '${habits.where((h) => h.completed).length} / ${habits.length} done',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.accentMint,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...habits.map((h) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceDark,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: h.completed
                                    ? AppColors.accentMint.withAlpha(80)
                                    : AppColors.borderDark,
                              ),
                            ),
                            child: Row(
                              children: [
                                Text(h.icon, style: const TextStyle(fontSize: 16)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    h.name,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: h.completed ? AppColors.textPrimaryDark : AppColors.textMutedDark,
                                    ),
                                  ),
                                ),
                                if (h.streak > 0)
                                  Text(
                                    '🔥 ${h.streak}d',
                                    style: const TextStyle(fontSize: 11, color: AppColors.accentAmber),
                                  ),
                                const SizedBox(width: 8),
                                Icon(
                                  h.completed ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                  size: 18,
                                  color: h.completed ? AppColors.accentMint : AppColors.textMutedDark,
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

                // 6. Active Goals
                if (goals.isNotEmpty) ...[
                  AppCard(
                    padding: const EdgeInsets.all(16),
                    borderRadius: 22,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.track_changes_rounded, color: AppColors.accentMint, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Tracked Goals',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.warmCream,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...goals.map((g) {
                          final title = g['title'] ?? 'Goal';
                          final progress = ((g['progress'] ?? 0) as num).toDouble();
                          final target = ((g['target'] ?? 1) as num).toDouble();
                          final pct = target > 0 ? (progress / target).clamp(0.0, 1.0) : 0.0;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceDark,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.borderDark),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        title,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimaryDark,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '${(pct * 100).toInt()}%',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
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
                    ),
                  ),
                  const SizedBox(height: 18),
                ],

                // 7. Daily Journal & Reflection
                if (journal.title.isNotEmpty || journal.content.isNotEmpty) ...[
                  AppCard(
                    padding: const EdgeInsets.all(16),
                    borderRadius: 22,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_stories_rounded, color: AppColors.primaryLight, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Reflection & Journal',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.warmCream,
                              ),
                            ),
                          ],
                        ),
                        if (journal.title.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            journal.title,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimaryDark,
                            ),
                          ),
                        ],
                        if (journal.content.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            journal.content,
                            style: const TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: AppColors.textSecondaryDark,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  Widget _buildWellbeingItem(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderDark),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.warmCream,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderDark),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.textMutedDark),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.warmCream,
            ),
          ),
        ],
      ),
    );
  }
}
