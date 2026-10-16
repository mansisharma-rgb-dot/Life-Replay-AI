import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/analytics_model.dart';

class AnalyticsProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  AnalyticsOverviewModel? _overview;
  List<LifeScorePoint> _lifeScores = [];
  List<MoodHistoryPoint> _moodHistory = [];
  List<Map<String, dynamic>> _moodDistribution = [];
  HabitAnalyticsData? _habitData;
  ProductivityAnalyticsData? _productivityData;
  SleepAnalyticsData? _sleepData;
  WaterAnalyticsData? _waterData;

  String _selectedRange = '30d';
  bool _isLoading = false;
  String? _errorMessage;

  AnalyticsOverviewModel? get overview => _overview;
  List<LifeScorePoint> get lifeScores => _lifeScores;
  List<MoodHistoryPoint> get moodHistory => _moodHistory;
  List<Map<String, dynamic>> get moodDistribution => _moodDistribution;
  HabitAnalyticsData? get habitData => _habitData;
  ProductivityAnalyticsData? get productivityData => _productivityData;
  SleepAnalyticsData? get sleepData => _sleepData;
  WaterAnalyticsData? get waterData => _waterData;

  String get selectedRange => _selectedRange;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchAnalytics({String? range}) async {
    if (range != null) {
      _selectedRange = range;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final qp = {'timeRange': _selectedRange};

      await Future.wait([
        // 1. Overview
        _api.get(ApiConstants.analyticsOverview, queryParameters: qp).then((res) {
          if (res != null) {
            _overview = AnalyticsOverviewModel.fromJson(res is Map<String, dynamic> ? res : null);
          }
        }).catchError((_) {
          _overview = AnalyticsOverviewModel();
        }),

        // 2. Life Score History
        _api.get(ApiConstants.analyticsLifeScore, queryParameters: qp).then((res) {
          if (res != null && res['history'] is List) {
            _lifeScores = (res['history'] as List)
                .map((item) => LifeScorePoint.fromJson(item as Map<String, dynamic>))
                .toList();
          } else {
            _lifeScores = [];
          }
        }).catchError((_) {
          _lifeScores = [];
        }),

        // 3. Mood Analytics
        _api.get(ApiConstants.analyticsMood, queryParameters: qp).then((res) {
          if (res != null) {
            if (res['history'] is List) {
              _moodHistory = (res['history'] as List)
                  .map((item) => MoodHistoryPoint.fromJson(item as Map<String, dynamic>))
                  .toList();
            } else {
              _moodHistory = [];
            }
            if (res['distribution'] is List) {
              _moodDistribution = (res['distribution'] as List)
                  .whereType<Map<String, dynamic>>()
                  .toList();
            } else {
              _moodDistribution = [];
            }
          }
        }).catchError((_) {
          _moodHistory = [];
          _moodDistribution = [];
        }),

        // 4. Habit Analytics
        _api.get(ApiConstants.analyticsHabits, queryParameters: qp).then((res) {
          if (res is Map<String, dynamic>) {
            _habitData = HabitAnalyticsData.fromJson(res);
          }
        }).catchError((_) {
          _habitData = HabitAnalyticsData();
        }),

        // 5. Productivity Analytics
        _api.get(ApiConstants.analyticsProductivity, queryParameters: qp).then((res) {
          if (res is Map<String, dynamic>) {
            _productivityData = ProductivityAnalyticsData.fromJson(res);
          }
        }).catchError((_) {
          _productivityData = ProductivityAnalyticsData();
        }),

        // 6. Sleep Analytics
        _api.get(ApiConstants.analyticsSleep, queryParameters: qp).then((res) {
          if (res is Map<String, dynamic>) {
            _sleepData = SleepAnalyticsData.fromJson(res);
          }
        }).catchError((_) {
          _sleepData = SleepAnalyticsData();
        }),

        // 7. Water Analytics
        _api.get(ApiConstants.analyticsWater, queryParameters: qp).then((res) {
          if (res is Map<String, dynamic>) {
            _waterData = WaterAnalyticsData.fromJson(res);
          }
        }).catchError((_) {
          _waterData = WaterAnalyticsData();
        }),
      ]);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
