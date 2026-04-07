import { Badge } from '../ui/Badge.jsx'

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤']
const DIFFICULTY_VARIANT = { A: 'danger', B: 'warning', C: 'success' }
const DIFFICULTY_LABEL = { A: '상', B: '중', C: '하' }

export function QuizCard({
  question,
  selectedAnswer,
  onAnswer,
  isSubmitted = false,
  correctAnswer,
  explanation,
}) {
  const isMultiple = question.type === 'multiple_choice'

  function getOptionStyle(optLabel) {
    if (!isSubmitted) {
      return selectedAnswer === String(optLabel)
        ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium'
        : 'border-zinc-200 bg-white text-zinc-700 hover:border-primary-300 hover:bg-primary-50/50'
    }
    const isCorrect = String(optLabel) === String(correctAnswer)
    const isSelected = String(optLabel) === String(selectedAnswer)
    if (isCorrect) return 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium'
    if (isSelected && !isCorrect) return 'border-red-400 bg-red-50 text-red-700'
    return 'border-zinc-200 bg-white text-zinc-400'
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2 flex-wrap">
        <Badge label={question.typeName || question.typeCode} variant="primary" />
        <Badge
          label={`난이도 ${DIFFICULTY_LABEL[question.difficulty] || question.difficulty}`}
          variant={DIFFICULTY_VARIANT[question.difficulty] || 'default'}
        />
        <Badge label={isMultiple ? '5지선다' : '단답형'} />
      </div>

      {/* Question */}
      <div className="px-5 py-5">
        <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
          {question.content}
        </p>
      </div>

      {/* Options */}
      <div className="px-5 pb-5 space-y-2">
        {isMultiple && question.options?.map((opt, i) => (
          <button
            key={opt.label || i}
            type="button"
            onClick={() => !isSubmitted && onAnswer(String(opt.label || i + 1))}
            disabled={isSubmitted}
            aria-pressed={selectedAnswer === String(opt.label || i + 1)}
            aria-label={`${i + 1}번: ${opt.text}`}
            className={[
              'w-full flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left',
              getOptionStyle(opt.label || i + 1),
              isSubmitted ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]',
            ].join(' ')}
          >
            <span className="flex-shrink-0 font-bold text-sm">{CIRCLE_NUMS[i]}</span>
            <span className="text-sm leading-relaxed">{opt.text}</span>
          </button>
        ))}

        {!isMultiple && (
          <input
            type="text"
            value={selectedAnswer || ''}
            onChange={(e) => !isSubmitted && onAnswer(e.target.value)}
            disabled={isSubmitted}
            placeholder="정답을 입력하세요"
            className={[
              'w-full px-4 py-3 rounded-lg border-2 text-sm outline-none transition-all duration-150',
              isSubmitted ? 'cursor-default bg-zinc-50' : 'focus:border-primary-500',
              'border-zinc-200',
            ].join(' ')}
            aria-label="단답형 정답 입력"
          />
        )}
      </div>

      {/* Explanation (after submit) */}
      {isSubmitted && explanation && (
        <div className="px-5 pb-5">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">해설</p>
            <p className="text-sm text-blue-800 leading-relaxed">{explanation}</p>
            {correctAnswer && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                정답: {CIRCLE_NUMS[Number(correctAnswer) - 1] || correctAnswer}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
