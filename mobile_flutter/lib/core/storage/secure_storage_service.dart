import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../models/user_model.dart';

class SecureStorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String _tokenKey = 'lifereplay_access_token';
  static const String _userKey = 'lifereplay_user_profile';

  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  static Future<void> saveUser(UserModel user) async {
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getUser() async {
    final str = await _storage.read(key: _userKey);
    if (str == null || str.isEmpty) return null;
    try {
      final json = jsonDecode(str);
      return UserModel.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
