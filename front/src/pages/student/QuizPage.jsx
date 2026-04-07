import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuizCard } from '../../components/student/QuizCard.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useQuestionStore } from '../../store/questionStore.js'
import { useUIStore } from '../../store/uiStore.js'

export default function QuizPage() {
  const navigate = useNavigate()
  const { todayQuiz, isLoading, error, fetchTodayQuiz, submitAnswer } = useQuestionStore()
  const addToast = useUIStore((s) => s.addToast)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submittedResults, setSubmittedResults] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    fetchTodayQuiz()
  }, [fetchTodayQuiz])

  const currentQuestion = todayQuiz[currentIndex]
  const isLastQuestion = currentIndex === todayQuiz.length - 1
  const currentResult = submittedResults[currentQuestion?.id]
  const isCurrentSubmitted = !!currentResult

  async function handleSubmitCurrent() {
    const answer = answers[currentQuestion.id]
    if (!answer) return
    setIsSubmitting(true)
    try {
      const result = await submitAnswer(currentQuestion.id, answer)
      setSubmittedResults((prev) => ({ ...prev, [currentQuestion.id]: result }))
    } catch {
      addToast({ type: 'error', message: '제출에 실패했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      navigate('/student/quiz/result', {
        state: { answers, results: submittedResults, questions: todayQuiz },
      })
    } else {
      setCurrentIndex((p) => p + 1)
    }
  }

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTodayQuiz} className="mt-3">
          다시 시도
        </Button>
      </div>
    )
  }

  if (!todayQuiz.length) {
    return (
      <div className="text-center py-16 text-zinc-400">
        <p className="text-lg font-medium">오늘의 문제가 없습니다.</p>
        <p className="text-sm mt-2">강의가 업로드되면 문제가 생성됩니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-zinc-900">오늘의 문제</h1>
          <span className="text-sm text-zinc-500">
            {currentIndex + 1} / {todayQuiz.length}
          </span>
        </div>
        <ProgressBar
          value={((currentIndex + (isCurrentSubmitted ? 1 : 0)) / todayQuiz.length) * 100}
          color="primary"
        />
      </div>

      {/* Question */}
      <QuizCard
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id]}
        onAnswer={(answer) =>
          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
        }
        isSubmitted={isCurrentSubmitted}
        correctAnswer={currentResult?.correctAnswer}
        explanation={currentResult?.explanation}
      />

      {/* Actions */}
      <div className="flex gap-3">
        {!isCurrentSubmitted ? (
          <Button
            className="flex-1"
            onClick={handleSubmitCurrent}
            loading={isSubmitting}
            disabled={!answers[currentQuestion.id]}
          >
            제출
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleNext}>
            {isLastQuestion ? '결과 보기' : '다음 문제'}
          </Button>
        )}
        {currentIndex > 0 && !isCurrentSubmitted && (
          <Button variant="outline" onClick={() => setCurrentIndex((p) => p - 1)}>
            이전
          </Button>
        )}
      </div>
    </div>
  )
}
