import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/checkin_provider.dart';
import '../../providers/habit_provider.dart';
import '../../providers/goal_provider.dart';
import '../../providers/journal_provider.dart';
import '../../providers/analytics_provider.dart';
import '../../providers/ai_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/atmospheric_background.dart';
import '../../widgets/mood_badge.dart';
import '../profile/profile_screen.dart';
import '../analytics/analytics_screen.dart';
import '../achievements/achievements_screen.dart';
import '../journal/journal_edit_screen.dart';
import '../documents/documents_screen.dart';
import '../checkin/checkin_history_screen.dart';
import '../checkin/checkin_calendar_screen.dart';
import '../analytics/checkin_insights_screen.dart';
import '../reports/growth_report_screen.dart';

class HomeScreen extends StatefulWidget {
  final ValueChanged<int>? onNavigateTab;

  const HomeScreen({super.key, this.onNavigateTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _floatController;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _floatAnim = Tween<double>(begin: -4, end: 4).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadHomeData();
    });
  }

  @override
  void dispose() {
    _floatController.dispose();
    super.dispose();
  }

  Future<void> _loadHomeData() async {
    if (!mounted) return;
    context.read<CheckinProvider>().fetchTodayCheckin();
    context.read<HabitProvider>().fetchHabits();
    context.read<GoalProvider>().fetchGoals();
    context.read<JournalProvider>().fetchJournals();
    context.read<AnalyticsProvider>().fetchAnalytics();
    context.read<AIProvider>().fetchAIOverview();
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final checkinProvider = context.watch<CheckinProvider>();
    final habitProvider = context.watch<HabitProvider>();
    final goalProvider = context.watch<GoalProvider>();
    final journalProvider = context.watch<JournalProvider>();
    final analyticsProvider = context.watch<AnalyticsProvider>();
    final aiProvider = context.watch<AIProvider>();

    final user = authProvider.user;
    final String firstName = user?.fullName.split(' ').first ?? 'Traveler';
    final bool isCheckedIn = checkinProvider.isCompletedToday;
    final todayCheckin = checkinProvider.todayCheckin;

    // Determine companion character dynamically based on mood or status
    final String companionAsset = isCheckedIn && todayCheckin != null
        ? AppAssets.getCharacterForMood(todayCheckin.mood.moodLabel)
        : ((user?.currentStreak ?? 0) >= 3 ? AppAssets.moodExcited : AppAssets.moodBear);

    final String companionSpeech = isCheckedIn && todayCheckin != null
        ? 'Feeling ${todayCheckin.mood.moodLabel.toLowerCase()} today. Cherish every step!'
        : 'Take a gentle breath, $firstName. How is your heart today?';

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          bottom: false,
          child: RefreshIndicator(
            color: AppColors.primaryLight,
            backgroundColor: AppColors.surfaceDark,
            onRefresh: _loadHomeData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Top Header: User Greeting & Level Avatar
                  _buildHeader(firstName, user),
                  const SizedBox(height: 18),

                  // 2. Rewarding Streak & Energy Crystals Strip
                  _buildGamificationStrip(user, analyticsProvider),
                  const SizedBox(height: 20),

                  // 3. Atmospheric Hero Centerpiece with Dynamic Plush Companion
                  _buildHeroCenterpiece(
                    companionAsset,
                    companionSpeech,
                    isCheckedIn,
                    todayCheckin,
                  ),
                  const SizedBox(height: 20),

                  // 4. Weekly Growth Timeline (7-Day Strip)
                  _buildWeeklyGrowthStrip(isCheckedIn),
                  const SizedBox(height: 20),

                  // 4b. Check-in History, Calendar & Analytics Hub
                  _buildCheckinDiscoverySection(),
                  const SizedBox(height: 20),

                  // 5. Quick Daily Rhythm Action Grid
                  _buildQuickActionGrid(),
                  const SizedBox(height: 22),

                  // 6. Contextual AI Companion Preview
                  _buildAICompanionArea(aiProvider),
                  const SizedBox(height: 22),

                  // 7. Today's Habits Section
                  _buildHabitsSection(habitProvider),
                  const SizedBox(height: 22),

                  // 8. Active Goals Progress
                  _buildGoalsSection(goalProvider),
                  const SizedBox(height: 22),

                  // 9. Recent Reflections Timeline
                  _buildRecentJournalTimeline(journalProvider),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─── 1. TOP HEADER ────────────────────────────────────────────────────────
  Widget _buildHeader(String firstName, dynamic user) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        '${_getTimeGreeting()}, $firstName',
                        style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimaryDark,
                          letterSpacing: -0.4,
                        ),
                        maxLines: 1,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text('✨', style: TextStyle(fontSize: 17)),
                ],
              ),
              const SizedBox(height: 3),
              const Text(
                'Your digital sanctuary of growth',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondaryDark,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Header Actions: Settings & Avatar
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.settings_outlined, color: AppColors.primaryLight, size: 22),
              tooltip: 'Settings & Profile',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              },
            ),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [AppColors.primaryLight, AppColors.secondary],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(100),
                      blurRadius: 14,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.surfaceDark,
                  child: Text(
                    firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      color: AppColors.warmCream,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─── 2. GAMIFICATION CRYSTAL STRIP ─────────────────────────────────────────
  Widget _buildGamificationStrip(dynamic user, AnalyticsProvider analyticsProvider) {
    final streak = user?.currentStreak ?? 0;
    final totalXp = user?.totalXp ?? 0;
    final level = user?.level ?? 1;
    final lifeScore = analyticsProvider.overview?.averageLifeScore ?? 87;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          // Streak Flame Crystal
          _buildCrystalItem(
            iconEmoji: '🔥',
            label: 'STREAK',
            value: '$streak Days',
            accentColor: const Color(0xFFFB923C),
            gradient: const LinearGradient(
              colors: [Color(0xFF7C2D12), Color(0xFF431407)],
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AchievementsScreen()),
              );
            },
          ),
          const SizedBox(width: 10),

          // Total XP Energy
          _buildCrystalItem(
            iconEmoji: '⚡',
            label: 'EXP',
            value: '$totalXp XP',
            accentColor: AppColors.primaryLight,
            gradient: const LinearGradient(
              colors: [Color(0xFF4C1D95), Color(0xFF2E1065)],
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AchievementsScreen()),
              );
            },
          ),
          const SizedBox(width: 10),

          // Level Crystal
          _buildCrystalItem(
            iconEmoji: '⭐',
            label: 'LEVEL',
            value: 'Lvl $level',
            accentColor: AppColors.secondary,
            gradient: const LinearGradient(
              colors: [Color(0xFF831843), Color(0xFF500724)],
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AchievementsScreen()),
              );
            },
          ),
          const SizedBox(width: 10),

          // Life Score Orb
          _buildCrystalItem(
            iconEmoji: '🌱',
            label: 'LIFE SCORE',
            value: '$lifeScore%',
            accentColor: AppColors.accentMint,
            gradient: const LinearGradient(
              colors: [Color(0xFF064E3B), Color(0xFF022C22)],
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCrystalItem({
    required String iconEmoji,
    required String label,
    required String value,
    required Color accentColor,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: accentColor.withAlpha(140), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: accentColor.withAlpha(50),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(iconEmoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: accentColor.withAlpha(230),
                      letterSpacing: 0.6,
                    ),
                  ),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.warmCream,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── 3. ATMOSPHERIC HERO CENTERPIECE ──────────────────────────────────────
  Widget _buildHeroCenterpiece(
    String companionAsset,
    String companionSpeech,
    bool isCheckedIn,
    dynamic todayCheckin,
  ) {
    return AppCard(
      isGlass: true,
      hasGlow: true,
      padding: const EdgeInsets.all(20),
      borderRadius: 28,
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Floating Plush Character with Glowing Aura
              AnimatedBuilder(
                animation: _floatAnim,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _floatAnim.value),
                    child: child,
                  );
                },
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Aura Glow behind plush
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            (isCheckedIn ? AppColors.accentMint : AppColors.primaryLight)
                                .withAlpha(115),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                    // Character image
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(26),
                        border: Border.all(
                          color: (isCheckedIn ? AppColors.accentMint : AppColors.lavenderGlow)
                              .withAlpha(200),
                          width: 2.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(100),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset(
                          companionAsset,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),

              // Speech Bubble & Status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badge status
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: (isCheckedIn ? AppColors.accentMint : AppColors.primary)
                                .withAlpha(64),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: (isCheckedIn ? AppColors.accentMint : AppColors.primaryLight)
                                  .withAlpha(150),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            isCheckedIn ? 'CHECKED IN ✨' : 'TODAY\'S HARBOR',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isCheckedIn ? AppColors.accentMint : AppColors.lavenderGlow,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        if (isCheckedIn && todayCheckin != null) ...[
                          const Spacer(),
                          MoodBadge(moodScore: todayCheckin.mood.moodScore),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Speech bubble box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLightDark.withAlpha(150),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.glassBorder.withAlpha(40),
                        ),
                      ),
                      child: Text(
                        companionSpeech,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.warmCream,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Primary Check-in CTA Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: isCheckedIn
                    ? AppColors.surfaceLightDark
                    : AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: isCheckedIn
                      ? BorderSide(color: AppColors.accentMint.withAlpha(128))
                      : BorderSide.none,
                ),
                elevation: isCheckedIn ? 0 : 6,
                shadowColor: AppColors.primary.withAlpha(100),
              ),
              onPressed: () {
                widget.onNavigateTab?.call(1); // Check-in tab
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isCheckedIn ? Icons.edit_note_rounded : Icons.auto_awesome_rounded,
                    size: 18,
                    color: isCheckedIn ? AppColors.accentMint : AppColors.warmCream,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isCheckedIn ? 'Update Today\'s Reflection' : 'Check in with Your Heart ✨',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isCheckedIn ? AppColors.accentMint : Colors.white,
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

  // ─── 4. WEEKLY GROWTH TIMELINE (7-DAY STRIP) ───────────────────────────────
  Widget _buildWeeklyGrowthStrip(bool isTodayCheckedIn) {
    final now = DateTime.now();
    // Find Monday of current week
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CheckinCalendarScreen()),
          );
        },
        borderRadius: BorderRadius.circular(22),
        child: AppCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          borderRadius: 22,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Text(
                        'Weekly Growth Rhythm',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimaryDark,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.chevron_right_rounded, size: 16, color: AppColors.periwinkle),
                    ],
                  ),
                  Text(
                    'Calendar ->',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.lavenderGlow,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(7, (index) {
                  final dayDate = monday.add(Duration(days: index));
                  final isToday = dayDate.day == now.day && dayDate.month == now.month;
                  final isPast = dayDate.isBefore(DateTime(now.year, now.month, now.day));
                  final isChecked = (isToday && isTodayCheckedIn) || (isPast && index < now.weekday - 1);

                  return Column(
                    children: [
                      Text(
                        weekdays[index],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isToday ? AppColors.lavenderGlow : AppColors.textMutedDark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isChecked
                              ? AppColors.primary
                              : isToday
                                  ? AppColors.surfaceLightDark
                                  : AppColors.surfaceDark,
                          border: Border.all(
                            color: isToday
                                ? AppColors.primaryLight
                                : isChecked
                                    ? AppColors.periwinkle
                                    : AppColors.borderDark,
                            width: isToday ? 2.0 : 1.0,
                          ),
                          boxShadow: isChecked
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withAlpha(90),
                                    blurRadius: 8,
                                  ),
                                ]
                              : null,
                        ),
                        child: Center(
                          child: isChecked
                              ? const Icon(Icons.check_rounded, size: 18, color: Colors.white)
                              : Text(
                                  '${dayDate.day}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isToday ? FontWeight.w800 : FontWeight.w600,
                                    color: isToday ? AppColors.warmCream : AppColors.textMutedDark,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── 4b. CHECK-IN JOURNEY & INSIGHTS HUB ──────────────────────────────────
  Widget _buildCheckinDiscoverySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Check-in Journey & Insights',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
              ),
            ),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CheckinHistoryScreen()),
                );
              },
              child: const Text(
                'View All ->',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.lavenderGlow,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildDiscoveryCard(
                title: 'Check-in History',
                subtitle: 'Timeline & Logs',
                icon: Icons.history_rounded,
                color: AppColors.lavenderGlow,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CheckinHistoryScreen()),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildDiscoveryCard(
                title: 'Interactive Calendar',
                subtitle: 'Dates & Moods',
                icon: Icons.calendar_month_rounded,
                color: AppColors.primaryLight,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CheckinCalendarScreen()),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildDiscoveryCard(
                title: 'Personal Insights',
                subtitle: 'Emotional Trends',
                icon: Icons.insights_rounded,
                color: AppColors.accentMint,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CheckinInsightsScreen()),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildDiscoveryCard(
                title: 'Growth Reports',
                subtitle: 'Period Analytics',
                icon: Icons.assessment_rounded,
                color: AppColors.accentAmber,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const GrowthReportScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDiscoveryCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceCardDark,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withAlpha(70)),
          boxShadow: [
            BoxShadow(
              color: color.withAlpha(25),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(35),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      maxLines: 1,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryDark,
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      subtitle,
                      maxLines: 1,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textMutedDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── 5. QUICK ACTIONS GRID ────────────────────────────────────────────────
  Widget _buildQuickActionGrid() {
    final actions = [
      {
        'title': 'Journal',
        'subtitle': 'Reflect',
        'icon': Icons.auto_stories_rounded,
        'color': AppColors.secondary,
        'tab': 2,
      },
      {
        'title': 'Memories',
        'subtitle': 'PDF / Docs',
        'icon': Icons.folder_special_rounded,
        'color': AppColors.primaryLight,
        'route': 'documents',
      },
      {
        'title': 'Analytics',
        'subtitle': 'Growth',
        'icon': Icons.insights_rounded,
        'color': AppColors.accent,
        'route': 'analytics',
      },
      {
        'title': 'Habits',
        'subtitle': 'Build',
        'icon': Icons.task_alt_rounded,
        'color': AppColors.accentMint,
        'tab': 3,
      },
      {
        'title': 'AI Replay',
        'subtitle': 'Narrative',
        'icon': Icons.auto_awesome_rounded,
        'color': AppColors.lavenderGlow,
        'tab': 4,
      },
    ];

    return Row(
      children: actions.map((act) {
        final color = act['color'] as Color;
        return Expanded(
          child: GestureDetector(
            onTap: () {
              if (act['route'] == 'analytics') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
                );
              } else if (act['route'] == 'documents') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DocumentsScreen()),
                );
              } else {
                widget.onNavigateTab?.call(act['tab'] as int);
              }
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
              decoration: BoxDecoration(
                color: AppColors.surfaceCardDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderDark, width: 1.1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(64),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: color.withAlpha(50),
                      shape: BoxShape.circle,
                      border: Border.all(color: color.withAlpha(100), width: 1.2),
                    ),
                    child: Icon(act['icon'] as IconData, color: color, size: 20),
                  ),
                  const SizedBox(height: 8),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      act['title'] as String,
                      maxLines: 1,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimaryDark,
                      ),
                    ),
                  ),
                  const SizedBox(height: 1),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      act['subtitle'] as String,
                      maxLines: 1,
                      style: const TextStyle(
                        fontSize: 9.5,
                        color: AppColors.textMutedDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ─── 6. CONTEXTUAL AI COMPANION AREA ──────────────────────────────────────
  Widget _buildAICompanionArea(AIProvider aiProvider) {
    final overview = aiProvider.overview;
    final firstRec = overview != null && overview.recommendations.isNotEmpty
        ? overview.recommendations.first
        : null;
    final String topRec = firstRec != null
        ? (firstRec.title.isNotEmpty ? firstRec.title : firstRec.action)
        : 'Embrace steady progress today. Small mindful rituals lead to monumental growth.';

    return AppCard(
      isGlass: true,
      hasGlow: true,
      onTap: () => widget.onNavigateTab?.call(4), // AI Replay tab
      padding: const EdgeInsets.all(18),
      borderRadius: 24,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primaryLight, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withAlpha(100),
                  blurRadius: 14,
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(AppAssets.aiHelper, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.auto_awesome_rounded, color: AppColors.primaryLight, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'AI COMPANION INSIGHT',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.periwinkle,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  topRec,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.warmCream,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            color: AppColors.textMutedDark,
            size: 14,
          ),
        ],
      ),
    );
  }

  // ─── 7. HABITS SECTION ────────────────────────────────────────────────────
  Widget _buildHabitsSection(HabitProvider provider) {
    final habits = provider.habits.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Today's Habits",
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => widget.onNavigateTab?.call(3), // Growth tab
              child: const Text(
                'View All',
                style: TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        if (habits.isEmpty)
          AppCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text('🌱', style: TextStyle(fontSize: 22)),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'No habits active yet. Tap to start a mindful habit.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
                  ),
                ),
                TextButton(
                  onPressed: () => widget.onNavigateTab?.call(3),
                  child: const Text('Add Habit'),
                ),
              ],
            ),
          )
        else
          ...habits.map((habit) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AppCard(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                borderRadius: 20,
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: AppColors.surfaceLightDark,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(habit.icon, style: const TextStyle(fontSize: 18)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            habit.name,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: habit.completedToday
                                  ? AppColors.textMutedDark
                                  : AppColors.textPrimaryDark,
                              decoration: habit.completedToday
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                          ),
                          Text(
                            '${habit.currentStreak} day streak 🔥',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondaryDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        habit.completedToday
                            ? Icons.check_circle_rounded
                            : Icons.radio_button_unchecked_rounded,
                        color: habit.completedToday
                            ? AppColors.accentMint
                            : AppColors.textMutedDark,
                        size: 26,
                      ),
                      onPressed: () {
                        provider.toggleHabitCompletion(habit.id);
                      },
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  // ─── 8. ACTIVE GOALS SECTION ──────────────────────────────────────────────
  Widget _buildGoalsSection(GoalProvider provider) {
    final goals = provider.goals.take(2).toList();
    if (goals.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Aspirations & Goals',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => widget.onNavigateTab?.call(3),
              child: const Text(
                'Explore',
                style: TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...goals.map((goal) {
          final progressPercent = (goal.progress / (goal.target > 0 ? goal.target : 1.0)).clamp(0.0, 1.0);
          final pctInt = (progressPercent * 100).toInt();

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AppCard(
              padding: const EdgeInsets.all(16),
              borderRadius: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          goal.title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimaryDark,
                          ),
                        ),
                      ),
                      Text(
                        '$pctInt%',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: progressPercent,
                      minHeight: 6,
                      backgroundColor: AppColors.surfaceLightDark,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.secondary),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${goal.progress.toStringAsFixed(0)} of ${goal.target.toStringAsFixed(0)} reached',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondaryDark,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // ─── 9. RECENT JOURNAL TIMELINE ───────────────────────────────────────────
  Widget _buildRecentJournalTimeline(JournalProvider provider) {
    final recent = provider.journals.take(2).toList();
    if (recent.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Reflections',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () => widget.onNavigateTab?.call(2), // Journal tab
              child: const Text(
                'Open Journal',
                style: TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...recent.map((entry) {
          final dateStr = entry.date.isNotEmpty ? entry.date : 'Today';

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AppCard(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => JournalEditScreen(journal: entry)),
                );
              },
              padding: const EdgeInsets.all(16),
              borderRadius: 20,
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(50),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primaryLight.withAlpha(100)),
                    ),
                    child: Center(
                      child: Text(
                        (entry.moodLabel?.contains('Happy') ?? false) ? '😊' : '✨',
                        style: const TextStyle(fontSize: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimaryDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          entry.content,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondaryDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    dateStr,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMutedDark,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
