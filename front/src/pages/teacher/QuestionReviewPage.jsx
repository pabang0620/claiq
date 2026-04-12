import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QuestionCard } from '../../components/teacher/QuestionCard.jsx'
import { Tabs } from '../../components/ui/Tabs.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useQuestionStore } from '../../store/questionStore.js'
import { useUIStore } from '../../store/uiStore.js'

const TABS = [
  { value: 'pending', label: '검증 대기' },
  { value: 'approved', label: '승인됨' },
  { value: 'rejected', label: '반려됨' },
]

export default function QuestionReviewPage() {
  const { pendingQuestions, isLoading, error, pagination, fetchPendingQuestions, reviewQuestion } = useQuestionStore()
  const addToast = useUIStore((s) => s.addToast)
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewingId, setReviewingId] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchPendingQuestions({ status: activeTab, page })
  }, [activeTab, page, fetchPendingQuestions])

  async function handleReview(id, action, editedData) {
    setReviewingId(id)
    try {
      const result = await reviewQuestion(id, action, editedData)
      setReviewingId(null)
      if (result.success) {
        const labels = { approve: '승인', edit: '수정 후 승인', reject: '반려' }
        addToast({ type: 'success', message: `문제가 ${labels[action]}됐습니다.` })
      } else {
        addToast({ type: 'error', message: result.error || '요청 처리에 실패했습니다.' })
      }
    } catch (err) {
      setReviewingId(null)
      addToast({ type: 'error', message: err?.message || '요청 처리에 실패했습니다.' })
    }
  }

  const tabsWithCount = TABS.map((t) =>
    t.value === 'pending' ? { ...t, count: pagination.total } : t
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">문제 검증</h1>
        <p className="text-zinc-500 text-sm mt-1">AI가 생성한 문제를 검토하고 승인 또는 반려하세요.</p>
      </div>

      <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={(v) => { setActiveTab(v); setPage(1) }} />

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : pendingQuestions.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg font-medium">
            {activeTab === 'pending' ? '검증 대기 중인 문제가 없습니다.' : '문제가 없습니다.'}
          </p>
          {activeTab === 'pending' && (
            <p className="text-sm mt-2">강의를 업로드하면 AI가 문제를 생성합니다.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onReview={handleReview}
                isLoading={reviewingId === q.id}
              />
            ))}
          </div>

          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-zinc-500">
                총 {pagination.total}개 중 {(page - 1) * pagination.limit + 1}~
                {Math.min(page * pagination.limit, pagination.total)}개
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * pagination.limit >= pagination.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
