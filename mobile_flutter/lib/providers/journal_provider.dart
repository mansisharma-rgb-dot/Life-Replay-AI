import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/journal_model.dart';

class JournalProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<JournalModel> _journals = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<JournalModel> get journals => _journals;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchJournals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.journals);
      List? rawList;
      if (res != null) {
        if (res['items'] is List) {
          rawList = res['items'] as List;
        } else if (res['journals'] is List) {
          rawList = res['journals'] as List;
        } else if (res is List) {
          rawList = res;
        }
      }

      if (rawList != null) {
        _journals = rawList
            .map((item) => JournalModel.fromJson(item as Map<String, dynamic>))
            .where((j) => j.content.isNotEmpty || j.title.isNotEmpty)
            .toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createJournal({required String title, required String content}) async {
    try {
      final res = await _api.put(ApiConstants.todayCheckin, data: {
        'journal': {
          'title': title,
          'content': content,
        }
      });
      if (res != null) {
        await fetchJournals();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<bool> updateJournal(int id, {required String title, required String content}) async {
    try {
      final res = await _api.put('${ApiConstants.journals}$id', data: {
        'title': title,
        'content': content,
      });

      if (res != null) {
        final index = _journals.indexWhere((j) => j.id == id);
        if (index != -1) {
          _journals[index] = JournalModel(
            id: id,
            date: _journals[index].date,
            title: title,
            content: content,
            moodScore: _journals[index].moodScore,
            moodLabel: _journals[index].moodLabel,
            tags: _journals[index].tags,
          );
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

  Future<bool> deleteJournal(int id) async {
    try {
      // Clear content via update on backend
      final res = await _api.put('${ApiConstants.journals}$id', data: {
        'title': '',
        'content': '',
      });

      if (res != null) {
        _journals.removeWhere((j) => j.id == id);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }
}
