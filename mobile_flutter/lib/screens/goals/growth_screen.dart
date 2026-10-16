import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/goal_model.dart';
import '../../models/habit_model.dart';
import '../../providers/goal_provider.dart';
import '../../providers/habit_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/atmospheric_background.dart';

class GrowthScreen extends StatefulWidget {
  const GrowthScreen({super.key});

  @override
  State<GrowthScreen> createState() => _GrowthScreenState();
}

class _GrowthScreenState extends State<GrowthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GoalProvider>().fetchGoals();
      context.read<GoalProvider>().fetchPredictions();
      context.read<HabitProvider>().fetchHabits();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Goals & Habits'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryLight,
          indicatorWeight: 3,
          labelColor: AppColors.primaryLight,
          unselectedLabelColor: AppColors.textMutedDark,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          tabs: const [
            Tab(text: '🎯 Goals'),
            Tab(text: '✨ Habits'),
          ],
        ),
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildGoalsTab(),
              _buildHabitsTab(),
            ],
          ),
        ),
      ),
    );
  }

  // ─── GOALS TAB ─────────────────────────────────────────────────────────────
  Widget _buildGoalsTab() {
    final goalProvider = context.watch<GoalProvider>();
    final goals = goalProvider.goals;

    if (goalProvider.isLoading) {
      return const LoadingView(message: 'Loading your aspirations...');
    }

    return RefreshIndicator(
      color: AppColors.primaryLight,
      backgroundColor: AppColors.surfaceDark,
      onRefresh: () => goalProvider.fetchGoals(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        children: [
          // Add Goal Action Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Active Goals (${goals.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Goal', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                onPressed: () => _showAddGoalDialog(),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (goals.isEmpty)
            EmptyStateView(
              imagePath: AppAssets.moodFocused,
              title: 'No Goals Set Yet',
              description: 'Setting clear intentions is the first step toward lasting personal growth.',
              actionText: 'Create Your First Goal',
              onAction: () => _showAddGoalDialog(),
            )
          else
            ...goals.map((goal) => _buildGoalCard(goal, goalProvider)),
        ],
      ),
    );
  }

  Widget _buildGoalCard(GoalModel goal, GoalProvider provider) {
    final pct = (goal.percentage * 100).toInt();

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (goal.category != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(40),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.primaryLight.withAlpha(60)),
                    ),
                    child: Text(
                      goal.category!.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryLight,
                      ),
                    ),
                  ),
                const Spacer(),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert_rounded, color: AppColors.textMutedDark, size: 20),
                  color: AppColors.surfaceLightDark,
                  onSelected: (val) {
                    if (val == 'delete') {
                      provider.deleteGoal(goal.id);
                    }
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete Goal', style: TextStyle(color: Color(0xFFEF4444), fontSize: 13)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              goal.title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
              ),
            ),
            const SizedBox(height: 12),
            // Progress Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$pct% Complete',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: goal.isCompleted ? AppColors.accentMint : AppColors.primaryLight,
                  ),
                ),
                Text(
                  '${goal.progress.toInt()} / ${goal.target.toInt()}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: goal.percentage,
                minHeight: 8,
                backgroundColor: AppColors.surfaceLightDark,
                valueColor: AlwaysStoppedAnimation<Color>(
                  goal.isCompleted ? AppColors.accentMint : AppColors.primaryLight,
                ),
              ),
            ),
            const SizedBox(height: 14),
            // Quick Update Controls
            Wrap(
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 4,
              children: [
                if (!goal.isCompleted) ...[
                  TextButton.icon(
                    style: TextButton.styleFrom(foregroundColor: AppColors.primaryLight),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('+10 Progress', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () {
                      final next = (goal.progress + 10).clamp(0.0, goal.target);
                      provider.updateGoalProgress(goal.id, next);
                    },
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentMint.withAlpha(40),
                      foregroundColor: AppColors.accentMint,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      provider.updateGoalProgress(goal.id, goal.target);
                    },
                    child: const Text('Mark Done', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                ] else
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.check_circle_rounded, color: AppColors.accentMint, size: 18),
                      SizedBox(width: 6),
                      Text('Achieved 🎉', style: TextStyle(color: AppColors.accentMint, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAddGoalDialog() {
    final titleController = TextEditingController();
    final targetController = TextEditingController(text: '100');
    String selectedCategory = 'Personal';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Create New Goal',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: titleController,
                label: 'Goal Title',
                hint: 'e.g. Read 12 books, Meditate 30 days',
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: targetController,
                label: 'Target Value',
                hint: '100',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              const Text(
                'Category',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondaryDark),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: selectedCategory,
                dropdownColor: AppColors.surfaceLightDark,
                decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                items: ['Personal', 'Career', 'Health', 'Learning', 'Mindfulness']
                    .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) selectedCategory = val;
                },
              ),
              const SizedBox(height: 24),
              AppButton(
                text: 'Create Goal ✨',
                onPressed: () {
                  final title = titleController.text.trim();
                  final target = double.tryParse(targetController.text) ?? 100.0;
                  if (title.isNotEmpty) {
                    context.read<GoalProvider>().createGoal(
                          title: title,
                          target: target,
                          category: selectedCategory,
                        );
                    Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ─── HABITS TAB ────────────────────────────────────────────────────────────
  Widget _buildHabitsTab() {
    final habitProvider = context.watch<HabitProvider>();
    final habits = habitProvider.habits;

    if (habitProvider.isLoading) {
      return const LoadingView(message: 'Loading your daily rituals...');
    }

    return RefreshIndicator(
      color: AppColors.primaryLight,
      backgroundColor: AppColors.surfaceDark,
      onRefresh: () => habitProvider.fetchHabits(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Daily Habits (${habits.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Habit', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                onPressed: () => _showAddHabitDialog(),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (habits.isEmpty)
            EmptyStateView(
              imagePath: AppAssets.sleepBetter,
              title: 'No Habits Created',
              description: 'Tiny daily habits lead to extraordinary long-term transformation.',
              actionText: 'Build a Habit',
              onAction: () => _showAddHabitDialog(),
            )
          else
            ...habits.map((habit) => _buildHabitCard(habit, habitProvider)),
        ],
      ),
    );
  }

  Widget _buildHabitCard(HabitModel habit, HabitProvider provider) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.surfaceLightDark,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text(habit.icon, style: const TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    habit.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: habit.completedToday ? AppColors.textMutedDark : AppColors.textPrimaryDark,
                      decoration: habit.completedToday ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        '🔥 ${habit.currentStreak} day streak',
                        style: const TextStyle(fontSize: 12, color: Color(0xFFF97316), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Best: ${habit.longestStreak}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: Icon(
                habit.completedToday ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                color: habit.completedToday ? AppColors.accentMint : AppColors.textMutedDark,
                size: 28,
              ),
              onPressed: () {
                provider.toggleHabitCompletion(habit.id);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddHabitDialog() {
    final nameController = TextEditingController();
    String selectedIcon = '✨';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'New Daily Habit',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimaryDark),
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: nameController,
                label: 'Habit Name',
                hint: 'e.g. 10 Min Meditation, Evening Walk',
              ),
              const SizedBox(height: 14),
              const Text(
                'Choose Icon',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondaryDark),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                children: ['✨', '📚', '🏃', '💧', '🧘', '🌿', '🌙', '🎯', '🍎']
                    .map((icon) {
                  return GestureDetector(
                    onTap: () {
                      selectedIcon = icon;
                    },
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLightDark,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(icon, style: const TextStyle(fontSize: 22)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              AppButton(
                text: 'Save Habit',
                onPressed: () {
                  final name = nameController.text.trim();
                  if (name.isNotEmpty) {
                    context.read<HabitProvider>().createHabit(
                          name: name,
                          icon: selectedIcon,
                        );
                    Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
