import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../models/checkin_model.dart';
import '../../providers/checkin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/journal_provider.dart';
import '../../providers/analytics_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/atmospheric_background.dart';
import 'checkin_history_screen.dart';
import 'checkin_calendar_screen.dart';
import '../analytics/checkin_insights_screen.dart';

class DailyCheckinScreen extends StatefulWidget {
  const DailyCheckinScreen({super.key});

  @override
  State<DailyCheckinScreen> createState() => _DailyCheckinScreenState();
}

class _DailyCheckinScreenState extends State<DailyCheckinScreen> {
  int _currentStep = 0;

  // Mood data
  int _moodScore = 8;
  int _moodIntensity = 4;
  String _moodLabel = 'Happy';
  String _moodImagePath = AppAssets.moodHappy;
  final TextEditingController _moodNoteController = TextEditingController();

  // Wellbeing
  int _energyLevel = 4;
  int _stressLevel = 2;
  int _focusLevel = 4;
  int _motivationLevel = 4;

  // Activities
  double _sleepHours = 7.5;
  int _waterIntakeMl = 2000;
  double _studyHours = 3.0;
  double _workHours = 4.0;
  int _exerciseMinutes = 30;
  int _readingMinutes = 20;
  int _meditationMinutes = 10;
  int _screenTimeMinutes = 180;
  int _walkingSteps = 6000;

  // Journal & Rating
  final TextEditingController _journalTitleController = TextEditingController(text: "Today's Reflection");
  final TextEditingController _journalContentController = TextEditingController();
  int _dailyRating = 8;

  bool _submittedSuccess = false;

