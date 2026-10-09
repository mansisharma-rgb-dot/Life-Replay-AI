import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import authApi from '@api/authApi'

const useAuthStore = create(
  subscribeWithSelector((set, get) => ({
    // ─── State ──────────────────────────────────────────────────────────
    user:            null,
    accessToken:     null,
    isAuthenticated: false,
    isLoading:       true,

    // ─── Actions ────────────────────────────────────────────────────────

    /** Attempt silent token refresh on app mount to restore session. */
    initializeAuth: async () => {
      set({ isLoading: true })
      try {
        // Step 1: Refresh the access token using the HttpOnly refresh cookie
        const refreshRes = await authApi.refresh()
        const { access_token } = refreshRes.data
        set({ accessToken: access_token, isAuthenticated: true })

        // Step 2: Fetch the authenticated user with the new access token.
        // The /auth/me endpoint uses get_jwt_identity() — no frontend-supplied ID.
        const meRes = await authApi.me()
        if (meRes.data?.user) {
          set({ user: meRes.data.user })
        }
      } catch {
        set({ accessToken: null, user: null, isAuthenticated: false })
      } finally {
        set({ isLoading: false })
      }
    },

    /** Login — calls API and stores access token in memory. */
    login: async (credentials) => {
      set({ isLoading: true })
      try {
        const res  = await authApi.login(credentials)
        // Backend returns { success, access_token, user } at the top level of res.data
        const { access_token, user } = res.data
        set({ accessToken: access_token, user, isAuthenticated: true, isLoading: false })
        return { success: true }
      } catch (err) {
        set({ isLoading: false })
        return {
          success: false,
          error:   err.response?.data?.error || err.response?.data?.message || 'Invalid email or password.',
          details: err.response?.data?.details || {},
        }
      }
    },

    /** Register — calls API and stores access token. */
    register: async (data) => {
      set({ isLoading: true })
      try {
        const res  = await authApi.register(data)
        // Backend returns { success, access_token, user } at the top level of res.data
        const { access_token, user } = res.data
        set({ accessToken: access_token, user, isAuthenticated: true, isLoading: false })
        return { success: true, user }
      } catch (err) {
        set({ isLoading: false })
        return {
          success: false,
          error:   err.response?.data?.error || err.response?.data?.message || 'Registration failed.',
          details: err.response?.data?.details || {},
        }
      }
    },

    /** Logout — revokes token server-side and clears local state. */
    logout: async () => {
      try {
        await authApi.logout()
      } catch { /* Silently ignore — clear state regardless */ } finally {
        set({ accessToken: null, user: null, isAuthenticated: false })
      }
    },

    /** Silent token refresh — used by Axios interceptor on 401. */
    refreshToken: async () => {
      try {
        const res = await authApi.refresh()
        const { access_token } = res.data
        // Only update the token — user identity unchanged during mid-session refresh
        set({ accessToken: access_token, isAuthenticated: true })
        return access_token
      } catch {
        set({ accessToken: null, user: null, isAuthenticated: false })
        return null
      }
    },

    /** Direct token setter (for use by Axios interceptor after refresh). */
    setAccessToken: (token) => set({ accessToken: token }),

    /** Patch user profile fields locally after a profile update. */
    updateProfile: (updates) =>
      set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

    // ─── Avatar ──────────────────────────────────────────────────────────
    avatarBlobUrl: null,

    fetchAvatar: async () => {
      try {
        const { profileApi } = await import('@api/profileApi');
        const url = await profileApi.getAvatarBlob();
        // Clean up previous blob if any
        const prevUrl = get().avatarBlobUrl;
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        set({ avatarBlobUrl: url });
      } catch (err) {
        set({ avatarBlobUrl: null });
      }
    }
  }))
)

// Hook into state changes to fetch avatar when user logs in and has an avatar
useAuthStore.subscribe(
  (state) => state.user,
  (user, prevUser) => {
    // If we just logged in or updated profile and have an avatar
    if (user && user.has_avatar) {
      // Fetch only if it's a new login or we didn't have one before
      if (!prevUser || !prevUser.has_avatar || prevUser.id !== user.id) {
        useAuthStore.getState().fetchAvatar();
      }
    } else if (!user || (user && !user.has_avatar)) {
      // Clear if logged out or removed avatar
      const prevUrl = useAuthStore.getState().avatarBlobUrl;
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      useAuthStore.setState({ avatarBlobUrl: null });
    }
  }
)

export default useAuthStore
