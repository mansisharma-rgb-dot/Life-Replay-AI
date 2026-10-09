import { useCallback } from 'react'
import { useNavigate }  from 'react-router-dom'
import { useAuth as useAuthContext } from '@context/AuthContext'
import { useNotification }          from '@context/NotificationContext'
import authApi from '@api/authApi'

/**
 * useAuth hook — exposes auth actions + state to page components.
 * Composes the AuthContext with additional UI-aware helpers.
 */
export default function useAuth() {
  const navigate      = useNavigate()
  const { success, error } = useNotification()
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout: contextLogout,
    updateProfile,
  } = useAuthContext()

  /** Login and redirect to dashboard (or the original `from` route) */
  const loginAndRedirect = useCallback(async (credentials, fromPath = '/dashboard') => {
    const result = await login(credentials)
    if (result.success) {
      success('Welcome back!', 'Signed in')
      navigate(fromPath, { replace: true })
    }
    return result
  }, [login, success, navigate])

  /** Logout and redirect to login */
  const logoutAndRedirect = useCallback(async () => {
    await contextLogout()
    success('You have been signed out.', 'Goodbye!')
    navigate('/login')
  }, [contextLogout, success, navigate])

  /** Forgot password — just calls API */
  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await authApi.forgotPassword({ email })
      return { success: true, message: res.data.message }
    } catch (err) {
      return {
        success: false,
        error:   err.response?.data?.error?.message || 'Something went wrong.',
      }
    }
  }, [])

  /** Reset password */
  const resetPassword = useCallback(async ({ token, password, confirmPassword }) => {
    try {
      const res = await authApi.resetPassword({ token, password, confirm_password: confirmPassword })
      return { success: true, message: res.data.message }
    } catch (err) {
      return {
        success: false,
        error:   err.response?.data?.error?.message || 'Reset failed.',
        details: err.response?.data?.error?.details || {},
      }
    }
  }, [])

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    loginAndRedirect,
    logoutAndRedirect,
    forgotPassword,
    resetPassword,
    updateProfile,
  }
}
