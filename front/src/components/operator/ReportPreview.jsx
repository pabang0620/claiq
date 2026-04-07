import { FileText, TrendingUp, BookOpen, Calendar, User } from 'lucide-react'
import { formatDate } from '../../utils/formatDate.js'

function formatPeriod(period) {
  if (!period) return ''
  const [year, month] = period.split('-')
  if (!year || !month) return period
  return `${year}년 ${parseInt(month, 10)}월`
}

export function ReportPreview({ report, onSendSMS, isSending = false }) {
  if (!report) return null

  const content = report.content_json || {}
  const studentName = report.student_name || '이름 없음'
  const period = report.report_period || content.period || ''
  const quizRate = content.quiz?.rate ?? 0
  const attendPresent = content.attendance?.present ?? 0
  const attendTotal = content.attendance?.total ?? 0
  const weakTypes = (content.weakTypes || []).map((t) => t.type_name || t.type_code || t).filter(Boolean)
  const generatedAt = content.generatedAt || report.created_at
  const sentAt = report.sent_at

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-4 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-primary-300" />
            <span className="text-xs text-primary-200 font-medium">학습 성취 리포트</span>
          </div>
          {period && (
            <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">
              {formatPeriod(period)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-base font-bold">
            {studentName.charAt(0)}
          </div>
          <p className="text-lg font-bold text-white">{studentName}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '정답률', value: `${quizRate}%`, icon: TrendingUp, color: 'text-primary-600' },
            { label: '출석일', value: `${attendPresent}/${attendTotal}일`, icon: Calendar, color: 'text-blue-600' },
            { label: '출석률', value: attendTotal > 0 ? `${Math.round((attendPresent / attendTotal) * 100)}%` : '-', icon: BookOpen, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-3 bg-zinc-50 rounded-xl">
              <Icon size={16} className={`mx-auto mb-1 ${color}`} />
              <p className="font-bold text-zinc-900 text-sm">{value}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Weak types */}
        {weakTypes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">집중 학습 필요 유형</p>
            <div className="flex flex-wrap gap-1.5">
              {weakTypes.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Generated at */}
        {generatedAt && (
          <p className="text-xs text-zinc-400">생성일: {formatDate(generatedAt, 'YYYY.MM.DD HH:mm')}</p>
        )}
      </div>

      {/* SMS send */}
      {onSendSMS && (
        <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50">
          <button
            type="button"
            onClick={() => onSendSMS(report.id)}
            disabled={isSending || sentAt}
            className={[
              'w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              sentAt
                ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                : isSending
                ? 'bg-primary-300 text-white cursor-wait'
                : 'bg-primary-700 hover:bg-primary-800 text-white',
            ].join(' ')}
          >
            {sentAt
              ? `SMS 발송 완료 (${formatDate(sentAt, 'MM.DD HH:mm')})`
              : isSending
              ? 'SMS 발송 중...'
              : 'SMS 발송'}
          </button>
        </div>
      )}
    </div>
  )
}
