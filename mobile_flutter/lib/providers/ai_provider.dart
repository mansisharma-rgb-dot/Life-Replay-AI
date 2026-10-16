import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/ai_insight_model.dart';

class AIProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  AIOverviewModel? _overview;
  AIReplayResult? _replayResult;
  bool _isLoadingOverview = false;
  bool _isQueryingReplay = false;
  String? _overviewError;
  String? _replayError;

  AIOverviewModel? get overview => _overview;
  AIReplayResult? get replayResult => _replayResult;
  bool get isLoadingOverview => _isLoadingOverview;
  bool get isQueryingReplay => _isQueryingReplay;
  String? get overviewError => _overviewError;
  String? get replayError => _replayError;

  Future<void> fetchAIOverview({String range = '30d'}) async {
    _isLoadingOverview = true;
    _overviewError = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.aiOverview, queryParameters: {'timeRange': range});
      if (res != null && res is Map<String, dynamic>) {
        _overview = AIOverviewModel.fromJson(res);
      }
    } catch (e) {
      _overviewError = e.toString();
    } finally {
      _isLoadingOverview = false;
      notifyListeners();
    }
  }

  Future<bool> queryReplay(String query) async {
    if (query.trim().isEmpty) return false;

    _isQueryingReplay = true;
    _replayError = null;
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.aiReplay, data: {
        'query': query.trim(),
      });

      if (res != null && res is Map<String, dynamic>) {
        _replayResult = AIReplayResult.fromJson(res);
        _isQueryingReplay = false;
        notifyListeners();
        return true;
      } else {
        _replayError = 'Could not generate Replay for this query.';
        _isQueryingReplay = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _replayError = e.toString();
      _isQueryingReplay = false;
      notifyListeners();
      return false;
    }
  }

  void clearReplay() {
    _replayResult = null;
    _replayError = null;
    notifyListeners();
  }
}
