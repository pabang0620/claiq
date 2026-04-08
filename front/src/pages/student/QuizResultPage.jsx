import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, RotateCcw, Map } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export default function QuizResultPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state?.questions) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">결과 데이터가 없습니다.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/student/quiz')} className="mt-3">
          문제 풀러 가기
        </Button>
      </div>
    )
  }

  const { questions, answers, results } = state
  const submitted = Object.keys(results).length
  const correct = Object.values(results).filter((r) => r.isCorrect ?? r.is_correct).length
  const correctRate = submitted > 0 ? Math.round((correct / submitted) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score */}
      <Card>
        <div className="text-center py-4">
          <div
            className={[
              'inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-black mb-3',
              correctRate >= 80
                ? 'bg-emerald-100 text-emerald-700'
                : correctRate >= 60
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700',
            ].join(' ')}
          >
            {correctRate}%
          </div>
          <h1 className="text-xl font-bold text-zinc-900">오늘의 문제 결과</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {submitted}문제 중 {correct}문제 정답
          </p>

          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{correct}</p>
              <p className="text-xs text-zinc-500">정답</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{submitted - correct}</p>
              <p className="text-xs text-zinc-500">오답</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-400">{questions.length - submitted}</p>
              <p className="text-xs text-zinc-500">미제출</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Per question */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const result = results[q.id]
          const answered = answers[q.id]
          const isCorrect = result?.isCorrect ?? result?.is_correct
          return (
            <div
              key={q.id}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border',
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200'
                  : result && !isCorrect
                  ? 'bg-red-50 border-red-200'
                  : 'bg-zinc-50 border-zinc-200',
              ].join(' ')}
            >
              {isCorrect ? (
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-zinc-500">#{i + 1}</span>
                  <Badge label={q.typeName || q.typeCode} variant="primary" size="sm" />
                </div>
                <p className="text-sm text-zinc-700 truncate">{q.content}</p>
                {result && !isCorrect && (result.correctAnswer || result.correct_answer) && (
                  <p className="text-xs text-red-600 mt-1">
                    정답: {result.correctAnswer ?? result.correct_answer}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => navigate('/student/quiz')}>
          <RotateCcw size={15} />
          다시 풀기
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate('/student/weak')}>
          약점 분석 보기
        </Button>
      </div>
    </div>
  )
}
