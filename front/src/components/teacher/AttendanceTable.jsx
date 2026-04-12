import { useState } from 'react'
import { Check, X, Clock, Minus } from 'lucide-react'

const STATUS_CONFIG = {
  present: { label: '출석', icon: Check, color: 'text-emerald-600 bg-emerald-50', borderColor: 'border-emerald-200' },
  absent: { label: '결석', icon: X, color: 'text-red-600 bg-red-50', borderColor: 'border-red-200' },
  late: { label: '지각', icon: Clock, color: 'text-amber-600 bg-amber-50', borderColor: 'border-amber-200' },
  unset: { label: '-', icon: Minus, color: 'text-zinc-400 bg-zinc-50', borderColor: 'border-zinc-200' },
}

function StatusButton({ status, current, onClick, disabled }) {
  const cfg = STATUS_CONFIG[status]
  const isActive = current === status
  return (
    <button
      type="button"
      onClick={() => onClick(status)}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={cfg.label}
      className={[
        'px-2 py-1 text-xs rounded-md border transition-all',
        isActive ? `${cfg.color} ${cfg.borderColor} font-medium` : 'text-zinc-400 bg-white border-zinc-200 hover:border-zinc-300',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      {cfg.label}
    </button>
  )
}

export function AttendanceTable({ records = [], onUpdate, isLoading = false, date }) {
  const [pendingUpdates, setPendingUpdates] = useState({})

  function handleStatusChange(recordId, studentId, status) {
    setPendingUpdates((prev) => ({ ...prev, [recordId]: status }))
    onUpdate(recordId, studentId, status)
  }

  const displayRecords = records.map((r) => ({
    ...r,
    status: pendingUpdates[r.id] !== undefined ? pendingUpdates[r.id] : r.status,
  }))

  const stats = {
    present: displayRecords.filter((r) => r.status === 'present').length,
    absent: displayRecords.filter((r) => r.status === 'absent').length,
    late: displayRecords.filter((r) => r.status === 'late').length,
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-zinc-100 border-b border-zinc-200">
        {[
          { label: '출석', count: stats.present, color: 'text-emerald-600' },
          { label: '결석', count: stats.absent, color: 'text-red-600' },
          { label: '지각', count: stats.late, color: 'text-amber-600' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white px-4 py-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="출결 현황">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-4 py-3 text-left font-medium text-zinc-600">이름</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600">출결 상태</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-600">변경</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  수강생 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              displayRecords.map((record) => {
                const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.unset
                const Icon = statusCfg.icon
                return (
                  <tr key={record.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {record.student_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-zinc-800">{record.student_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        <Icon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {['present', 'absent', 'late'].map((s) => (
                          <StatusButton
                            key={s}
                            status={s}
                            current={record.status}
                            onClick={(status) => handleStatusChange(record.id, record.student_id, status)}
                            disabled={isLoading}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
