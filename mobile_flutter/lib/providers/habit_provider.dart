import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/habit_model.dart';

class HabitProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<HabitModel> _habits = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<HabitModel> get habits => _habits;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchHabits() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.habits);
      if (res is List) {
        _habits = res.map((item) => HabitModel.fromJson(item as Map<String, dynamic>)).toList();
      } else if (res != null && res['habits'] is List) {
        _habits = (res['habits'] as List).map((item) => HabitModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createHabit({
    required String name,
    String icon = '✨',
    String frequency = 'daily',
  }) async {
    try {
      final res = await _api.post(ApiConstants.habits, data: {
        'name': name.trim(),
        'icon': icon,
        'frequency': frequency,
        'status': 'active',
      });

      if (res != null) {
        final newHabit = HabitModel.fromJson(res is Map<String, dynamic> && res['habit'] != null ? res['habit'] : res);
        _habits.insert(0, newHabit);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<bool> toggleHabitCompletion(int id) async {
    final index = _habits.indexWhere((h) => h.id == id);
    if (index == -1) return false;

    final habit = _habits[index];
    final newStatus = !habit.completedToday;

    // Optimistic UI update
    final updatedStreak = newStatus ? habit.currentStreak + 1 : (habit.currentStreak > 0 ? habit.currentStreak - 1 : 0);
    _habits[index] = habit.copyWith(
      completedToday: newStatus,
      currentStreak: updatedStreak,
    );
    notifyListeners();

    try {
      final res = await _api.post('${ApiConstants.habits}$id/completion', data: {
        'completed': newStatus,
      });
      return res != null;
    } catch (e) {
      // Revert on failure
      _habits[index] = habit;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteHabit(int id) async {
    try {
      await _api.delete('${ApiConstants.habits}$id');
      _habits.removeWhere((h) => h.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }
}
