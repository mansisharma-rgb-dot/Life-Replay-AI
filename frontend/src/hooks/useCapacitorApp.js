import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

/**
 * Hook to configure native Capacitor integration:
 * - Hardware back button routing
 * - Status bar theming & safe area colors
 */
export function useCapacitorApp({ isModalOpen = false, closeModal = () => {} } = {}) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    // 1. Configure status bar
    const configureStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#090e1a' })
      } catch (err) {
        // Status bar plugin might not support web/custom setups
      }
    }
    configureStatusBar()

    // 2. Configure Android hardware back button
    let backListener = null
    const setupBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', ({ canGoBack }) => {
          // If a modal/drawer is open, dismiss it first
          if (isModalOpen) {
            closeModal()
            return
          }

          // If on home/dashboard, let default app exit behavior happen
          if (location.pathname === '/dashboard' || location.pathname === '/') {
            CapApp.exitApp()
            return
          }

          // Otherwise, navigate backwards in app history
          if (canGoBack || window.history.length > 1) {
            window.history.back()
          } else {
            navigate('/dashboard', { replace: true })
          }
        })
      } catch (err) {
        // ignore fallback
      }
    }
    setupBackButton()

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove()
      }
    }
  }, [location.pathname, isModalOpen, closeModal, navigate])
}
