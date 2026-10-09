import { createContext, useContext, useEffect } from 'react'
import useAuthStore from '@store/authStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const user            = useAuthStore(s => s.user)
  const accessToken     = useAuthStore(s => s.accessToken)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isLoading       = useAuthStore(s => s.isLoading)
  const login           = useAuthStore(s => s.login)
  const logout          = useAuthStore(s => s.logout)
  const register        = useAuthStore(s => s.register)
  const refreshToken    = useAuthStore(s => s.refreshToken)
  const updateProfile   = useAuthStore(s => s.updateProfile)
  const initializeAuth  = useAuthStore(s => s.initializeAuth)
  const avatarBlobUrl   = useAuthStore(s => s.avatarBlobUrl)
  const fetchAvatar     = useAuthStore(s => s.fetchAvatar)

  // On mount, attempt silent token refresh to restore session
  useEffect(() => {
    initializeAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    refreshToken,
    updateProfile,
    avatarBlobUrl,
    fetchAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
