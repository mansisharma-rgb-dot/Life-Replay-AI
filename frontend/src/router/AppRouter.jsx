import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import AppLayout   from '@components/layout/AppLayout'
import AuthLayout  from '@components/layout/AuthLayout'
import PageSpinner from '@components/ui/PageSpinner'
import GlobalBackground from '@components/layout/GlobalBackground'

// ─── Lazy-load all page components ────────────────────────────────────────────
const LoginPage         = lazy(() => import('@pages/auth/LoginPage'))
const RegisterPage      = lazy(() => import('@pages/auth/RegisterPage'))
const ForgotPasswordPage= lazy(() => import('@pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@pages/auth/ResetPasswordPage'))
const DashboardPage     = lazy(() => import('@pages/dashboard/DashboardPage'))
const JournalPage       = lazy(() => import('@pages/journal/JournalPage'))
const ReplayPage        = lazy(() => import('@pages/replay/ReplayPage'))
const GoalsPage         = lazy(() => import('@pages/goals/GoalsPage'))
const GoalPredictionsPage = lazy(() => import('@pages/analytics/GoalPredictionsPage'))
const HabitsPage        = lazy(() => import('@pages/habits/HabitsPage'))
const AnalyticsPage     = lazy(() => import('@pages/analytics/AnalyticsPage'))
const TimeAnalysisPage  = lazy(() => import('@pages/analytics/TimeAnalysisPage'))
const InsightsPage      = lazy(() => import('@pages/insights/InsightsPage'))
const ProfilePage       = lazy(() => import('@pages/profile/ProfilePage'))
const DailyCheckinPage  = lazy(() => import('@pages/checkin/DailyCheckinPage'))
const HistoryPage       = lazy(() => import('@pages/history/HistoryPage'))
const MemoriesPage      = lazy(() => import('@pages/memories/MemoriesPage'))
const SkillsPage        = lazy(() => import('@pages/SkillsPage'))
const CalendarPage      = lazy(() => import('@pages/CalendarPage'))
const AchievementsPage  = lazy(() => import('@pages/AchievementsPage'))
const NotificationsPage = lazy(() => import('@pages/notifications/NotificationsPage'))
const NotFoundPage      = lazy(() => import('@pages/NotFoundPage'))
const ComingSoonPage    = lazy(() => import('@pages/ComingSoonPage'))
const MonthlyReportPage = lazy(() => import('@pages/reports/MonthlyReportPage'))
const GamificationPage  = lazy(() => import('@pages/gamification/GamificationPage'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <GlobalBackground />
      <Suspense fallback={<PageSpinner />}>
        <Routes>

          {/* ── Root redirect ───────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Auth routes (unauthenticated) ──────── */}
          <Route path="/login"                      element={<LoginPage />} />
          <Route path="/register"                   element={<RegisterPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/forgot-password"            element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token"      element={<ResetPasswordPage />} />
            <Route path="/reset-password"             element={<ResetPasswordPage />} />
          </Route>

          {/* ── Protected app routes ──────────────── */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard"          element={<DashboardPage />} />
            <Route path="/checkin"            element={<DailyCheckinPage />} />
            <Route path="/check-in"           element={<DailyCheckinPage />} />
            <Route path="/history"            element={<HistoryPage />} />
            <Route path="/memories"           element={<MemoriesPage />} />
            <Route path="/journal"            element={<JournalPage />} />
            <Route path="/replay"             element={<ReplayPage />} />
            <Route path="/goals"              element={<GoalsPage />} />
            <Route path="/goal-predictions"   element={<GoalPredictionsPage />} />
            <Route path="/ai-future-goals"    element={<GoalPredictionsPage />} />
            <Route path="/habits"             element={<HabitsPage />} />
            <Route path="/analytics"          element={<AnalyticsPage />} />
            <Route path="/time-analysis"      element={<TimeAnalysisPage />} />
            <Route path="/ai-analyzer"        element={<InsightsPage />} />
            <Route path="/insights"           element={<InsightsPage />} />
            <Route path="/ai-growth-analyzer" element={<InsightsPage />} />
            <Route path="/profile"            element={<ProfilePage />} />
            <Route path="/profile/settings"   element={<ProfilePage />} />
            <Route path="/calendar"           element={<CalendarPage />} />
            <Route path="/skills"             element={<SkillsPage />} />
            <Route path="/skill-growth"       element={<SkillsPage />} />
            <Route path="/achievements"       element={<AchievementsPage />} />
            <Route path="/notifications"      element={<NotificationsPage />} />
            <Route path="/reports/monthly"    element={<MonthlyReportPage />} />
            <Route path="/reports/weekly"     element={<MonthlyReportPage />} />
            <Route path="/monthly-report"     element={<MonthlyReportPage />} />
            <Route path="/progress"           element={<GamificationPage />} />
          </Route>

          {/* ── 404 ───────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
