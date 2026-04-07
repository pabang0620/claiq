import { FileText, TrendingUp, Award, Calendar, User } from 'lucide-react'
import { formatDate } from '../../utils/formatDate.js'

function formatPeriod(period) {
  if (!period) return ''
  const [year, month] = period.split('-')
  if (!year || !month) return period
  return `${year}년 ${parseInt(month, 10)}월`
}

export function ReportPreview({ report, onSendSMS, isSending = false }) {
  if (!report) return null

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-5 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary-300" />
            <span className="text-xs text-primary-200 font-medium">학습 성취 리포트</span>
          </div>
          <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
            {formatPeriod(report.period)}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">
              {report.studentName || '이름 없음'}
            </p>
            <p className="text-xs text-primary-200">{report.studentEmail || ''}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Score summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '평균 정답률', value: `${report.avgCorrectRate || 0}%`, icon: TrendingUp, color: 'text-primary-600' },
            { label: '모의고사 평균', value: `${report.avgExamScore || 0}점`, icon: Award, color: 'text-emerald-600' },
            { label: '총 학습일', value: `${report.studyDays || 0}일`, icon: Calendar, color: 'text-blue-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-3 bg-zinc-50 rounded-xl">
              <Icon size={18} className={`mx-auto mb-1 ${color}`} />
              <p className="font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-500 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Weak types */}
        {report.weakTypes?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">집중 학습 필요 유형</p>
            <div className="flex flex-wrap gap-1.5">
              {report.weakTypes.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI comment */}
        {report.aiComment && (
          <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-xs font-semibold text-primary-700 mb-1">AI 종합 평가</p>
            <p className="text-sm text-primary-800 leading-relaxed">{report.aiComment}</p>
          </div>
        )}

        {/* Generated at */}
        {report.generatedAt && (
          <p className="text-xs text-zinc-400">생성일: {formatDate(report.generatedAt, 'YYYY.MM.DD HH:mm')}</p>
        )}
      </div>

      {/* SMS send */}
      {onSendSMS && (
        <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50">
          <button
            type="button"
            onClick={() => onSendSMS(report.id)}
            disabled={isSending || report.smsSentAt}
            className={[
              'w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              report.smsSentAt
                ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                : isSending
                ? 'bg-primary-300 text-white cursor-wait'
                : 'bg-primary-700 hover:bg-primary-800 text-white',
            ].join(' ')}
          >
            {report.smsSentAt
              ? `SMS 발송 완료 (${formatDate(report.smsSentAt, 'MM.DD HH:mm')})`
              : isSending
              ? 'SMS 발송 중...'
              : 'SMS 발송'}
          </button>
        </div>
      )}
    </div>
  )
}
