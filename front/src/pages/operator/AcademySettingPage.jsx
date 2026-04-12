import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { academyApi } from '../../api/academy.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { Settings, Plus, Trash2, Gift, GraduationCap, UserCheck, X } from 'lucide-react'
import { POINT_EVENT_LABELS } from '../../constants/points.js'

function formatDate(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function AcademySettingPage() {
  const [academy, setAcademy] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [couponForm, setCouponForm] = useState({ name: '', discountType: 'percent', discountValue: '', validDays: 30, awardCondition: '' })
  const [awardTargetId, setAwardTargetId] = useState(null)
  const addToast = useUIStore((s) => s.addToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  useEffect(() => {
    Promise.all([academyApi.getMe(), academyApi.getCoupons(), academyApi.getMembers()])
      .then(([aRes, cRes, mRes]) => {
        const a = aRes.data
        setAcademy(a)
        setForm({ name: a.name || '', code: a.code || '', description: a.description || '' })
        setCoupons(cRes.data || [])
        const students = (mRes.data || []).filter((m) => m.role === 'student')
        setMembers(students)
      })
      .catch((err) => {
        addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSaveAcademy(e) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await academyApi.updateMe(form)
      setAcademy(res.data)
      addToast({ type: 'success', message: '학원 정보가 저장됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '저장에 실패했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault()
    try {
      const res = await academyApi.createCoupon({
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        validDays: Number(couponForm.validDays),
      })
      setCoupons((prev) => [res.data, ...prev])
      setCouponForm({ name: '', discountType: 'percent', discountValue: '', validDays: 30, awardCondition: '' })
      addToast({ type: 'success', message: '쿠폰이 생성됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '쿠폰 생성에 실패했습니다.' })
    }
  }

  async function handleDeleteCoupon(id) {
    const coupon = coupons.find((c) => c.id === id)
    const message = coupon?.awarded_to
      ? '이미 수여된 쿠폰입니다. 삭제하시겠습니까?'
      : '쿠폰을 삭제하시겠습니까?'
    const ok = await showConfirm(message, { confirmLabel: '삭제', danger: true })
    if (!ok) return
    try {
      await academyApi.deleteCoupon(id)
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      addToast({ type: 'success', message: '쿠폰이 삭제됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '삭제에 실패했습니다.' })
    }
  }

  async function handleAwardCoupon(couponId, studentId) {
    try {
      const res = await academyApi.awardCoupon(couponId, studentId)
      setCoupons((prev) => prev.map((c) => c.id === couponId ? res.data : c))
      setAwardTargetId(null)
      addToast({ type: 'success', message: '장학금이 수여됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '수여에 실패했습니다.' })
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">학원 설정</h1>
        <p className="text-zinc-500 text-sm mt-1">학원 기본 정보와 쿠폰 정책을 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* Academy info */}
      <Card title="학원 기본 정보">
        <form onSubmit={handleSaveAcademy} className="space-y-4">
          <Input
            id="academy-name"
            label="학원명"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-1">학원 코드</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-sm font-mono font-bold text-zinc-700 tracking-widest">
                {form.code || '-'}
              </span>
              <p className="text-xs text-zinc-400">수강생에게 공유하세요</p>
            </div>
          </div>
          <Input
            id="academy-desc"
            label="학원 소개"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Button type="submit" loading={isSaving}>
            <Settings size={14} />
            저장
          </Button>
        </form>
      </Card>

      {/* Coupons */}
      <Card title="쿠폰 관리">
        {/* Create coupon */}
        <form onSubmit={handleCreateCoupon} className="space-y-3 mb-5 pb-5 border-b border-zinc-100">
          <p className="text-sm font-medium text-zinc-700">새 쿠폰 생성</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="coupon-name"
              label="쿠폰명"
              placeholder="예: 신학기 10% 할인"
              value={couponForm.name}
              onChange={(e) => setCouponForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-1">할인 유형</p>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm((p) => ({ ...p, discountType: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percent">퍼센트 (%)</option>
                <option value="fixed">고정 금액 (원)</option>
              </select>
            </div>
            <Input
              id="coupon-value"
              label="할인값"
              type="number"
              placeholder={couponForm.discountType === 'percent' ? '10' : '5000'}
              value={couponForm.discountValue}
              onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))}
              hint={couponForm.discountType === 'percent' ? '% 입력 (예: 30)' : '원 입력 (예: 5000)'}
              required
            />
            <Input
              id="coupon-valid-days"
              label="유효 기간 (일)"
              type="number"
              placeholder="30"
              value={couponForm.validDays}
              onChange={(e) => setCouponForm((p) => ({ ...p, validDays: Number(e.target.value) }))}
              hint="발급일 기준 만료일수"
              required
            />
            <div className="col-span-2">
              <p className="text-sm font-medium text-zinc-700 mb-1">장학 조건 <span className="text-zinc-400 font-normal">(선택)</span></p>
              <input
                type="text"
                placeholder="예: 모의고사 10등 이내, 출석률 95% 이상"
                value={couponForm.awardCondition}
                onChange={(e) => setCouponForm((p) => ({ ...p, awardCondition: e.target.value }))}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-400 mt-1">입력하면 장학금 쿠폰으로 표시됩니다</p>
            </div>
          </div>
          <Button type="submit" size="sm" variant="outline">
            <Plus size={14} />
            쿠폰 생성
          </Button>
        </form>

        {/* Coupon list */}
        {coupons.length === 0 ? (
          <div className="text-center py-6 text-zinc-400">
            <Gift size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">생성된 쿠폰이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {coupons.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-medium text-zinc-800">{c.name}</p>
                      {c.award_condition && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
                          <GraduationCap size={10} />
                          장학금
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {c.discount_type === 'percent'
                          ? `${c.discount_amount}%`
                          : `${Number(c.discount_amount).toLocaleString()}원`}
                        {c.expires_at && ` · ${formatDate(c.expires_at)}`}
                      </span>
                    </div>
                    {c.award_condition && (
                      <p className="text-xs text-amber-600 truncate">조건: {c.award_condition}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {c.award_condition && (
                      c.awarded_to ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded font-medium">
                          <UserCheck size={11} />
                          수여완료
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAwardTargetId(awardTargetId === c.id ? null : c.id)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors font-medium"
                        >
                          <GraduationCap size={11} />
                          수여
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.id)}
                      aria-label="쿠폰 삭제"
                      className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inline student selector */}
                {awardTargetId === c.id && (
                  <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-amber-800">장학금 수여할 학생 선택</p>
                      <button
                        type="button"
                        onClick={() => setAwardTargetId(null)}
                        aria-label="닫기"
                        className="text-amber-600 hover:text-amber-800 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {members.length === 0 ? (
                      <p className="text-xs text-amber-600">등록된 학생이 없습니다.</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {members.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleAwardCoupon(c.id, student.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                          >
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-xs flex-shrink-0">
                              {student.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-800 truncate">{student.name}</p>
                              <p className="text-xs text-zinc-400 truncate">{student.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
