import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { PageSpinner } from '../components/ui/Spinner.jsx'

export function PrivateRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return <PageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
