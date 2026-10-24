import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { getMe } from './services/authService'
import { logout, refreshUser } from './store/slices/authSlice'
import { startNotificationSubscription, stopNotificationSubscription } from './services/notificationService'

const Login             = lazy(() => import('./pages/Login'))
const HRLayout          = lazy(() => import('./layout/HRLayout'))
const HrDashboardTab    = lazy(() => import('./components/hr/HrDashboardTab'))
const WorkforceTab      = lazy(() => import('./components/hr/WorkforceTab'))
const OrgChartTab       = lazy(() => import('./components/hr/OrgChartTab'))
const LeaveRequestsPage = lazy(() => import('./pages/LeaveRequestsPage'))
const AttendanceTab     = lazy(() => import('./components/hr/AttendanceTab'))
const CalendarPage      = lazy(() => import('./pages/CalendarPage'))
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage'))

// HR Full: admins and the dedicated HR role
const HR_FULL_ROLES = ['admin', 'hr']

const PageFallback = () => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center overflow-hidden">
    <div className="text-center">
      <div className="nova-loading-spinner mx-auto" aria-hidden="true" />
      <p className="mt-4 text-xs font-semibold text-neutral-400">Loading...</p>
    </div>
  </div>
)

const AuthSync = () => {
  const dispatch = useDispatch()
  const token = useSelector(state => state.auth.token)

  useEffect(() => {
    if (!token) {
      stopNotificationSubscription()
      return
    }

    getMe()
      .then(user => dispatch(refreshUser(user)))
      .catch(error => {
        if (error?.response?.status === 401) dispatch(logout())
      })

    startNotificationSubscription()
    return () => stopNotificationSubscription()
  }, [dispatch, token])

  return null
}

const hrOnly = (element) => (
  <ProtectedRoute roles={HR_FULL_ROLES} redirect="/human-resources/leave">
    {element}
  </ProtectedRoute>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthSync />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/human-resources" element={
            <ProtectedRoute redirect="/login">
              <HRLayout />
            </ProtectedRoute>
          }>
            <Route index element={hrOnly(<HrDashboardTab />)} />
            <Route path="employees" element={hrOnly(<WorkforceTab />)} />
            <Route path="org-chart" element={hrOnly(<OrgChartTab />)} />
            <Route path="leave" element={<LeaveRequestsPage showOnly="lrf" />} />
            <Route path="overtime" element={<LeaveRequestsPage key="otr" initialTab="otr" showOnly="otr" />} />
            <Route path="attendance" element={hrOnly(<AttendanceTab />)} />
            <Route path="calendar" element={hrOnly(<CalendarPage />)} />
            <Route path="notifications" element={<NotificationCenterPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/human-resources" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
