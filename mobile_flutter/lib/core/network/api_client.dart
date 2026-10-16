import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';
import 'api_exception.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final CookieJar cookieJar = CookieJar();
  void Function()? onSessionExpired;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Attach Cookie Manager for HttpOnly cookies from Render
    dio.interceptors.add(CookieManager(cookieJar));

    // Request & Response Interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            final isRefreshRequest = error.requestOptions.path.contains('/auth/refresh');
            final isLoginRequest = error.requestOptions.path.contains('/auth/login');

            if (!isRefreshRequest && !isLoginRequest) {
              try {
                // Attempt refresh
                final refreshResponse = await dio.post(ApiConstants.refresh);
                if (refreshResponse.statusCode == 200 && refreshResponse.data != null) {
                  final newToken = refreshResponse.data['access_token'];
                  if (newToken != null) {
                    await SecureStorageService.saveToken(newToken.toString());
                    // Retry the failed request with new token
                    error.requestOptions.headers['Authorization'] = 'Bearer $newToken';
                    final clonedRequest = await dio.fetch(error.requestOptions);
                    return handler.resolve(clonedRequest);
                  }
                }
              } catch (_) {
                // Refresh failed, notify session expired
                onSessionExpired?.call();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  ApiException _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return ApiException(
        'The server is taking longer than usual to respond. If it was sleeping on Render, it will be ready in a moment.',
        statusCode: e.response?.statusCode,
      );
    } else if (e.type == DioExceptionType.connectionError) {
      return ApiException(
        'Unable to connect to Life Replay servers. Please check your internet connection.',
      );
    }

    final response = e.response;
    if (response != null && response.data != null) {
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final errorMsg = data['error'] ?? data['message'] ?? 'An error occurred';
        return ApiException(
          errorMsg.toString(),
          statusCode: response.statusCode,
          details: data['details'],
        );
      }
    }

    return ApiException(
      e.message ?? 'A network error occurred. Please try again.',
      statusCode: response?.statusCode,
    );
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final res = await dio.get(path, queryParameters: queryParameters);
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final res = await dio.post(path, data: data, queryParameters: queryParameters);
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> put(String path, {dynamic data}) async {
    try {
      final res = await dio.put(path, data: data);
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> patch(String path, {dynamic data}) async {
    try {
      final res = await dio.patch(path, data: data);
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> delete(String path, {dynamic data}) async {
    try {
      final res = await dio.delete(path, data: data);
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> uploadFile(String path, String filePath, String fieldName, {String? fileName}) async {
    try {
      final uploadFileName = fileName ?? filePath.split(RegExp(r'[/\\]')).last;
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          filePath,
          filename: uploadFileName,
        ),
      });

      final res = await dio.post(
        path,
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
