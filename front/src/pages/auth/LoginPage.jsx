import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useUIStore } from '../../store/uiStore.js'

const DEMO_ACCOUNTS = [
  {
    group: 'operator',
    label: '운영자',
    email: 'admin@claiq.kr',
    name: '정민석',
  },
  {
    group: 'teacher',
    label: '교강사',
    email: 'teacher@claiq.kr',
    name: '이준혁',
  },
  {
    group: 'student',
    label: '수강생',
    email: 'student@claiq.kr',
    name: '김민준',
  },
  {
    group: 'student',
    label: '수강생',
    email: 'student2@claiq.kr',
    name: '최서아',
  },
  {
    group: 'student',
    label: '수강생',
    email: 'student3@claiq.kr',
    name: '박지호',
  },
]

const DEMO_PASSWORD = 'claiq1234'

const DEMO_BUTTON_CLASSES = {
  operator:
    'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed',
  teacher:
    'bg-primary-700 hover:bg-primary-800 text-white border border-primary-700 disabled:opacity-50 disabled:cursor-not-allowed',
  student:
    'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed',
}

export default function LoginPage() {
  const { login } = useAuth()
  const addToast = useUIStore((s) => s.addToast)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!form.email) errs.email = '이메일을 입력하세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = '올바른 이메일 형식으로 입력해 주세요. (예: example@email.com)'
    if (!form.password) errs.password = '비밀번호를 입력하세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setIsLoading(true)
    try {
      await login(form.email, form.password)
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '인증에 실패했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDemoLogin(email) {
    setErrors({})
    setForm({ email, password: DEMO_PASSWORD })
    setIsLoading(true)
    try {
      await login(email, DEMO_PASSWORD)
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '인증에 실패했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-zinc-900 mb-6">로그인</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="email"
          label="이메일"
          type="email"
          placeholder="이메일 주소를 입력하세요"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          error={errors.email}
          required
          disabled={isLoading}
        />
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          error={errors.password}
          required
          disabled={isLoading}
        />
        <Button type="submit" loading={isLoading} className="w-full mt-2">
          로그인
        </Button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400 whitespace-nowrap">데모 계정으로 빠른 시작</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin(account.email)}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
                'transition-all duration-150 active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                DEMO_BUTTON_CLASSES[account.group],
              ].join(' ')}
            >
              <span className="opacity-70">{account.label}</span>
              <span className="opacity-30">·</span>
              <span>{account.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 text-center space-y-2">
        <p className="text-sm text-zinc-500">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-primary-700 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </>
  )
}
