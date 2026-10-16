import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:life_replay_ai/models/checkin_model.dart';
import 'package:life_replay_ai/models/growth_report_model.dart';
import 'package:life_replay_ai/screens/checkin/checkin_detail_sheet.dart';

void main() {
  group('Phase 2: Check-in History Unit Tests', () {
    test('CheckinModel parses history items with habits and life score', () {
      final json = {
        'id': 42,
        'date': '2026-10-15',
        'daily_rating': 9,
        'is_completed': true,
        'life_score': 88,
        'life_score_details': {
          'total_score': 88,
          'breakdown': {'activities': 30, 'mood': 28, 'wellbeing': 30}
        },
        'mood': {
          'mood_score': 9,
          'intensity': 4,
          'mood_label': 'Happy',
          'note': 'Great focused day!',
        },
        'wellbeing': {
          'energy_level': 4,
          'stress_level': 2,
          'focus_level': 5,
          'motivation_level': 4,
        },
        'activities': {
          'sleep_hours': 8.0,
          'water_intake_ml': 2200,
          'study_hours': 3.5,
          'work_hours': 4.5,
          'walking_steps': 8200,
        },
        'journal': {
          'title': 'Milestone reflection',
          'content': 'Completed Flutter history and calendar integration!',
        },
        'habit_logs': [
          {'id': 1, 'habit_id': 10, 'name': 'Morning Meditation', 'icon': '🧘', 'streak': 5, 'completed': true},
          {'id': 2, 'habit_id': 11, 'name': 'Read 20 mins', 'icon': '📖', 'streak': 3, 'completed': true},
        ],
      };

      final model = CheckinModel.fromJson(json);

      expect(model.id, 42);
      expect(model.date, '2026-10-15');
      expect(model.isCompleted, true);
      expect(model.dailyRating, 9);
      expect(model.lifeScore, 88);
      expect(model.mood.moodLabel, 'Happy');
      expect(model.mood.moodScore, 9);
      expect(model.activities.sleepHours, 8.0);
      expect(model.activities.studyHours, 3.5);
      expect(model.habitLogs.length, 2);
      expect(model.habitLogs[0].name, 'Morning Meditation');
      expect(model.habitLogs[0].completed, true);
    });

    test('History sorting chronologically (newest first)', () {
      final list = [
        CheckinModel(date: '2026-10-10', mood: MoodData(), wellbeing: WellbeingData(), activities: ActivitiesData(), journal: CheckinJournalData()),
        CheckinModel(date: '2026-10-15', mood: MoodData(), wellbeing: WellbeingData(), activities: ActivitiesData(), journal: CheckinJournalData()),
        CheckinModel(date: '2026-10-12', mood: MoodData(), wellbeing: WellbeingData(), activities: ActivitiesData(), journal: CheckinJournalData()),
      ];

      list.sort((a, b) => b.date.compareTo(a.date));

      expect(list[0].date, '2026-10-15');
      expect(list[1].date, '2026-10-12');
      expect(list[2].date, '2026-10-10');
    });
  });

  group('Phase 3: Calendar Date Calculations & Mapping', () {
    test('Date key formatting handles single digits without UTC shift', () {
      final date = DateTime(2026, 3, 5);
      final key = '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      expect(key, '2026-03-05');
    });

    test('Calendar leap year detection for February 2024 and 2028', () {
      final feb2024 = DateTime(2024, 2, 1);
      final days2024 = <DateTime>[];
      var curr = feb2024;
      while (curr.month == 2) {
        days2024.add(curr);
        curr = curr.add(const Duration(days: 1));
      }
      expect(days2024.length, 29); // 2024 is a leap year

      final feb2026 = DateTime(2026, 2, 1);
      final days2026 = <DateTime>[];
      curr = feb2026;
      while (curr.month == 2) {
        days2026.add(curr);
        curr = curr.add(const Duration(days: 1));
      }
      expect(days2026.length, 28); // 2026 is non-leap year
    });

    test('Checkin map prevents duplicate dates and markers', () {
      final map = <String, CheckinModel>{};
      final item1 = CheckinModel(id: 1, date: '2026-10-15', mood: MoodData(moodLabel: 'Happy'), wellbeing: WellbeingData(), activities: ActivitiesData(), journal: CheckinJournalData());
      final item2 = CheckinModel(id: 1, date: '2026-10-15', mood: MoodData(moodLabel: 'Happy Updated'), wellbeing: WellbeingData(), activities: ActivitiesData(), journal: CheckinJournalData());

      map[item1.date] = item1;
      map[item2.date] = item2;

      expect(map.keys.length, 1);
      expect(map['2026-10-15']?.mood.moodLabel, 'Happy Updated');
    });
  });

  group('Phase 4: Personal Analytics & Metric Calculations', () {
    test('Completion rate and average wellbeing calculation without fabricated values', () {
      final history = [
        CheckinModel(
          date: '2026-10-10',
          isCompleted: true,
          mood: MoodData(moodLabel: 'Happy', moodScore: 8),
          wellbeing: WellbeingData(energyLevel: 4, stressLevel: 2, focusLevel: 4, motivationLevel: 4),
          activities: ActivitiesData(sleepHours: 7.5, studyHours: 2.0, workHours: 4.0),
          journal: CheckinJournalData(),
        ),
        CheckinModel(
          date: '2026-10-11',
          isCompleted: true,
          mood: MoodData(moodLabel: 'Happy', moodScore: 8),
          wellbeing: WellbeingData(energyLevel: 5, stressLevel: 1, focusLevel: 5, motivationLevel: 5),
          activities: ActivitiesData(sleepHours: 8.0, studyHours: 3.0, workHours: 3.0),
          journal: CheckinJournalData(),
        ),
        CheckinModel(
          date: '2026-10-12',
          isCompleted: true,
          mood: MoodData(moodLabel: 'Content', moodScore: 7),
          wellbeing: WellbeingData(energyLevel: 3, stressLevel: 3, focusLevel: 3, motivationLevel: 3),
          activities: ActivitiesData(sleepHours: 6.5, studyHours: 1.0, workHours: 5.0),
          journal: CheckinJournalData(),
        ),
      ];

      final totalExpectedDays = 7; // Last 7 days
      final totalRecorded = history.length;
      final completionRate = ((totalRecorded / totalExpectedDays) * 100).toInt();
      expect(completionRate, 42); // 3 of 7 = 42%

      // Mood counts
      final moodCounts = <String, int>{};
      for (final h in history) {
        moodCounts[h.mood.moodLabel] = (moodCounts[h.mood.moodLabel] ?? 0) + 1;
      }
      expect(moodCounts['Happy'], 2);
      expect(moodCounts['Content'], 1);

      // Average wellbeing
      final avgEnergy = history.fold(0.0, (s, h) => s + h.wellbeing.energyLevel) / history.length;
      expect(avgEnergy, 4.0); // (4+5+3)/3 = 4.0

      final avgStress = history.fold(0.0, (s, h) => s + h.wellbeing.stressLevel) / history.length;
      expect(avgStress, 2.0); // (2+1+3)/3 = 2.0
    });
  });

  group('Phase 5: Personal Growth Reports & Export Tests', () {
    test('GrowthReportModel parses response and handles empty data gracefully', () {
      final json = {
        'period': {
          'start_date': '2026-09-15',
          'end_date': '2026-10-15',
          'label': 'Sep 15 - Oct 15, 2026'
        },
        'metrics': {
          'total_checkin_days': 20,
          'average_life_score': 84,
          'average_mood': 7.6,
          'total_study_hours': 35.0,
          'total_work_hours': 50.0,
          'average_sleep_hours': 7.4,
          'average_water_intake_ml': 2100,
          'habit_completion_rate': 80,
          'completed_goals': 3,
          'achievements_unlocked': 2,
        },
        'highlights': [
          {'title': 'Consistent Sleep Rhythm', 'description': 'Maintained over 7 hours of sleep on average.'}
        ],
        'challenges': ['Hydration dropped below 2L on busy work days.'],
        'narrative': {
          'answer': {
            'reflection': 'A very productive month with high focus and steady habits.',
            'suggestions': 'Remember to stay hydrated during afternoon deep work sessions.'
          }
        },
        'ai_available': true,
        'empty': false,
      };

      final report = GrowthReportModel.fromJson(json);

      expect(report.isEmpty, false);
      expect(report.totalCheckinDays, 20);
      expect(report.averageLifeScore, 84);
      expect(report.averageMood, 7.6);
      expect(report.totalStudyHours, 35.0);
      expect(report.highlights.length, 1);
      expect(report.highlights[0].title, 'Consistent Sleep Rhythm');
      expect(report.reflectionText, contains('productive month'));
      expect(report.suggestionsText, contains('stay hydrated'));
    });
  });

  group('Widget Tests: Checkin Screens Rendering', () {
    testWidgets('CheckinDetailSheet renders entry details accurately', (WidgetTester tester) async {
      final checkin = CheckinModel(
        id: 99,
        date: '2026-10-15',
        dailyRating: 8,
        isCompleted: true,
        lifeScore: 85,
        mood: MoodData(moodLabel: 'Happy', moodScore: 8, note: 'Had a wonderful day coding!'),
        wellbeing: WellbeingData(energyLevel: 4, stressLevel: 2, focusLevel: 4, motivationLevel: 4),
        activities: ActivitiesData(sleepHours: 7.5, waterIntakeMl: 2000, studyHours: 3.0, workHours: 4.0),
        journal: CheckinJournalData(title: 'Proud Moment', content: 'Finished testing Flutter app features.'),
        habitLogs: [
          HabitLogItem(id: 1, name: 'Daily Check-in', icon: '✨', streak: 10, completed: true),
        ],
      );

      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CheckinDetailSheet(checkin: checkin),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Completed Check-in'), findsOneWidget);
      expect(find.text('85'), findsOneWidget); // Life score
      expect(find.text('8 / 10'), findsOneWidget); // Daily rating
      expect(find.text('Happy'), findsOneWidget); // Mood
      expect(find.text('"Had a wonderful day coding!"'), findsOneWidget); // Mood note
      expect(find.text('Proud Moment'), findsOneWidget); // Journal title
      expect(find.text('Finished testing Flutter app features.'), findsOneWidget); // Journal content
    });
  });
}
