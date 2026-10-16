import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/document_model.dart';

class DocumentProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<DocumentModel> _documents = [];
  bool _isLoading = false;
  bool _isUploading = false;
  String? _errorMessage;

  List<DocumentModel> get documents => _documents;
  bool get isLoading => _isLoading;
  bool get isUploading => _isUploading;
  String? get errorMessage => _errorMessage;

  int get totalExtractedChars => _documents.fold(0, (acc, doc) => acc + doc.extractedChars);

  Future<void> fetchDocuments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.documents);
      if (res is List) {
        _documents = res
            .map((item) => DocumentModel.fromJson(item as Map<String, dynamic>))
            .toList();
      } else if (res is Map<String, dynamic> && res['documents'] is List) {
        _documents = (res['documents'] as List)
            .map((item) => DocumentModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> uploadDocument(String filePath, {String? fileName}) async {
    _isUploading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.uploadFile(
        ApiConstants.documents,
        filePath,
        'file',
        fileName: fileName,
      );

      if (res != null) {
        // Refresh document list
        await fetchDocuments();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  Future<DocumentModel?> getDocument(int id) async {
    try {
      final res = await _api.get('${ApiConstants.documents}$id');
      if (res is Map<String, dynamic>) {
        final doc = DocumentModel.fromJson(res);
        final index = _documents.indexWhere((d) => d.id == id);
        if (index != -1) {
          _documents[index] = doc;
          notifyListeners();
        }
        return doc;
      }
      return null;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    }
  }

  Future<bool> deleteDocument(int id) async {
    try {
      final res = await _api.delete('${ApiConstants.documents}$id');
      if (res != null) {
        _documents.removeWhere((d) => d.id == id);
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
