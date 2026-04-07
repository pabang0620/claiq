import { Phone, MessageCircle, AlertTriangle } from 'lucide-react'
import { formatRelative } from '../../utils/formatDate.js'

function RiskBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score > 0.7 ? 'bg-red-500' : score > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
  const textColor = score > 0.7 ? 'text-red-700' : score > 0.4 ? 'text-amber-700' : 'text-emerald-700'
  const label = score > 0.7 ? '위험' : score > 0.4 ? '주의' : '양호'
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-zinc-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${textColor} w-8`}>{label}</span>
    </div>
  )
}

export function ChurnRiskTable({ students = [], onContact, isLoading = false }) {
  if (!students.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 text-zinc-400">
        <AlertTriangle size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">이탈 위험 수강생이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="이탈 위험 수강생 목록">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-4 py-3 text-left font-medium text-zinc-600">수강생</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">위험도</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600 hidden sm:table-cell">출석률</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600 hidden md:table-cell">문제 참여율</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 hidden lg:table-cell">마지막 접속</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600">연락</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {students.map((student) => (
              <tr
                key={student.id}
                className={[
                  'hover:bg-zinc-50/50 transition-colors',
                  student.churnScore > 0.7 ? 'bg-red-50/30' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {student.churnScore > 0.7 && (
                      <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {student.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-zinc-800">{student.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RiskBar score={student.churnScore} />
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span
                    className={[
                      'font-medium',
                      student.attendanceRate < 0.5 ? 'text-red-600' : student.attendanceRate < 0.7 ? 'text-amber-600' : 'text-emerald-600',
                    ].join(' ')}
                  >
                    {Math.round(student.attendanceRate * 100)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-zinc-600">
                    {Math.round(student.quizParticipationRate * 100)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 hidden lg:table-cell">
                  {formatRelative(student.lastActiveAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onContact(student.id)}
                    disabled={isLoading}
                    aria-label={`${student.name}에게 연락`}
                    className="p-2 rounded-lg hover:bg-primary-50 text-zinc-400 hover:text-primary-700 transition-colors disabled:opacity-50"
                  >
                    <MessageCircle size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
