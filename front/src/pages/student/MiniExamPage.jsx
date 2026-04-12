import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuizCard } from '../../components/student/QuizCard.jsx'
import { QuizTimer } from '../../components/student/QuizTimer.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useExamStore } from '../../store/examStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { lectureApi } from '../../api/lecture.api.js'
import { formatDate } from '../../utils/formatDate.js'

const MAX_SELECT = 4

function LectureSelectView({ onStart }) {
  const [lectures, setLectures] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    const ac = new AbortController()
    const load = async () => {
      setIsFetching(true)
      setFetchError(null)
      try {
        const res = await lectureApi.getList({ limit: 20 })
        const all = Array.isArray(res.data) ? res.data : []
        setLectures(all.filter((l) => l.processing_status === 'done'))
      } catch (err) {
        if (!ac.signal.aborted) {
          setFetchError(err?.message || '강의 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!ac.signal.aborted) setIsFetching(false)
      }
    }
    load()
    return () => ac.abort()
  }, [])

  function toggleLecture(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECT) return prev
      return [...prev, id]
    })
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <PageSpinner />
        <p className="text-sm text-zinc-500">강의 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-red-500 text-sm">{fetchError}</p>
        <Button onClick={() => setFetchError(null)}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">미니 모의고사</h1>
        <p className="text-sm text-zinc-500 mt-1">
          문제를 출제할 강의를 선택하세요 (최대 {MAX_SELECT}개)
        </p>
      </div>

      {lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-zinc-500 text-sm">출제 가능한 강의가 없습니다.</p>
          <p className="text-zinc-400 text-xs">강의 처리가 완료된 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lectures.map((lecture) => {
            const isSelected = selected.includes(lecture.id)
            const isDisabled = !isSelected && selected.length >= MAX_SELECT

            return (
              <div
                key={lecture.id}
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
                className={[
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                ].join(' ')}
                onClick={() => !isDisabled && toggleLecture(lecture.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                    e.preventDefault()
                    toggleLecture(lecture.id)
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => {}}
                  className="mt-0.5 accent-primary-600 w-4 h-4 flex-shrink-0"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-zinc-800 truncate">{lecture.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {lecture.subject_name}
                    {lecture.subject_name && ' · '}
                    {formatDate(lecture.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lectures.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-400">
            {selected.length === 0
              ? '강의를 1개 이상 선택해 주세요'
              : `${selected.length}개 선택됨`}
          </span>
          <Button disabled={selected.length === 0} onClick={() => onStart(selected)}>
            시험 시작
          </Button>
        </div>
      )}
    </div>
  )
}

export default function MiniExamPage() {
  const navigate = useNavigate()
  const { currentExam, answers, isGenerating, isSubmitted, generateExam, setAnswer, submitExam, resetExam } = useExamStore()
  const addToast = useUIStore((s) => s.addToast)
  const showConfirm = useUIStore((s) => s.showConfirm)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasError, setHasError] = useState(false)

  // 마운트 시 제출 완료된 이전 시험 정리
  useEffect(() => {
    if (isSubmitted) resetExam()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart(lectureIds) {
    setHasError(false)
    setCurrentIndex(0)
    try {
      await generateExam(lectureIds)
    } catch (err) {
      setHasError(true)
      addToast({ type: 'error', message: err?.message || '모의고사 생성에 실패했습니다.' })
    }
  }

  async function handleNewExam() {
    const ok = await showConfirm('현재 풀던 문제는 사라집니다.\n새로운 문제를 생성할까요?', {
      confirmLabel: '새로 생성',
      danger: false,
    })
    if (!ok) return
    setCurrentIndex(0)
    setHasError(false)
    resetExam()
  }

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

  // 강의 선택 화면
  if (!currentExam && !isGenerating && !hasError) {
    return <LectureSelectView onStart={handleStart} />
  }

  // 생성 중 로딩
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
            resetExam()
          }}
        >
          강의 다시 선택
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
        <div className="flex items-center gap-2">
          {answeredCount > 0 && !isSubmitted && (
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              이어풀기 중 ({answeredCount}/{questions.length})
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewExam}
            disabled={isSubmitting}
          >
            새 문제 생성
          </Button>
          <QuizTimer onTimeUp={() => handleSubmit(true)} />
        </div>
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
