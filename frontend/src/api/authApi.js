import api from './axiosInstance'

const authApi = {
  register:      (data)  => api.post('/auth/register', data),
  login:         (data)  => api.post('/auth/login',    data),
  logout:        ()      => api.post('/auth/logout'),
  refresh:       ()      => api.post('/auth/refresh'),
  me:            ()      => api.get('/auth/me'),
  forgotPassword:(data)  => api.post('/auth/forgot-password', data),
  resetPassword: (data)  => api.post('/auth/reset-password',  data),
}

export default authApi
