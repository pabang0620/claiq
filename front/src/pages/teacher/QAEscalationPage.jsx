import { useEffect, useState } from 'react'
import { EscalationItem } from '../../components/teacher/EscalationItem.jsx'
import { Tabs } from '../../components/ui/Tabs.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { qaApi } from '../../api/qa.api.js'
import { useUIStore } from '../../store/uiStore.js'

const TABS = [
  { value: 'unanswered', label: '미답변' },
  { value: 'answered', label: '답변 완료' },
]

export default function QAEscalationPage() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('unanswered')
  const [answeringId, setAnsweringId] = useState(null)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    setIsLoading(true)
    qaApi
      .getEscalations({ answered: activeTab === 'answered' })
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false))
  }, [activeTab])

  async function handleAnswer(id, answer) {
    setAnsweringId(id)
    try {
      await qaApi.answerEscalation(id, answer)
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, answered: true, teacherAnswer: answer } : item
        )
      )
      addToast({ type: 'success', message: '답변이 등록됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message || '답변 등록에 실패했습니다.' })
    } finally {
      setAnsweringId(null)
    }
  }

  const tabsWithCount = TABS.map((t) =>
    t.value === 'unanswered' ? { ...t, count: items.filter((i) => !i.answered).length } : t
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">질문 에스컬레이션</h1>
        <p className="text-zinc-500 text-sm mt-1">
          AI가 답변하지 못한 질문에 직접 답변해주세요.
        </p>
      </div>

      <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg font-medium">
            {activeTab === 'unanswered' ? '미답변 질문이 없습니다.' : '답변한 질문이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <EscalationItem
              key={item.id}
              item={item}
              onAnswer={handleAnswer}
              isLoading={answeringId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
