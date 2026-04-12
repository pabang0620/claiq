import { Outlet, Link } from 'react-router-dom'
import { ToastContainer } from '../ui/Toast.jsx'
import { AlertContainer } from '../ui/Alert.jsx'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-700 rounded-xl shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">CL</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-700">CLAIQ</h1>
          <p className="text-zinc-500 text-sm mt-1">AI 기반 수능 학습 플랫폼</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 border border-zinc-100">
          <Outlet />
        </div>

        <div className="text-center text-xs text-zinc-400 mt-6 space-y-1">
          <p>© 2026 CLAIQ. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1">
            <Link
              to="/privacy"
              className="hover:text-zinc-600 underline-offset-2 hover:underline transition-colors duration-150"
            >
              개인정보 처리방침
            </Link>
            <span> · </span>
            <Link
              to="/terms"
              className="hover:text-zinc-600 underline-offset-2 hover:underline transition-colors duration-150"
            >
              이용약관
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer />
      <AlertContainer />
    </div>
  )
}
