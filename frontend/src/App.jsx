import AppRouter              from './router/AppRouter'
import { AuthProvider }       from './context/AuthContext'
import { ThemeProvider }      from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e1e24', color: '#fff' } }} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
