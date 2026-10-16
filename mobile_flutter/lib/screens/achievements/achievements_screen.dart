import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/achievement_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/gamification_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/achievement_badge.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = ['All', 'Consistency', 'Milestones', 'Reflection', 'Rhythm'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamificationProvider>().fetchAchievements();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final gamificationProvider = context.watch<GamificationProvider>();
    final user = authProvider.user;

    final currentXp = user?.totalXp ?? 0;
    final level = user?.level ?? 1;
    final levelProgress = (currentXp % 100) / 100.0;

    final rawAchievements = gamificationProvider.achievements.isNotEmpty
        ? gamificationProvider.achievements
        : _getCanonicalFallbackAchievements();

    final unlockedCount = rawAchievements.where((a) => a.isUnlocked).length;
    final totalCount = rawAchievements.length;

    final filteredAchievements = _selectedCategory == 'All'
        ? rawAchievements
        : rawAchievements.where((a) => a.category.toLowerCase() == _selectedCategory.toLowerCase()).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Achievements & Badges'),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: RefreshIndicator(
            color: AppColors.primaryLight,
            backgroundColor: AppColors.surfaceDark,
            onRefresh: () => gamificationProvider.fetchAchievements(),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              children: [
                // 1. Level & Constellation Progress Hero Card
                _buildHeroLevelCard(level, currentXp, levelProgress, unlockedCount, totalCount),
                const SizedBox(height: 18),

                // 2. Featured Next Milestone Card
                if (unlockedCount < totalCount) ...[
                  _buildNextMilestoneCard(rawAchievements),
                  const SizedBox(height: 18),
                ],

                // 3. Category Filter Chips
                _buildCategoryFilters(),
                const SizedBox(height: 16),

                // 4. Collectibles Grid Section Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$_selectedCategory Constellation',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryDark,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceDark,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderDark),
                      ),
                      child: Text(
                        '$unlockedCount of $totalCount Unlocked',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 5. Grid or Loading/Error State
                if (gamificationProvider.isLoading && gamificationProvider.achievements.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: LoadingView(message: 'Gathering your unlocked milestones...'),
                  )
                else ...[
                  if (gamificationProvider.errorMessage != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withAlpha(25),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFEF4444).withAlpha(80)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.cloud_off_rounded, size: 18, color: Color(0xFFEF4444)),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Offline: Showing canonical constellation milestones.',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                            ),
                          ),
                          TextButton(
                            onPressed: () => gamificationProvider.fetchAchievements(),
                            child: const Text('Retry', style: TextStyle(fontSize: 12, color: AppColors.primaryLight)),
                          ),
                        ],
                      ),
                    ),
                  _buildAchievementsGrid(filteredAchievements),
                ],

                const SizedBox(height: 36),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroLevelCard(int level, int currentXp, double levelProgress, int unlockedCount, int totalCount) {
    return AppCard(
      hasGlow: true,
      gradient: const LinearGradient(
        colors: [Color(0xFF281347), Color(0xFF150D27)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primaryLight, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(100),
                      blurRadius: 18,
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Image.asset(AppAssets.celestialMoon, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Level $level Traveler',
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimaryDark,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.verified_rounded, color: AppColors.accentMint, size: 18),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$currentXp Total Experience Points',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // Level progress bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Progress to Next Level',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, fontWeight: FontWeight.w600),
              ),
              Text(
                '${(levelProgress * 100).toInt()}%',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: levelProgress.clamp(0.05, 1.0),
              minHeight: 8,
              backgroundColor: AppColors.surfaceLightDark,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
            ),
          ),
          const SizedBox(height: 16),
          // 3-Stat badges strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.surfaceDark.withAlpha(120),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderDark),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatPill('Badges', '$unlockedCount / $totalCount', '🏆'),
                Container(width: 1, height: 24, color: AppColors.borderDark),
                _buildStatPill('XP Bonus', '+${unlockedCount * 25}', '✨'),
                Container(width: 1, height: 24, color: AppColors.borderDark),
                _buildStatPill('Tier', level >= 5 ? 'Master' : 'Seeker', '🌟'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(String label, String value, String icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(icon, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimaryDark,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildNextMilestoneCard(List<AchievementModel> all) {
    // Find the first locked achievement to feature as next milestone
    final nextAch = all.firstWhere((a) => !a.isUnlocked, orElse: () => all.first);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          AchievementBadge(
            achievement: nextAch,
            size: 54,
            onTap: () => _showAchievementDetailSheet(nextAch),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(40),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'NEXT MILESTONE',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryLight,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      nextAch.rarityTier,
                      style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  nextAch.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  nextAch.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _categories.map((cat) {
          final isSelected = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(
                cat,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? Colors.white : AppColors.textSecondaryDark,
                ),
              ),
              selected: isSelected,
              selectedColor: AppColors.primary,
              backgroundColor: AppColors.surfaceDark,
              side: BorderSide(
                color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
              ),
              onSelected: (val) {
                if (val) {
                  setState(() => _selectedCategory = cat);
                }
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAchievementsGrid(List<AchievementModel> achievements) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: achievements.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.74,
      ),
      itemBuilder: (context, index) {
        final ach = achievements[index];
        return _buildBadgeCard(ach);
      },
    );
  }

  Widget _buildBadgeCard(AchievementModel ach) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      onTap: () {
        HapticFeedback.lightImpact();
        _showAchievementDetailSheet(ach);
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AchievementBadge(
            achievement: ach,
            size: 58,
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              ach.name,
              textAlign: TextAlign.center,
              maxLines: 1,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: ach.isUnlocked ? AppColors.textPrimaryDark : AppColors.textMutedDark,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            ach.rarityTier,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: ach.isUnlocked ? AppColors.primaryLight : const Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: ach.isUnlocked
                  ? AppColors.accentMint.withAlpha(30)
                  : AppColors.surfaceLightDark,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: ach.isUnlocked
                    ? AppColors.accentMint.withAlpha(80)
                    : AppColors.borderDark,
              ),
            ),
            child: Text(
              ach.isUnlocked ? 'EARNED' : 'LOCKED',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: ach.isUnlocked ? AppColors.accentMint : AppColors.textMutedDark,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAchievementDetailSheet(AchievementModel ach) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF140E26),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(
              top: BorderSide(color: AppColors.borderDark, width: 1.5),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle pill
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderDark,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),

              // Large gleaming badge
              AchievementBadge(
                achievement: ach,
                size: 104,
              ),
              const SizedBox(height: 18),

              // Title
              Text(
                ach.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              const SizedBox(height: 6),

              // Rarity & Category pill
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(40),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
                    ),
                    child: Text(
                      ach.rarityTier.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryLight,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceDark,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderDark),
                    ),
                    child: Text(
                      ach.category.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondaryDark,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Description
              Text(
                ach.description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondaryDark,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),

              // Unlock Status Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: ach.isUnlocked
                        ? AppColors.accentMint.withAlpha(80)
                        : AppColors.borderDark,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      ach.isUnlocked
                          ? Icons.celebration_rounded
                          : Icons.lock_clock_rounded,
                      color: ach.isUnlocked ? AppColors.accentMint : AppColors.primaryLight,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ach.isUnlocked ? 'Earned Achievement' : 'Milestone Locked',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: ach.isUnlocked
                                  ? AppColors.accentMint
                                  : AppColors.textPrimaryDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            ach.isUnlocked
                                ? (ach.unlockedAt != null
                                    ? 'Unlocked on ${ach.unlockedAt!.split("T").first}'
                                    : 'Recorded in your journey')
                                : 'Perform daily routines and reflections to unlock.',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondaryDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(40),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '+${ach.xpReward} XP',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Close Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.surfaceLightDark,
                    foregroundColor: AppColors.textPrimaryDark,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppColors.borderDark),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.pop(sheetContext),
                  child: const Text('Close', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  static List<AchievementModel> _getCanonicalFallbackAchievements() {
    return [
      AchievementModel(
        id: 1,
        idStr: 'first_checkin',
        name: 'First Step',
        description: 'Complete your first daily check-in',
        icon: 'Target',
        category: 'Milestones',
        isUnlocked: true,
      ),
      AchievementModel(
        id: 2,
        idStr: 'streak_7',
        name: '7-Day Streak',
        description: 'Maintain a check-in streak for 7 consecutive days',
        icon: 'Flame',
        category: 'Consistency',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 3,
        idStr: 'streak_30',
        name: 'Monthly Master',
        description: 'Maintain a check-in streak for 30 consecutive days',
        icon: 'Award',
        category: 'Consistency',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 4,
        idStr: 'goal_crusher',
        name: 'Goal Crusher',
        description: 'Complete your first goal',
        icon: 'Trophy',
        category: 'Milestones',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 5,
        idStr: 'journal_entry_10',
        name: 'Reflective Soul',
        description: 'Write 10 journal entries',
        icon: 'BookOpen',
        category: 'Reflection',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 6,
        idStr: 'early_bird',
        name: 'Early Bird',
        description: 'Check in before 8 AM',
        icon: 'Sun',
        category: 'Rhythm',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 7,
        idStr: 'night_owl',
        name: 'Night Owl',
        description: 'Check in after 10 PM',
        icon: 'Moon',
        category: 'Rhythm',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 8,
        idStr: 'skill_apprentice',
        name: 'Apprentice',
        description: 'Reach Level 5 in any skill',
        icon: 'TrendingUp',
        category: 'Mastery',
        isUnlocked: false,
      ),
      AchievementModel(
        id: 9,
        idStr: 'perfect_week',
        name: 'Perfect Week',
        description: 'Complete all habits for 7 days straight',
        icon: 'Star',
        category: 'Consistency',
        isUnlocked: false,
      ),
    ];
  }
}
