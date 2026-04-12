import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuizCard } from '../../components/student/QuizCard.jsx'
import { QuizTimer } from '../../components/student/QuizTimer.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useExamStore } from '../../store/examStore.js'
import { useUIStore } from '../../store/uiStore.js'

export default function MiniExamPage() {
  const navigate = useNavigate()
  const { currentExam, answers, isGenerating, isSubmitted, generateExam, setAnswer, submitExam, resetExam } = useExamStore()
  const addToast = useUIStore((s) => s.addToast)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [hasError, setHasError] = useState(false)
  const isSubmittedRef = useRef(isSubmitted)
  isSubmittedRef.current = isSubmitted

  useEffect(() => {
    if (!currentExam && !isGenerating && !hasError) {
      generateExam().catch((err) => {
        setHasError(true)
        addToast({ type: 'error', message: err?.message || '모의고사 생성에 실패했습니다.' })
      })
    }
  }, [currentExam, isGenerating, hasError, generateExam, addToast])

  useEffect(() => {
    return () => {
      if (!isSubmittedRef.current) resetExam()
    }
  }, [resetExam])

  async function handleSubmit(isAutoSubmit = false) {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const report = await submitExam()
      addToast({ type: 'success', message: isAutoSubmit ? '시간이 종료되어 자동 제출됐습니다.' : '모의고사가 제출됐습니다.' })
      navigate(`/student/exam/result/${currentExam.id}`, { state: { report } })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '제출에 실패했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isGenerating || (!currentExam && !hasError)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
          <PageSpinner />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-base font-semibold text-zinc-800">문제를 생성 중입니다</p>
          <p className="text-sm text-zinc-500">AI가 약점 유형을 분석해 맞춤형 문제를 만들고 있어요.</p>
          <p className="text-xs text-zinc-400">30초~1분 정도 걸릴 수 있습니다.</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-red-500">모의고사 생성에 실패했습니다.</p>
        <Button
          onClick={() => {
            setHasError(false)
          }}
        >
          다시 시도
        </Button>
      </div>
    )
  }

  if (!currentExam) return null

  const questions = currentExam.questions || []
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">미니 모의고사</h1>
          <p className="text-zinc-500 text-sm">{questions.length}문항 · 20분</p>
        </div>
        <QuizTimer onTimeUp={() => handleSubmit(true)} />
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500">{currentIndex + 1}/{questions.length}번 문제</span>
          <span className="text-xs text-zinc-500">
            {answeredCount}/{questions.length} 답변 완료
          </span>
        </div>
        <ProgressBar value={progress} color="primary" />
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`${i + 1}번 문제`}
            aria-current={i === currentIndex ? 'true' : undefined}
            className={[
              'w-8 h-8 rounded-lg text-xs font-medium transition-all',
              i === currentIndex
                ? 'bg-primary-700 text-white'
                : answers[q.id]
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-white text-zinc-500 border border-zinc-200 hover:border-primary-200',
            ].join(' ')}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      {currentQuestion && (
        <QuizCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((p) => p - 1)}
        >
          이전
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrentIndex((p) => p + 1)}>
            다음
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={() => handleSubmit(false)}
            loading={isSubmitting}
          >
            제출하기 ({answeredCount}/{questions.length})
          </Button>
        )}
      </div>
    </div>
  )
}
