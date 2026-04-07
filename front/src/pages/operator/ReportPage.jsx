import { useEffect, useState } from 'react'
import { ReportPreview } from '../../components/operator/ReportPreview.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { reportApi } from '../../api/report.api.js'
import { academyApi } from '../../api/academy.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { useAcademyStore } from '../../store/academyStore.js'

export default function ReportPage() {
  const [reports, setReports] = useState([])
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const addToast = useUIStore((s) => s.addToast)
  const academy = useAcademyStore((s) => s.academy)

  useEffect(() => {
    Promise.all([
      reportApi.getList(),
      academyApi.getMembers(),
    ])
      .then(([reportRes, memberRes]) => {
        setReports(reportRes.data || [])
        const allMembers = memberRes.data || []
        setStudents(allMembers.filter((m) => m.role === 'student'))
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  async function handleGenerate(studentId) {
    setGeneratingFor(studentId)
    try {
      const res = await reportApi.generate({ studentId, period: new Date().toISOString().slice(0, 7), academyId: academy?.id })
      setReports((prev) => [res.data, ...prev])
      addToast({ type: 'success', message: '리포트가 생성됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message || '리포트 생성에 실패했습니다.' })
    } finally {
      setGeneratingFor(null)
    }
  }

  async function handleSendSMS(reportId) {
    setSendingId(reportId)
    try {
      await reportApi.sendSms(reportId)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, smsSentAt: new Date().toISOString() } : r
        )
      )
      addToast({ type: 'success', message: 'SMS가 발송됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'SMS 발송에 실패했습니다.' })
    } finally {
      setSendingId(null)
    }
  }

  async function handleBulkSend() {
    const unsentIds = reports.filter((r) => !r.smsSentAt).map((r) => r.id)
    if (!unsentIds.length) {
      addToast({ type: 'info', message: '발송할 리포트가 없습니다.' })
      return
    }
    try {
      await Promise.all(unsentIds.map((id) => reportApi.sendSms(id)))
      setReports((prev) =>
        prev.map((r) => ({ ...r, smsSentAt: r.smsSentAt || new Date().toISOString() }))
      )
      addToast({ type: 'success', message: `${unsentIds.length}개 리포트가 일괄 발송됐습니다.` })
    } catch (err) {
      addToast({ type: 'error', message: err.message || '일괄 발송에 실패했습니다.' })
    }
  }

  if (isLoading) return <PageSpinner />

  const unsentCount = reports.filter((r) => !r.smsSentAt).length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">성취 리포트</h1>
          <p className="text-zinc-500 text-sm mt-1">수강생별 학습 성취 리포트를 생성하고 SMS로 발송합니다.</p>
        </div>
        {unsentCount > 0 && (
          <Button onClick={handleBulkSend}>
            일괄 SMS 발송 ({unsentCount}개)
          </Button>
        )}
      </div>

      {/* Generate section */}
      {students.length > 0 && (
        <Card title="리포트 생성">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {student.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-zinc-800">{student.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={generatingFor === student.id}
                  onClick={() => handleGenerate(student.id)}
                >
                  생성
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 text-zinc-400">
          <p className="font-medium">생성된 리포트가 없습니다.</p>
          <p className="text-sm mt-2">수강생을 선택해 리포트를 생성하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportPreview
              key={report.id}
              report={report}
              onSendSMS={handleSendSMS}
              isSending={sendingId === report.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
