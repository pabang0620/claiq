import { useEffect, useState } from 'react'
import { AttendanceTable } from '../../components/teacher/AttendanceTable.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { attendanceApi } from '../../api/attendance.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { formatDate } from '../../utils/formatDate.js'

export default function AttendancePage() {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    attendanceApi
      .getList({ date: selectedDate })
      .then((res) => { if (!cancelled) setRecords(res.data || []) })
      .catch((err) => { if (!cancelled) setError(err.message || '출결 데이터를 불러오지 못했습니다.') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [selectedDate])

  async function handleUpdate(recordId, studentId, status) {
    try {
      await attendanceApi.update(recordId, { status })
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status } : r))
      )
    } catch (err) {
      addToast({ type: 'error', message: err.message || '출결 상태 변경에 실패했습니다.' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">출결 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">수강생 출결 현황을 확인하고 수정하세요.</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          aria-label="날짜 선택"
        />
      </div>

      <div className="bg-primary-50 rounded-xl px-4 py-3 border border-primary-100">
        <p className="text-sm font-medium text-primary-700">
          {formatDate(selectedDate, 'YYYY년 MM월 DD일')} 출결 현황
        </p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">{error}</div>
      ) : (
        <AttendanceTable
          records={records}
          onUpdate={handleUpdate}
          date={selectedDate}
        />
      )}
    </div>
  )
}
