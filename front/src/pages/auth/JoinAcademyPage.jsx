import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { authApi } from '../../api/auth.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { getDashboardPath } from '../../utils/roleGuard.js'

export default function JoinAcademyPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError('학원 코드는 6자리입니다.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await authApi.joinAcademy(trimmed)
      addToast({ type: 'success', message: '학원에 성공적으로 가입됐습니다!' })
      navigate(getDashboardPath(user?.role))
    } catch (err) {
      setError(err.message || '학원 코드가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSkip() {
    navigate(getDashboardPath(user?.role))
  }

  return (
    <>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">학원 코드 입력</h2>
      <p className="text-sm text-zinc-500 mb-6">
        학원 운영자로부터 받은 6자리 코드를 입력하세요.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="code"
          label="학원 코드"
          placeholder="예: ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          error={error}
          required
          disabled={isLoading}
          hint="6자리 영문+숫자 코드"
        />
        <Button type="submit" loading={isLoading} className="w-full">
          학원 가입하기
        </Button>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        className="w-full mt-3 text-sm text-zinc-400 hover:text-zinc-600 py-2 transition-colors"
      >
        나중에 입력할게요 →
      </button>
    </>
  )
}
