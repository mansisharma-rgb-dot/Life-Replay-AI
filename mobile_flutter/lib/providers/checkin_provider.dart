import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/checkin_model.dart';

class CheckinProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  CheckinModel? _todayCheckin;
  List<CheckinModel> _history = [];
  int _historyTotal = 0;
  int _historyPages = 1;
  int _historyCurrentPage = 1;
  String _selectedPeriod = 'all';

  final Map<String, CheckinModel> _calendarCheckinMap = {};
  CheckinModel? _selectedDateCheckin;

  bool _isLoading = false;
  bool _isLoadingHistory = false;
  bool _isLoadingCalendar = false;
  bool _isLoadingDateDetails = false;
  bool _isSaving = false;
  String? _errorMessage;
  String? _historyError;
  String? _dateDetailsError;

  // Getters
  CheckinModel? get todayCheckin => _todayCheckin;
  List<CheckinModel> get history => _history;
  int get historyTotal => _historyTotal;
  int get historyPages => _historyPages;
  int get historyCurrentPage => _historyCurrentPage;
  String get selectedPeriod => _selectedPeriod;

  Map<String, CheckinModel> get calendarCheckinMap => _calendarCheckinMap;
  CheckinModel? get selectedDateCheckin => _selectedDateCheckin;

  bool get isLoading => _isLoading;
  bool get isLoadingHistory => _isLoadingHistory;
  bool get isLoadingCalendar => _isLoadingCalendar;
  bool get isLoadingDateDetails => _isLoadingDateDetails;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;
  String? get historyError => _historyError;
  String? get dateDetailsError => _dateDetailsError;
  bool get isCompletedToday => _todayCheckin?.isCompleted ?? false;
  bool get hasMoreHistory => _historyCurrentPage < _historyPages;

  void setSelectedPeriod(String period) {
    if (_selectedPeriod != period) {
      _selectedPeriod = period;
      notifyListeners();
      fetchHistory(period: period, refresh: true);
    }
  }

  void clearSelectedDateCheckin() {
    _selectedDateCheckin = null;
    _dateDetailsError = null;
    notifyListeners();
  }

  Future<void> fetchTodayCheckin() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.todayCheckin);
      if (res is Map<String, dynamic>) {
        if (res['checkin'] is Map<String, dynamic>) {
          _todayCheckin = CheckinModel.fromJson(res['checkin'] as Map<String, dynamic>);
        } else if (res['is_completed'] == true || (res['id'] != null && res['id'] is int)) {
          _todayCheckin = CheckinModel.fromJson(res);
        } else if (res['found'] == false) {
          _todayCheckin = null;
        } else if (res.containsKey('mood') || res.containsKey('activities')) {
          _todayCheckin = CheckinModel.fromJson(res);
        } else {
          _todayCheckin = null;
        }

        if (_todayCheckin != null) {
          final cleanDate = _todayCheckin!.date.split('T')[0];
          _calendarCheckinMap[cleanDate] = _todayCheckin!;
        }
      } else {
        _todayCheckin = null;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitCheckin(CheckinModel checkin) async {
    if (_isSaving) return false;
    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.checkin, data: checkin.toJson());
      if (res != null && res is Map<String, dynamic>) {
        CheckinModel saved;
        if (res['checkin'] is Map<String, dynamic>) {
          saved = CheckinModel.fromJson(res['checkin'] as Map<String, dynamic>);
        } else if (res['id'] != null || res['is_completed'] != null || res['activities'] != null) {
          saved = CheckinModel.fromJson(res);
        } else {
          saved = checkin;
        }

        _todayCheckin = saved;
        final cleanDate = saved.date.split('T')[0];
        _calendarCheckinMap[cleanDate] = saved;
        _isSaving = false;
        notifyListeners();

        // Refresh history to keep it synchronized
        fetchHistory(refresh: true);
        return true;
      }
      _errorMessage = 'Invalid response received from server.';
      _isSaving = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchHistory({
    int page = 1,
    int perPage = 50,
    String? period,
    String? startDate,
    String? endDate,
    bool refresh = false,
  }) async {
    if (page == 1 || refresh) {
      _isLoadingHistory = true;
      _historyError = null;
      if (refresh) {
        _history = [];
        _historyCurrentPage = 1;
      }
      notifyListeners();
    }

    try {
      final qp = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      final activePeriod = period ?? _selectedPeriod;
      if (activePeriod != 'all') {
        qp['period'] = activePeriod;
      }
      if (startDate != null && startDate.isNotEmpty) {
        qp['start_date'] = startDate;
      }
      if (endDate != null && endDate.isNotEmpty) {
        qp['end_date'] = endDate;
      }

      final res = await _api.get(ApiConstants.checkinHistory, queryParameters: qp);

      if (res is Map<String, dynamic>) {
        final rawList = (res['items'] is List)
            ? res['items'] as List
            : (res['checkins'] is List ? res['checkins'] as List : []);

        final List<CheckinModel> fetched = rawList
            .whereType<Map<String, dynamic>>()
            .map((item) => CheckinModel.fromJson(item))
            .toList();

        _historyTotal = (res['total'] as num?)?.toInt() ?? fetched.length;
        _historyPages = (res['pages'] as num?)?.toInt() ?? 1;
        _historyCurrentPage = page;

        if (page == 1 || refresh) {
          _history = fetched;
        } else {
          // Avoid duplicates
          final existingIds = _history.map((h) => h.id ?? h.date).toSet();
          for (final item in fetched) {
            final key = item.id ?? item.date;
            if (!existingIds.contains(key)) {
              _history.add(item);
              existingIds.add(key);
            }
          }
        }

        // Cache into calendar map
        for (final item in fetched) {
          final clean = item.date.split('T')[0];
          _calendarCheckinMap[clean] = item;
        }
      }
    } catch (e) {
      _historyError = e.toString();
    } finally {
      _isLoadingHistory = false;
      notifyListeners();
    }
  }

  Future<void> fetchCalendarMonth(DateTime month) async {
    _isLoadingCalendar = true;
    notifyListeners();

    try {
      // Fetch up to 100 checkins to cover surrounding month transitions
      final res = await _api.get(ApiConstants.checkinHistory, queryParameters: {
        'page': 1,
        'per_page': 100,
      });

      if (res is Map<String, dynamic>) {
        final rawList = (res['items'] is List)
            ? res['items'] as List
            : (res['checkins'] is List ? res['checkins'] as List : []);

        for (final item in rawList) {
          if (item is Map<String, dynamic>) {
            final model = CheckinModel.fromJson(item);
            final clean = model.date.split('T')[0];
            _calendarCheckinMap[clean] = model;
          }
        }
      }
    } catch (_) {
      // Fail gracefully for calendar dots
    } finally {
      _isLoadingCalendar = false;
      notifyListeners();
    }
  }

  Future<CheckinModel?> fetchCheckinByDate(String dateStr) async {
    final cleanDate = dateStr.split('T')[0];
    _isLoadingDateDetails = true;
    _dateDetailsError = null;
    notifyListeners();

    try {
      final res = await _api.get('${ApiConstants.checkinDate}$cleanDate');
      if (res is Map<String, dynamic>) {
        final bool found = res['found'] != false &&
            (res['id'] != null ||
                res['is_completed'] == true ||
                res['has_activities'] == true ||
                res['has_mood'] == true ||
                res['has_wellbeing'] == true ||
                res['has_journal'] == true);

        if (found) {
          final model = CheckinModel.fromJson(res);
          _selectedDateCheckin = model;
          _calendarCheckinMap[cleanDate] = model;
          return model;
        } else {
          _selectedDateCheckin = null;
          return null;
        }
      }
      _selectedDateCheckin = null;
      return null;
    } catch (e) {
      _dateDetailsError = e.toString();
      _selectedDateCheckin = null;
      return null;
    } finally {
      _isLoadingDateDetails = false;
      notifyListeners();
    }
  }
}
