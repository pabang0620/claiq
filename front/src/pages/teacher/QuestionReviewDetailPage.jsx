import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useQuestionStore } from '../../store/questionStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { DIFFICULTY_LEVELS } from '../../constants/questionTypes.js'

const DIFFICULTY_OPTIONS = DIFFICULTY_LEVELS.map((d) => ({ value: d.code, label: d.label }))

export default function QuestionReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentQuestion, isLoading, error, fetchQuestionById, reviewQuestion } = useQuestionStore()
  const addToast = useUIStore((s) => s.addToast)

  const [content, setContent] = useState('')
  const [options, setOptions] = useState([])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState('B')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchQuestionById(id)
  }, [id, fetchQuestionById])

  useEffect(() => {
    if (currentQuestion) {
      setContent(currentQuestion.content || '')
      setOptions(currentQuestion.options || [])
      setCorrectAnswer(String(currentQuestion.correctAnswer || ''))
      setExplanation(currentQuestion.explanation || '')
      setDifficulty(currentQuestion.difficulty || 'B')
    }
  }, [currentQuestion])

  async function handleAction(action) {
    setIsSaving(true)
    try {
      const result = await reviewQuestion(id, action, {
        content,
        options,
        correctAnswer,
        explanation,
        difficulty,
      })
      if (result.success) {
        const labels = { approve: '승인', reject: '반려' }
        addToast({ type: 'success', message: `문제가 ${labels[action]}됐습니다.` })
        navigate('/teacher/review')
      } else {
        addToast({ type: 'error', message: result.error || '처리에 실패했습니다.' })
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || '처리 중 오류가 발생했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageSpinner />
  if (error) return <div className="text-red-500 p-4">{error}</div>
  if (!currentQuestion) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/teacher/review')}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">문제 상세 검토</h1>
          <div className="flex gap-2 mt-1">
            <Badge label={currentQuestion.typeName || currentQuestion.typeCode} variant="primary" />
            <Badge label={currentQuestion.type === 'multiple_choice' ? '5지선다' : '단답형'} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
        <Textarea
          id="content"
          label="문제 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />

        <Select
          id="difficulty"
          label="난이도"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={DIFFICULTY_OPTIONS}
        />

        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">선택지</p>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-500 w-5 flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  value={opt.text}
                  onChange={(e) => {
                    const next = options.map((o, idx) =>
                      idx === i ? { ...o, text: e.target.value } : o
                    )
                    setOptions(next)
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder={`${i + 1}번 선택지`}
                />
                <input
                  type="radio"
                  name="correct"
                  value={String(opt.label || i + 1)}
                  checked={correctAnswer === String(opt.label || i + 1)}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="accent-primary-600"
                  aria-label={`${i + 1}번이 정답`}
                />
              </div>
            ))}
          </div>
        )}

        {currentQuestion.type === 'short_answer' && (
          <Input
            id="correctAnswer"
            label="정답"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="단답형 정답을 입력하세요"
          />
        )}

        <Textarea
          id="explanation"
          label="해설"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          placeholder="문제 해설을 입력하세요"
        />
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={() => handleAction('approve')}
          loading={isSaving}
        >
          <CheckCircle size={16} />
          저장 및 승인
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => handleAction('reject')}
          disabled={isSaving}
        >
          <XCircle size={16} />
          반려
        </Button>
      </div>
    </div>
  )
}
