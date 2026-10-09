import axios from 'axios'

// ─── Base Axios Instance ──────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  timeout:         30000,
  withCredentials: true,   // send HttpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor: Attach Bearer Token ─────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config) => {
    // Lazily import the store to avoid circular-dependency at module load time.
    // getState() is synchronous once the module has loaded.
    try {
      const { default: useAuthStore } = await import('@store/authStore')
      const token = useAuthStore.getState().accessToken
      if (token) config.headers['Authorization'] = `Bearer ${token}`
    } catch { /* store not initialised yet — skip */ }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Silent Refresh on 401 ──────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const is401        = error.response?.status === 401
    const notRefresh   = !original.url?.includes('/auth/refresh')
    const notLogin     = !original.url?.includes('/auth/login')
    const notRetried   = !original._retry

    if (is401 && notRefresh && notLogin && notRetried) {
      if (isRefreshing) {
        // Queue while refresh is in-flight
        return new Promise((resolve, reject) => {
          if (failedQueue.length > 50) {
            const oldest = failedQueue.shift()
            oldest.reject(new Error('Queue max size exceeded'))
          }
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers['Authorization'] = `Bearer ${token}`
          return axiosInstance(original)
        }).catch(err => Promise.reject(err))
      }

      original._retry = true
      isRefreshing    = true

      try {
        const { default: useAuthStore } = await import('@store/authStore')
        const newToken = await useAuthStore.getState().refreshToken()

        if (newToken) {
          processQueue(null, newToken)
          original.headers['Authorization'] = `Bearer ${newToken}`
          return axiosInstance(original)
        } else {
          processQueue(new Error('Session expired'))
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } catch (refreshErr) {
        processQueue(refreshErr)
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
