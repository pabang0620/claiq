import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { academyApi } from '../../api/academy.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { GraduationCap, Trophy } from 'lucide-react'

function formatDate(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function isExpired(expiresAt) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export default function ScholarshipPage() {
  const [scholarships, setScholarships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    const ac = new AbortController()
    academyApi.getMyScholarships()
      .then((res) => {
        setScholarships(res.data || [])
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return
        addToast({ type: 'error', message: err?.message || '장학금 정보를 불러오는 데 실패했습니다.' })
      })
      .finally(() => setIsLoading(false))
    return () => ac.abort()
  }, [])

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">장학금</h1>
        <p className="text-zinc-500 text-sm mt-1">학원에서 수여받은 장학금 쿠폰을 확인합니다.</p>
      </div>

      {scholarships.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-zinc-400">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-zinc-500">아직 받은 장학금이 없습니다.</p>
            <p className="text-xs text-zinc-400 mt-1">열심히 공부해서 장학금을 받아보세요! 🎓</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {scholarships.map((s) => {
            const expired = isExpired(s.expires_at)
            return (
              <div
                key={s.id}
                className={[
                  'p-4 bg-white border rounded-xl shadow-sm',
                  expired
                    ? 'opacity-60 border-zinc-200'
                    : 'border-amber-200 bg-amber-50/30',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div className={[
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    expired ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-100 text-amber-600',
                  ].join(' ')}>
                    <GraduationCap size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={[
                        'text-sm font-semibold',
                        expired ? 'line-through text-zinc-400' : 'text-zinc-900',
                      ].join(' ')}>
                        {s.name}
                      </p>
                      {expired && (
                        <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                          만료
                        </span>
                      )}
                      {!expired && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                          <Trophy size={10} />
                          사용 가능
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 mt-0.5">
                      {s.discount_type === 'percent'
                        ? `${s.discount_amount}% 할인`
                        : `${Number(s.discount_amount).toLocaleString()}원 할인`}
                    </p>

                    {s.award_condition && (
                      <p className="text-xs text-amber-700 mt-1">
                        장학 조건: {s.award_condition}
                      </p>
                    )}

                    {s.academy_name && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        발급: {s.academy_name}
                      </p>
                    )}

                    {s.expires_at && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        만료일: {formatDate(s.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
