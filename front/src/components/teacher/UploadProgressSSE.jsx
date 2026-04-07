import { ProgressBar } from '../ui/ProgressBar.jsx'
import { CheckCircle, Loader2, Clock } from 'lucide-react'

const STEPS = [
  { key: 'stt', label: '음성 인식 (STT)', desc: '강의 내용을 텍스트로 변환 중' },
  { key: 'embedding', label: '임베딩 생성', desc: '의미 벡터를 생성 중' },
  { key: 'type_mapping', label: '수능 유형 매핑', desc: '수능 유형 코드를 분류 중' },
  { key: 'question_gen', label: '문제 생성', desc: 'AI가 문제를 생성 중' },
]

function StepItem({ step, currentStep, progress }) {
  const stepIndex = STEPS.findIndex((s) => s.key === step.key)
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  let state = 'pending'
  if (stepIndex < currentIndex) state = 'done'
  else if (stepIndex === currentIndex) state = 'active'

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {state === 'done' ? (
          <CheckCircle size={20} className="text-emerald-500" />
        ) : state === 'active' ? (
          <Loader2 size={20} className="text-primary-600 animate-spin" />
        ) : (
          <Clock size={20} className="text-zinc-300" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={[
            'text-sm font-medium',
            state === 'done'
              ? 'text-emerald-600'
              : state === 'active'
              ? 'text-primary-700'
              : 'text-zinc-400',
          ].join(' ')}
        >
          {step.label}
        </p>
        <p className="text-xs text-zinc-400">{step.desc}</p>
        {state === 'active' && (
          <div className="mt-2">
            <ProgressBar value={progress} color="primary" showPercent animated />
          </div>
        )}
      </div>
    </div>
  )
}

export function UploadProgressSSE({
  isActive = false,
  currentStep = null,
  stepProgress = 0,
  questionCount = null,
  uploadProgress = 0,
}) {
  const isDone = currentStep === null && questionCount !== null

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800">
          {isDone ? '처리 완료!' : isActive ? '강의 처리 중...' : '업로드 진행률'}
        </h3>
        {isDone && questionCount !== null && (
          <span className="text-sm text-emerald-600 font-medium">{questionCount}개 문제 생성됨</span>
        )}
      </div>

      {!isActive && !isDone && (
        <ProgressBar value={uploadProgress} label="업로드" showPercent color="primary" />
      )}

      {(isActive || isDone) && (
        <div className="space-y-4">
          {STEPS.map((step) => (
            <StepItem
              key={step.key}
              step={step}
              currentStep={isDone ? null : currentStep}
              progress={currentStep === step.key ? stepProgress : 0}
            />
          ))}
        </div>
      )}

      {isDone && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm text-emerald-700 font-medium">
            처리가 완료됐습니다. 문제 검증 페이지에서 확인하세요.
          </p>
        </div>
      )}
    </div>
  )
}
