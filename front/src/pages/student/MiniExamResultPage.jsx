import { useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { WeakTypeChart } from '../../components/student/WeakTypeChart.jsx'
import { useExamStore } from '../../store/examStore.js'
import { getScoreColor } from '../../constants/colors.js'

function ScoreRing({ score, total }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const color = getScoreColor(pct)
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e4e4e7" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="50" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${2 * Math.PI * 50}`}
          strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black" style={{ color }}>{pct}%</p>
        <p className="text-xs text-zinc-400">{score}/{total}</p>
      </div>
    </div>
  )
}

export default function MiniExamResultPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { report, isLoading, fetchReport, resetExam } = useExamStore()

  useEffect(() => {
    if (!state?.report) fetchReport(id)
    return () => resetExam()
  }, [id, state?.report, fetchReport, resetExam])

  const raw = state?.report || report

  if (isLoading && !raw) return <PageSpinner />
  if (!raw) return (
    <div className="text-center py-12 text-zinc-400">
      <p>리포트를 불러올 수 없습니다.</p>
      <Button variant="outline" size="sm" onClick={() => navigate('/student/exam')} className="mt-3">
        새 모의고사 시작
      </Button>
    </div>
  )

  // Normalize: backend can return { exam, submissions, totalScore } (submit) or { exam, questions, typeAnalysis } (report endpoint)
  const examRow = raw.exam || raw
  const submissions = raw.submissions || raw.questions || []
  const typeAnalysisMap = raw.typeAnalysis || {}

  const correctCount = raw.correctCount
    ?? raw.correct_count
    ?? submissions.filter((s) => s.is_correct).length

  const totalCount = raw.totalCount
    ?? raw.total_count
    ?? examRow?.total_questions
    ?? (submissions.length || 15)

  const score = raw.score ?? raw.totalScore ?? examRow?.score ?? 0

  // Build typeStats from typeAnalysis map or typeStats array
  const rawTypeStats = raw.typeStats || raw.type_stats
    || Object.entries(typeAnalysisMap).map(([code, v]) => ({
        typeCode: code,
        typeName: v.type_name ?? code,
        correctRate: v.total > 0 ? v.correct / v.total : 0,
        totalCount: v.total,
      }))

  const data = {
    correctCount,
    totalCount,
    score,
    typeStats: rawTypeStats,
    weakTypes: raw.weakTypes || raw.weak_types || [],
    aiFeedback: raw.aiFeedback || raw.ai_feedback,
  }

  const typeData = data.typeStats.map((t) => {
    const name = t.typeName ?? t.type_name ?? ''
    return {
      typeName: name.length > 6 ? name.slice(0, 6) + '…' : name,
      fullName: name,
      correctRate: Math.round((t.correctRate ?? t.correct_rate ?? 0) * 100),
      count: t.totalCount ?? t.total_count ?? 0,
    }
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">모의고사 결과</h1>
        <p className="text-zinc-500 text-sm mt-1">유형별 분석 리포트</p>
      </div>

      {/* Score summary */}
      <Card>
        <div className="flex items-center justify-around flex-wrap gap-4">
          <ScoreRing score={data.correctCount || 0} total={data.totalCount || 15} />
          <div className="space-y-3">
            {[
              { label: '총 문항', value: data.totalCount || 15 },
              { label: '정답', value: data.correctCount || 0, color: 'text-emerald-600' },
              { label: '오답', value: (data.totalCount || 15) - (data.correctCount || 0), color: 'text-red-500' },
              { label: '점수', value: `${data.score || 0}점` },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between gap-8">
                <span className="text-sm text-zinc-500">{label}</span>
                <span className={`text-sm font-bold ${color || 'text-zinc-900'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Type stats bar chart */}
      {typeData.length > 0 && (
        <Card title="유형별 정답률">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="typeName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(v, _, entry) => [`${v}% (${entry.payload.count}문항)`, entry.payload.fullName]}
              />
              <Bar dataKey="correctRate" radius={[4, 4, 0, 0]}>
                {typeData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getScoreColor(entry.correctRate)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Weak types */}
      {data.weakTypes?.length > 0 && (
        <Card title="집중 학습 필요 유형" subtitle="정답률이 낮은 순">
          <div className="space-y-3">
            {data.weakTypes.slice(0, 3).map((t) => (
              <div key={t.typeCode ?? t.type_code} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                <span className="text-sm font-medium text-red-800">{t.typeName ?? t.type_name}</span>
                <span className="text-sm font-bold text-red-600">{Math.round((t.correctRate ?? t.correct_rate ?? 0) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI feedback */}
      {data.aiFeedback && (
        <Card title="AI 학습 피드백">
          <p className="text-sm text-zinc-700 leading-relaxed">{data.aiFeedback}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => navigate('/student/exam')}>
          새 모의고사 시작
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate('/student/weak')}>
          약점 집중 학습
        </Button>
      </div>
    </div>
  )
}
