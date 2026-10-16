import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/user_model.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _user != null;

  AuthProvider() {
    _api.onSessionExpired = () {
      logout();
    };
  }

  Future<void> checkAuthStatus() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final token = await SecureStorageService.getToken();
      if (token == null || token.isEmpty) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }

      // First load cached user if available for instant UI rendering
      _user = await SecureStorageService.getUser();
      if (_user != null) {
        _status = AuthStatus.authenticated;
        notifyListeners();
      }

      // Verify and refresh with backend
      final res = await _api.get(ApiConstants.me);
      if (res != null && res['user'] != null) {
        _user = UserModel.fromJson(res['user']);
        await SecureStorageService.saveUser(_user!);
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      // If offline but cached user exists, remain authenticated
      if (_user != null) {
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.login, data: {
        'email': email.replaceAll(' ', '').trim().toLowerCase(),
        'password': password,
      });

      if (res != null && res['access_token'] != null) {
        final token = res['access_token'].toString();
        await SecureStorageService.saveToken(token);

        if (res['user'] != null) {
          _user = UserModel.fromJson(res['user']);
          await SecureStorageService.saveUser(_user!);
        } else {
          // Fetch user profile if not directly attached
          await _fetchMe();
        }

        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res?['error'] ?? 'Login failed. Please verify credentials.';
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post(ApiConstants.register, data: {
        'full_name': fullName.trim(),
        'email': email.trim().toLowerCase(),
        'password': password,
        'confirm_password': confirmPassword,
      });

      if (res != null && (res['access_token'] != null || res['success'] == true)) {
        if (res['access_token'] != null) {
          await SecureStorageService.saveToken(res['access_token'].toString());
        }
        if (res['user'] != null) {
          _user = UserModel.fromJson(res['user']);
          await SecureStorageService.saveUser(_user!);
        }

        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res?['error'] ?? 'Registration could not be completed.';
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    try {
      final res = await _api.post(ApiConstants.forgotPassword, data: {
        'email': email.trim().toLowerCase(),
      });
      return res != null && res['success'] == true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<void> _fetchMe() async {
    try {
      final res = await _api.get(ApiConstants.me);
      if (res != null && res['user'] != null) {
        _user = UserModel.fromJson(res['user']);
        await SecureStorageService.saveUser(_user!);
      }
    } catch (_) {}
  }

  Future<void> refreshProfile() async {
    await _fetchMe();
    notifyListeners();
  }

  Future<bool> updateProfile({
    String? fullName,
    String? bio,
    Map<String, dynamic>? additionalSettings,
  }) async {
    try {
      final Map<String, dynamic> payload = {};
      if (fullName != null) payload['full_name'] = fullName.trim();
      if (bio != null) payload['bio'] = bio.trim();
      if (additionalSettings != null) {
        payload.addAll(additionalSettings);
      }

      final res = await _api.put(ApiConstants.profile, data: payload);
      if (res != null && (res['success'] == true || res['profile'] != null)) {
        final profileData = res['profile'] ?? res['user'] ?? res;
        if (_user != null) {
          _user = _user!.copyWith(
            fullName: profileData['full_name'] ?? fullName ?? _user!.fullName,
            bio: profileData['bio'] ?? bio ?? _user!.bio,
          );
          await SecureStorageService.saveUser(_user!);
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<Map<String, dynamic>?> fetchJourneyStats() async {
    try {
      final res = await _api.get('${ApiConstants.profile}stats');
      if (res != null && res['stats'] != null) {
        return res['stats'] as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> exportUserData() async {
    try {
      final res = await _api.get('${ApiConstants.profile}export');
      if (res != null && res['success'] == true) {
        return res['data'] as Map<String, dynamic>?;
      }
    } catch (_) {}
    return null;
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final res = await _api.put('${ApiConstants.profile}password', data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      return res != null && (res['success'] == true || res['message'] != null);
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiConstants.logout);
    } catch (_) {}
    await SecureStorageService.clearAll();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
