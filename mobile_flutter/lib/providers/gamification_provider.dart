import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/achievement_model.dart';

class GamificationProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<AchievementModel> _achievements = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AchievementModel> get achievements => _achievements;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchAchievements() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.achievements);
      if (res != null && res['achievements'] is List) {
        _achievements = (res['achievements'] as List)
            .map((item) => AchievementModel.fromJson(item as Map<String, dynamic>))
            .toList();
      } else if (res is List) {
        _achievements = res
            .map((item) => AchievementModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
