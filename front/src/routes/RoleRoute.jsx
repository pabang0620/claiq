import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'

export function RoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return <PageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
