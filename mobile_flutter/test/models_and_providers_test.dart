import 'package:flutter_test/flutter_test.dart';
import 'package:life_replay_ai/models/user_model.dart';
import 'package:life_replay_ai/models/checkin_model.dart';
import 'package:life_replay_ai/models/goal_model.dart';
import 'package:life_replay_ai/models/habit_model.dart';
import 'package:life_replay_ai/models/journal_model.dart';
import 'package:life_replay_ai/models/analytics_model.dart';
import 'package:life_replay_ai/models/ai_insight_model.dart';
import 'package:life_replay_ai/models/achievement_model.dart';
import 'package:life_replay_ai/models/document_model.dart';

void main() {
  group('Models Unit Tests', () {
    test('UserModel fromJson & toJson', () {
      final json = {
        'id': 42,
        'full_name': 'Mansi Sharma',
        'email': 'mansi@example.com',
        'current_streak': 7,
        'longest_streak': 14,
        'total_xp': 350,
        'level': 3,
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 42);
      expect(user.fullName, 'Mansi Sharma');
      expect(user.currentStreak, 7);
      expect(user.totalXp, 350);
      expect(user.level, 3);

      final out = user.toJson();
      expect(out['id'], 42);
      expect(out['full_name'], 'Mansi Sharma');
    });

    test('CheckinModel serialization and defaults', () {
      final json = {
        'id': 101,
        'date': '2026-10-15',
        'daily_rating': 9,
        'is_completed': true,
        'mood': {
          'mood_score': 8,
          'intensity': 4,
          'mood_label': 'Happy',
          'note': 'Great day studying!',
        },
        'wellbeing': {
          'energy_level': 5,
          'stress_level': 1,
          'focus_level': 5,
          'motivation_level': 4,
        },
        'activities': {
          'study_hours': 4.5,
          'sleep_hours': 8.0,
          'water_intake_ml': 2250,
        },
        'journal': {
          'title': 'Productive Thursday',
          'content': 'Solved all tasks seamlessly.',
        },
      };

      final checkin = CheckinModel.fromJson(json);
      expect(checkin.id, 101);
      expect(checkin.mood.moodLabel, 'Happy');
      expect(checkin.mood.moodScore, 8);
      expect(checkin.wellbeing.energyLevel, 5);
      expect(checkin.activities.studyHours, 4.5);
      expect(checkin.journal.title, 'Productive Thursday');
    });

    test('GoalModel percentage calculation', () {
      final goal = GoalModel(
        id: 1,
        title: 'Read 10 Books',
        progress: 7.0,
        target: 10.0,
      );

      expect(goal.percentage, closeTo(0.7, 0.01));
      expect(goal.isCompleted, false);

      final completedGoal = GoalModel(
        id: 2,
        title: 'Master Flutter',
        progress: 100.0,
        target: 100.0,
      );
      expect(completedGoal.percentage, 1.0);
      expect(completedGoal.isCompleted, true);
    });

    test('HabitModel streak & copyWith', () {
      final habit = HabitModel(
        id: 5,
        name: 'Morning Meditation',
        icon: '🧘',
        currentStreak: 4,
        completedToday: false,
      );

      final updated = habit.copyWith(
        completedToday: true,
        currentStreak: 5,
      );

      expect(updated.completedToday, true);
      expect(updated.currentStreak, 5);
      expect(updated.name, 'Morning Meditation');
    });

    test('JournalModel tags and content', () {
      final json = {
        'id': 12,
        'date': '2026-10-15',
        'title': 'A Quiet Moment',
        'content': 'Sitting by the window listening to rain.',
        'mood_score': 7,
        'tags': ['peace', 'mindfulness'],
      };

      final journal = JournalModel.fromJson(json);
      expect(journal.title, 'A Quiet Moment');
      expect(journal.tags, contains('peace'));
      expect(journal.tags.length, 2);
    });

    test('AnalyticsOverviewModel default resilience', () {
      final overview = AnalyticsOverviewModel.fromJson(null);
      expect(overview.averageLifeScore, 0);
      expect(overview.totalCheckins, 0);
      expect(overview.completionRate, 0);

      final populated = AnalyticsOverviewModel.fromJson({
        'averageLifeScore': 88,
        'currentStreak': 12,
        'totalXp': 500,
        'totalCheckins': 20,
      });
      expect(populated.averageLifeScore, 88);
      expect(populated.currentStreak, 12);
    });

    test('AIOverviewModel and AIReplayResult parsing', () {
      final json = {
        'insights': {
          'summary': 'Your focus was high during afternoon study blocks.',
          'insights': [
            {
              'title': 'High Study Focus',
              'category': 'strength',
              'message': 'Study blocks averaged 4.2 hours.',
              'priority': 'high',
            }
          ],
        },
        'recommendations': {
          'recommendations': [
            {
              'title': 'Maintain sleep routine',
              'action': 'Aim for 7.5+ hours tonight',
              'category': 'sleep',
              'priority': 'medium',
            }
          ],
        },
      };

      final model = AIOverviewModel.fromJson(json);
      expect(model.insights.length, 1);
      expect(model.insights.first.title, 'High Study Focus');
      expect(model.recommendations.length, 1);
      expect(model.recommendations.first.title, 'Maintain sleep routine');

      final replay = AIReplayResult.fromJson({
        'answer': 'Your week was balanced and steady.',
        'context': {
          'timeline': [
            {'date': '2026-10-14', 'title': 'Project milestone achieved'}
          ],
        },
      });
      expect(replay.answer, contains('balanced'));
      expect(replay.memories.length, 1);
    });

    test('AchievementModel serialization, categories and rarity tiers', () {
      final json = {
        'id_str': 'streak_30',
        'name': 'Monthly Master',
        'description': 'Maintain a check-in streak for 30 consecutive days',
        'icon': 'Award',
        'is_unlocked': true,
        'unlocked_at': '2026-10-14T20:00:00Z',
      };

      final ach = AchievementModel.fromJson(json);
      expect(ach.idStr, 'streak_30');
      expect(ach.name, 'Monthly Master');
      expect(ach.isUnlocked, isTrue);
      expect(ach.category, 'Consistency');
      expect(ach.rarityTier, 'Celestial Legendary');
      expect(ach.xpReward, 25);

      final lockedJson = {
        'id_str': 'goal_crusher',
        'name': 'Goal Crusher',
        'description': 'Complete your first goal',
        'icon': 'Trophy',
        'is_unlocked': false,
      };

      final lockedAch = AchievementModel.fromJson(lockedJson);
      expect(lockedAch.isUnlocked, isFalse);
      expect(lockedAch.category, 'Milestones');
      expect(lockedAch.rarityTier, 'Astral Epic');
    });

    test('DocumentModel fromJson and formattedFileSize', () {
      final docJson = {
        'id': 10,
        'title': 'AI Project Architecture.pdf',
        'original_name': 'AI Project Architecture.pdf',
        'file_type': 'pdf',
        'file_size': 2048500,
        'summary': 'Overview of the project components and database schema.',
        'key_topics': ['Architecture', 'Database', 'Flutter'],
        'extracted_text': 'This is the complete text extracted from the uploaded document.',
        'extracted_chars': 63,
        'status': 'completed',
      };

      final doc = DocumentModel.fromJson(docJson);
      expect(doc.id, 10);
      expect(doc.title, 'AI Project Architecture.pdf');
      expect(doc.fileType, 'pdf');
      expect(doc.summary, contains('Overview of the project'));
      expect(doc.keyTopics.length, 3);
      expect(doc.extractedChars, 63);
      expect(doc.status, 'completed');
      expect(doc.formattedFileSize, contains('MB'));
    });

    test('HabitAnalyticsData and SleepAnalyticsData parsing', () {
      final habitJson = {
        'completionRate': 85,
        'consistencyScore': 90,
        'habits': [
          {'name': 'Morning Meditation', 'completion': 100},
          {'name': 'Gym Workout', 'completion': 70},
        ],
      };

      final habitData = HabitAnalyticsData.fromJson(habitJson);
      expect(habitData.completionRate, 85);
      expect(habitData.habits.length, 2);
      expect(habitData.habits.first.name, 'Morning Meditation');

      final sleepJson = {
        'averageSleep': 7.8,
        'bestSleepDay': 'Saturday',
        'worstSleepDay': 'Monday',
        'history': [
          {'date': '2026-10-14', 'hours': 8.0},
        ],
      };

      final sleepData = SleepAnalyticsData.fromJson(sleepJson);
      expect(sleepData.averageSleep, 7.8);
      expect(sleepData.bestSleepDay, 'Saturday');
      expect(sleepData.history.length, 1);
    });
  });
}

