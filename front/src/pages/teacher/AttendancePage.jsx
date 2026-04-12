import { useEffect, useState } from 'react'
import { AttendanceTable } from '../../components/teacher/AttendanceTable.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { attendanceApi } from '../../api/attendance.api.js'
import { lectureApi } from '../../api/lecture.api.js'
import { useAcademyStore } from '../../store/academyStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { formatDate } from '../../utils/formatDate.js'
import { useAuthStore } from '../../store/authStore.js'

const getKSTDateString = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

export default function AttendancePage() {
  const [records, setRecords] = useState([])
  const [lectures, setLectures] = useState([])
  const [selectedDate, setSelectedDate] = useState(getKSTDateString())
  const [selectedLectureId, setSelectedLectureId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const academy = useAcademyStore((s) => s.academy)
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)

  // 날짜 바뀌면 해당 날짜 강의 목록 조회
  useEffect(() => {
    if (!academy?.id) return
    lectureApi.getList({ academy_id: academy.id, limit: 100 })
      .then((res) => {
        const list = res.data || []
        setLectures(list)
        setSelectedLectureId(list.length > 0 ? list[0].id : '')
      })
      .catch(() => setLectures([]))
  }, [selectedDate, academy?.id])

  // 강의 선택 시 출결 조회
  useEffect(() => {
    if (!selectedLectureId || !academy?.id) return
    let cancelled = false
    setIsLoading(true)
    attendanceApi
      .getList({ date: selectedDate, academy_id: academy.id, lecture_id: selectedLectureId })
      .then((res) => { if (!cancelled) setRecords(res.data || []) })
      .catch((err) => { if (!cancelled) addToast({ type: 'error', message: err?.message || '출결 데이터를 불러오지 못했습니다.' }) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [selectedLectureId, selectedDate, academy?.id])

  async function handleUpdate(recordId, studentId, status) {
    try {
      if (recordId) {
        // 기존 레코드 업데이트
        await attendanceApi.update(recordId, { status })
        setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status } : r)))
      } else {
        // 새 출결 레코드 생성
        const res = await attendanceApi.mark({
          lecture_id: selectedLectureId,
          student_id: studentId,
          academy_id: academy.id,
          status,
        })
        const newRecord = res.data
        setRecords((prev) => prev.map((r) =>
          r.student_id === studentId ? { ...r, id: newRecord.id, status } : r
        ))
      }
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '저장에 실패했습니다.' })
    }
  }

  const lectureOptions = lectures.map((l) => ({
    value: l.id,
    label: l.title,
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">출결 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">수강생 출결 현황을 확인하고 수정하세요.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getKSTDateString()}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            aria-label="날짜 선택"
          />
          {lectureOptions.length > 0 && (
            <Select
              id="lecture-select"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              options={lectureOptions}
              placeholder="강의 선택"
            />
          )}
        </div>
      </div>

      <div className="bg-primary-50 rounded-xl px-4 py-3 border border-primary-100">
        <p className="text-sm font-medium text-primary-700">
          {formatDate(selectedDate, 'YYYY년 MM월 DD일')} 출결 현황
          {selectedLectureId && lectures.find(l => l.id === selectedLectureId) && (
            <span className="ml-2 text-primary-500">
              · {lectures.find(l => l.id === selectedLectureId)?.title}
            </span>
          )}
        </p>
      </div>

      {!selectedLectureId ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-zinc-400">
          <p className="font-medium">강의를 선택하세요.</p>
          <p className="text-sm mt-1">출결을 관리할 강의를 위에서 선택해 주세요.</p>
        </div>
      ) : isLoading ? (
        <PageSpinner />
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
