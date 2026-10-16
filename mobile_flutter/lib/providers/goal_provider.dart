import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/goal_model.dart';

class GoalProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<GoalModel> _goals = [];
  bool _isLoading = false;
  String? _errorMessage;
  dynamic _predictions;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  dynamic get predictions => _predictions;

  Future<void> fetchGoals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.goals);
      if (res is List) {
        _goals = res.map((item) => GoalModel.fromJson(item as Map<String, dynamic>)).toList();
      } else if (res != null && res['goals'] is List) {
        _goals = (res['goals'] as List).map((item) => GoalModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createGoal({
    required String title,
    required double target,
    String? category,
    String? deadline,
  }) async {
    try {
      final res = await _api.post(ApiConstants.goals, data: {
        'title': title,
        'target': target,
        'progress': 0.0,
        'category': ?category,
        'deadline': ?deadline,
        'status': 'active',
      });

      if (res != null) {
        final newGoal = GoalModel.fromJson(res is Map<String, dynamic> && res['goal'] != null ? res['goal'] : res);
        _goals.insert(0, newGoal);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<bool> updateGoalProgress(int id, double newProgress) async {
    try {
      final res = await _api.put('${ApiConstants.goals}$id', data: {
        'progress': newProgress,
      });

      if (res != null) {
        final index = _goals.indexWhere((g) => g.id == id);
        if (index != -1) {
          final updated = GoalModel.fromJson(res is Map<String, dynamic> && res['goal'] != null ? res['goal'] : res);
          _goals[index] = updated;
          notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<bool> deleteGoal(int id) async {
    try {
      await _api.delete('${ApiConstants.goals}$id');
      _goals.removeWhere((g) => g.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<void> fetchPredictions({String range = '30d'}) async {
    try {
      final res = await _api.get(ApiConstants.goalPredictions, queryParameters: {'range': range});
      _predictions = res;
      notifyListeners();
    } catch (_) {}
  }
}