  final List<Map<String, dynamic>> _moodOptions = [
    {'label': 'Ecstatic', 'score': 10, 'image': AppAssets.moodExcited, 'emoji': '🤩'},
    {'label': 'Happy', 'score': 8, 'image': AppAssets.moodHappy, 'emoji': '😊'},
    {'label': 'Content', 'score': 7, 'image': AppAssets.moodContent, 'emoji': '😌'},
    {'label': 'Relaxed', 'score': 7, 'image': AppAssets.moodRelaxed, 'emoji': '🧘'},
    {'label': 'Focused', 'score': 8, 'image': AppAssets.moodFocused, 'emoji': '🎯'},
    {'label': 'Stressed', 'score': 4, 'image': AppAssets.moodStressed, 'emoji': '😣'},
    {'label': 'Sad', 'score': 3, 'image': AppAssets.moodSad, 'emoji': '😔'},
    {'label': 'Tired', 'score': 4, 'image': AppAssets.sleepBetter, 'emoji': '🥱'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<CheckinProvider>().fetchTodayCheckin();
      if (mounted) {
        _loadExistingCheckin();
      }
    });
  }

  void _loadExistingCheckin() {
    final existing = context.read<CheckinProvider>().todayCheckin;
    if (existing != null) {
      setState(() {
        _moodScore = existing.mood.moodScore.clamp(1, 10);
        _moodIntensity = existing.mood.intensity.clamp(1, 5);
        _moodLabel = existing.mood.moodLabel.isNotEmpty ? existing.mood.moodLabel : 'Happy';
        _moodNoteController.text = existing.mood.note;
        _moodImagePath = AppAssets.getCharacterForMood(_moodLabel);

        _energyLevel = existing.wellbeing.energyLevel.clamp(1, 5);
        _stressLevel = existing.wellbeing.stressLevel.clamp(1, 5);
        _focusLevel = existing.wellbeing.focusLevel.clamp(1, 5);
        _motivationLevel = existing.wellbeing.motivationLevel.clamp(1, 5);

        _sleepHours = existing.activities.sleepHours.clamp(0.0, 24.0);
        _waterIntakeMl = existing.activities.waterIntakeMl < 0 ? 0 : existing.activities.waterIntakeMl;
        _studyHours = existing.activities.studyHours.clamp(0.0, 24.0);
        _workHours = existing.activities.workHours.clamp(0.0, 24.0);
        _exerciseMinutes = existing.activities.exerciseMinutes.clamp(0, 1440);
        _readingMinutes = existing.activities.readingMinutes.clamp(0, 1440);
        _meditationMinutes = existing.activities.meditationMinutes.clamp(0, 1440);
        _screenTimeMinutes = existing.activities.screenTimeMinutes.clamp(0, 1440);
        _walkingSteps = existing.activities.walkingSteps < 0 ? 0 : existing.activities.walkingSteps;

        _journalTitleController.text = existing.journal.title.isNotEmpty ? existing.journal.title : "Today's Reflection";
        _journalContentController.text = existing.journal.content;
        _dailyRating = existing.dailyRating.clamp(1, 10);
      });
    }
  }

  @override
  void dispose() {
    _moodNoteController.dispose();
    _journalTitleController.dispose();
    _journalContentController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final checkinProvider = context.read<CheckinProvider>();
    if (checkinProvider.isSaving) return;

    if (_moodScore < 1 || _moodScore > 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a valid mood score (1-10)'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final checkin = CheckinModel(
      date: DateTime.now().toIso8601String().split('T')[0],
      dailyRating: _dailyRating.clamp(1, 10),
      isCompleted: true,
      mood: MoodData(
        moodScore: _moodScore.clamp(1, 10),
        intensity: _moodIntensity.clamp(1, 5),
        moodLabel: _moodLabel.isNotEmpty ? _moodLabel : 'Content',
        note: _moodNoteController.text.trim(),
      ),
      wellbeing: WellbeingData(
        energyLevel: _energyLevel.clamp(1, 5),
        stressLevel: _stressLevel.clamp(1, 5),
        focusLevel: _focusLevel.clamp(1, 5),
        motivationLevel: _motivationLevel.clamp(1, 5),
      ),
      activities: ActivitiesData(
        sleepHours: _sleepHours.clamp(0.0, 24.0),
        waterIntakeMl: _waterIntakeMl < 0 ? 0 : _waterIntakeMl,
        studyHours: _studyHours.clamp(0.0, 24.0),
        workHours: _workHours.clamp(0.0, 24.0),
        exerciseMinutes: _exerciseMinutes.clamp(0, 1440),
        readingMinutes: _readingMinutes.clamp(0, 1440),
        meditationMinutes: _meditationMinutes.clamp(0, 1440),
        screenTimeMinutes: _screenTimeMinutes.clamp(0, 1440),
        walkingSteps: _walkingSteps < 0 ? 0 : _walkingSteps,
      ),
      journal: CheckinJournalData(
        title: _journalTitleController.text.trim().isNotEmpty
            ? _journalTitleController.text.trim()
            : "Today's Reflection",
        content: _journalContentController.text.trim(),
      ),
    );

    final success = await checkinProvider.submitCheckin(checkin);

    if (!mounted) return;

    if (success) {
      setState(() => _submittedSuccess = true);
      // Refresh user profile, journals, history, and analytics
      context.read<AuthProvider>().refreshProfile();
      context.read<JournalProvider>().fetchJournals();
      context.read<AnalyticsProvider>().fetchAnalytics();
      context.read<CheckinProvider>().fetchHistory(refresh: true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Daily Check-in saved successfully! ✨'),
          backgroundColor: AppColors.accentMint,
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      final errorMsg = checkinProvider.errorMessage ?? 'Failed to submit check-in. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(errorMsg)),
            ],
          ),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: _handleSubmit,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSaving = context.watch<CheckinProvider>().isSaving;

    if (_submittedSuccess) {
      return _buildSuccessCelebration();
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Daily Check-in'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.lavenderGlow),
            tooltip: 'Check-in History',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CheckinHistoryScreen()),
              );
            },
          ),
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
          IconButton(
            icon: const Icon(Icons.insights_rounded, color: AppColors.accentMint),
            tooltip: 'Personal Insights',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CheckinInsightsScreen()),
              );
            },
          ),
          if (_currentStep > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton.icon(
                icon: isSaving
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                      )
                    : const Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryLight, size: 18),
                label: const Text('Save', style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold)),
                onPressed: isSaving ? null : _handleSubmit,
              ),
            ),
        ],
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: Column(
            children: [
              // Step Progress Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Row(
                children: List.generate(4, (index) {
                  final isDone = _currentStep > index;
                  final isCurrent = _currentStep == index;
                  return Expanded(
                    child: Container(
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: isDone || isCurrent
                            ? AppColors.primaryLight
                            : AppColors.surfaceLightDark,
                        borderRadius: BorderRadius.circular(3),
                        boxShadow: isCurrent
                            ? [
                                BoxShadow(
                                  color: AppColors.primaryLight.withAlpha(120),
                                  blurRadius: 6,
                                ),
                              ]
                            : null,
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 8),

            // Step Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: _buildCurrentStepContent(),
              ),
            ),

            // Step Bottom Navigation Buttons
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: const BoxDecoration(
                  color: AppColors.surfaceDark,
                  border: Border(top: BorderSide(color: AppColors.borderDark)),
                ),
                child: Row(
                  children: [
                    if (_currentStep > 0) ...[
                      Expanded(
                        flex: 1,
                        child: AppButton(
                          text: 'Back',
                          variant: ButtonVariant.ghost,
                          height: 48,
                          onPressed: () => setState(() => _currentStep--),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      flex: 2,
                      child: AppButton(
                        text: _currentStep == 3 ? 'Save Check-in ✨' : 'Continue',
                        isLoading: isSaving,
                        height: 48,
                        onPressed: isSaving
                            ? null
                            : () {
                                if (_currentStep < 3) {
                                  setState(() => _currentStep++);
                                } else {
                                  _handleSubmit();
                                }
                              },
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

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildMoodStep();
      case 1:
        return _buildWellbeingStep();
      case 2:
        return _buildActivitiesStep();
      case 3:
      default:
        return _buildReflectionStep();
    }
  }

  Widget _buildMoodStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Expressive Hero Plush Character
        Center(
          child: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.primaryLight.withAlpha(120), width: 2.2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withAlpha(90),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Image.asset(
                _moodImagePath,
                fit: BoxFit.cover,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Column(
            children: [
              Text(
                'Feeling $_moodLabel',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Intensity: $_moodIntensity / 5',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Select your mood today:',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryDark,
          ),
        ),
        const SizedBox(height: 10),
        // Grid of Moods
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 0.92,
          ),
          itemCount: _moodOptions.length,
          itemBuilder: (context, index) {
            final option = _moodOptions[index];
            final bool isSelected = _moodLabel == option['label'];
            return GestureDetector(
              onTap: () {
                setState(() {
                  _moodLabel = option['label'] as String;
                  _moodScore = option['score'] as int;
                  _moodImagePath = option['image'] as String;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary.withAlpha(50) : AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(option['emoji'] as String, style: const TextStyle(fontSize: 24)),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          option['label'] as String,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? AppColors.primaryLight : AppColors.textSecondaryDark,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 20),
        // Intensity Slider
        AppCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Mood Intensity',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark),
                  ),
                  Text('$_moodIntensity / 5', style: const TextStyle(fontSize: 13, color: AppColors.primaryLight)),
                ],
              ),
              Slider(
                value: _moodIntensity.toDouble(),
                min: 1,
                max: 5,
                divisions: 4,
                activeColor: AppColors.primaryLight,
                inactiveColor: AppColors.surfaceLightDark,
                onChanged: (val) => setState(() => _moodIntensity = val.round()),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppTextField(
          controller: _moodNoteController,
          label: 'Quick Note (optional)',
          hint: 'What contributed to this mood?',
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buildWellbeingStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Wellbeing & Vitality',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimaryDark),
        ),
        const SizedBox(height: 4),
        const Text(
          'Tune into your internal energy and stress balance.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
        ),
        const SizedBox(height: 20),
        _buildRatingRow('⚡ Energy Level', _energyLevel, (val) => setState(() => _energyLevel = val)),
        const SizedBox(height: 14),
        _buildRatingRow('🌿 Stress Level', _stressLevel, (val) => setState(() => _stressLevel = val)),
        const SizedBox(height: 14),
        _buildRatingRow('🎯 Focus Level', _focusLevel, (val) => setState(() => _focusLevel = val)),
        const SizedBox(height: 14),
        _buildRatingRow('🔥 Motivation Level', _motivationLevel, (val) => setState(() => _motivationLevel = val)),
      ],
    );
  }

  Widget _buildRatingRow(String title, int currentVal, ValueChanged<int> onSelect) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark)),
              Text('$currentVal / 5', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryLight)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(5, (index) {
              final val = index + 1;
              final isSelected = currentVal == val;
              return GestureDetector(
                onTap: () => onSelect(val),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 44,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : AppColors.surfaceLightDark,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.primaryLight : AppColors.borderDark,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '$val',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : AppColors.textSecondaryDark,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildActivitiesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Daily Activities',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimaryDark),
        ),
        const SizedBox(height: 4),
        const Text(
          'Track key daily rhythms for deeper correlation analytics.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
        ),
        const SizedBox(height: 20),
        _buildSliderCard('🌙 Sleep Hours', '$_sleepHours hrs', _sleepHours, 0, 14, (v) => setState(() => _sleepHours = (v * 2).round() / 2)),
        const SizedBox(height: 14),
        _buildSliderCard('💧 Water Intake', '$_waterIntakeMl ml', _waterIntakeMl.toDouble(), 0, 4000, (v) => setState(() => _waterIntakeMl = (v / 250).round() * 250)),
        const SizedBox(height: 14),
        _buildSliderCard('📚 Study Time', '$_studyHours hrs', _studyHours, 0, 12, (v) => setState(() => _studyHours = (v * 2).round() / 2)),
        const SizedBox(height: 14),
        _buildSliderCard('🏃 Exercise', '$_exerciseMinutes mins', _exerciseMinutes.toDouble(), 0, 180, (v) => setState(() => _exerciseMinutes = (v / 5).round() * 5)),
        const SizedBox(height: 14),
        _buildSliderCard('📱 Screen Time', '${(_screenTimeMinutes / 60).toStringAsFixed(1)} hrs', _screenTimeMinutes.toDouble(), 0, 720, (v) => setState(() => _screenTimeMinutes = (v / 15).round() * 15)),
      ],
    );
  }

  Widget _buildSliderCard(String title, String displayVal, double value, double min, double max, ValueChanged<double> onChanged) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark)),
              Text(displayVal, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primaryLight)),
            ],
          ),
          Slider(
            value: value.clamp(min, max),
            min: min,
            max: max,
            activeColor: AppColors.primaryLight,
            inactiveColor: AppColors.surfaceLightDark,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildReflectionStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Daily Reflection',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimaryDark),
        ),
        const SizedBox(height: 4),
        const Text(
          'Anchor your thoughts and rate how today felt overall.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
        ),
        const SizedBox(height: 20),

        // Overall Rating Stars
        AppCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              const Text(
                'Overall Day Rating',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimaryDark),
              ),
              const SizedBox(height: 12),
              LayoutBuilder(
                builder: (context, constraints) {
                  final starSize = ((constraints.maxWidth - 20) / 10).clamp(18.0, 24.0);
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(10, (index) {
                      final score = index + 1;
                      final isSelected = _dailyRating >= score;
                      return GestureDetector(
                        onTap: () => setState(() => _dailyRating = score),
                        child: Icon(
                          isSelected ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: isSelected ? const Color(0xFFFBBF24) : AppColors.surfaceLightDark,
                          size: starSize,
                        ),
                      );
                    }),
                  );
                },
              ),
              const SizedBox(height: 6),
              Text('$_dailyRating / 10', style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 16),

        AppTextField(
          controller: _journalTitleController,
          label: 'Reflection Title',
          hint: "Today's highlight",
        ),
        const SizedBox(height: 14),
        AppTextField(
          controller: _journalContentController,
          label: 'Journal Note',
          hint: 'What happened today? What made you smile or challenged you?',
          maxLines: 5,
        ),
      ],
    );
  }

  Widget _buildSuccessCelebration() {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(color: AppColors.accentMint.withAlpha(120), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accentMint.withAlpha(100),
                      blurRadius: 36,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(33),
                  child: Image.asset(AppAssets.moodHappy, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Check-in Complete! 🎉',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'You earned +25 XP and protected your growth streak!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondaryDark,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),
              AppButton(
                text: 'Return to Home',
                onPressed: () {
                  setState(() {
                    _submittedSuccess = false;
                    _currentStep = 0;
                  });
                },
                width: 200,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
}
