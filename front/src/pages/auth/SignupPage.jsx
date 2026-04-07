import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLES, ROLE_LABELS } from '../../constants/roles.js'
import { GraduationCap, BookOpen, Settings } from 'lucide-react'

const ROLE_ITEMS = [
  { role: ROLES.TEACHER, label: '교강사', desc: '강의 녹음을 업로드하고 AI 문제를 검증합니다', icon: GraduationCap },
  { role: ROLES.STUDENT, label: '수강생', desc: 'AI와 함께 수능을 준비합니다', icon: BookOpen },
  { role: ROLES.OPERATOR, label: '운영자', desc: '학원을 운영하고 데이터를 분석합니다', icon: Settings },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const [step, setStep] = useState(1) // 1: role, 2: form
  const [selectedRole, setSelectedRole] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [agree, setAgree] = useState({ terms: false, privacy: false })

  function validateForm() {
    const errs = {}
    if (!form.name.trim()) errs.name = '이름을 입력하세요.'
    if (!form.email) errs.email = '이메일을 입력하세요.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = '올바른 이메일 형식이 아닙니다.'
    if (!form.password) errs.password = '비밀번호를 입력하세요.'
    else if (form.password.length < 8) errs.password = '비밀번호는 8자 이상이어야 합니다.'
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    if (!agree.terms && !agree.privacy) errs.agree = '필수 약관에 동의해 주세요.'
    else if (!agree.terms) errs.agree = '이용약관에 동의해 주세요.'
    else if (!agree.privacy) errs.agree = '개인정보 처리방침에 동의해 주세요.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setIsLoading(true)
    await signup({ ...form, role: selectedRole })
    setIsLoading(false)
  }

  if (step === 1) {
    return (
      <>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">역할을 선택하세요</h2>
        <p className="text-sm text-zinc-500 mb-6">학원에서 어떤 역할을 맡고 있나요?</p>
        <div className="space-y-3">
          {ROLE_ITEMS.map(({ role, label, desc, icon: Icon }) => (
            <button
              key={role}
              type="button"
              onClick={() => { setSelectedRole(role); setStep(2) }}
              className={[
                'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                selectedRole === role
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-zinc-200 hover:border-primary-300 hover:bg-primary-50/50',
              ].join(' ')}
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="font-semibold text-zinc-800">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-500 text-center mt-6">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-primary-700 font-medium hover:underline">로그인</Link>
        </p>
      </>
    )
  }

  const roleMeta = ROLE_ITEMS.find((r) => r.role === selectedRole)

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← 뒤로
        </button>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">회원가입</h2>
          <p className="text-xs text-zinc-500">{roleMeta?.label || ''} 계정</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="name"
          label="이름"
          placeholder="이름을 입력하세요"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          error={errors.name}
          required
          disabled={isLoading}
        />
        <Input
          id="email"
          label="이메일"
          type="email"
          placeholder="example@claiq.io"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          error={errors.email}
          required
          disabled={isLoading}
        />
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="8자 이상"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          error={errors.password}
          required
          disabled={isLoading}
        />
        <Input
          id="passwordConfirm"
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={form.passwordConfirm}
          onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
          error={errors.passwordConfirm}
          required
          disabled={isLoading}
        />
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree.terms}
              onChange={(e) => setAgree((p) => ({ ...p, terms: e.target.checked }))}
              disabled={isLoading}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <span className="text-sm text-zinc-600">
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="text-primary-700 hover:underline"
              >
                이용약관
              </a>
              에 동의합니다 <span className="text-zinc-400">(필수)</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree.privacy}
              onChange={(e) => setAgree((p) => ({ ...p, privacy: e.target.checked }))}
              disabled={isLoading}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <span className="text-sm text-zinc-600">
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-primary-700 hover:underline"
              >
                개인정보 처리방침
              </a>
              에 동의합니다 <span className="text-zinc-400">(필수)</span>
            </span>
          </label>
          {errors.agree && (
            <p className="text-xs text-red-500">{errors.agree}</p>
          )}
        </div>
        <Button type="submit" loading={isLoading} className="w-full mt-2">
          {ROLE_LABELS[selectedRole] || ''}로 가입하기
        </Button>
      </form>
    </>
  )
}
