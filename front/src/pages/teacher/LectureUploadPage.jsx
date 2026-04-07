import { useState, useCallback } from 'react'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { UploadDropzone } from '../../components/teacher/UploadDropzone.jsx'
import { UploadProgressSSE } from '../../components/teacher/UploadProgressSSE.jsx'
import { useLectureStore } from '../../store/lectureStore.js'
import { useSSE } from '../../hooks/useSSE.js'
import { useUIStore } from '../../store/uiStore.js'
import { ACTIVE_SUBJECTS } from '../../constants/subjects.js'

const SUBJECT_OPTIONS = ACTIVE_SUBJECTS.map((s) => ({ value: s.code, label: s.label }))

export default function LectureUploadPage() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(ACTIVE_SUBJECTS[0]?.code || '')
  const [uploadedLectureId, setUploadedLectureId] = useState(null)
  const [questionCount, setQuestionCount] = useState(null)
  const [sseActive, setSseActive] = useState(false)

  const { uploadLecture, uploadStatus, uploadProgress, processingStep, processingProgress, setProcessingStep, setUploadStatus, resetUpload } = useLectureStore()
  const addToast = useUIStore((s) => s.addToast)

  // SSE for processing progress
  useSSE(
    uploadedLectureId && sseActive ? `/lectures/${uploadedLectureId}/progress` : null,
    {
      onMessage: (data) => {
        if (data.type === 'progress') {
          setProcessingStep(data.step, data.progress)
        }
        if (data.type === 'done') {
          setSseActive(false)
          setQuestionCount(data.questionCount)
          setUploadStatus('done')
          addToast({ type: 'success', message: `${data.questionCount}개 문제가 생성됐습니다!` })
        }
        if (data.type === 'error') {
          setSseActive(false)
          setUploadStatus('error')
          addToast({ type: 'error', message: data.message || '처리 중 오류가 발생했습니다.' })
        }
      },
      onError: () => {
        setSseActive(false)
        setUploadStatus('error')
        addToast({ type: 'error', message: '실시간 진행 상태 연결이 끊어졌습니다.' })
      },
    }
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file || !title.trim() || !subject) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('subject', subject)

    try {
      const lecture = await uploadLecture(formData)
      setUploadedLectureId(lecture.id)
      setSseActive(true)
    } catch {
      addToast({ type: 'error', message: '업로드에 실패했습니다. 다시 시도해주세요.' })
    }
  }

  function handleReset() {
    setFile(null)
    setTitle('')
    setUploadedLectureId(null)
    setQuestionCount(null)
    setSseActive(false)
    resetUpload()
  }

  const isProcessing = ['uploading', 'processing'].includes(uploadStatus)
  const isDone = uploadStatus === 'done'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">강의 업로드</h1>
        <p className="text-zinc-500 text-sm mt-1">
          수업 녹음 파일을 업로드하면 AI가 자동으로 수능 유형별 문제를 생성합니다.
        </p>
      </div>

      {!isProcessing && !isDone && (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-zinc-200 p-6">
          <Input
            id="title"
            label="강의 제목"
            placeholder="예: 2025년 수능 독서 파트 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            id="subject"
            label="과목"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SUBJECT_OPTIONS}
            required
          />
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">
              강의 음성 파일 <span className="text-red-500">*</span>
            </p>
            <UploadDropzone onFileSelect={setFile} />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!file || !title.trim() || !subject}
          >
            업로드 시작
          </Button>
        </form>
      )}

      {(isProcessing || isDone) && (
        <div className="space-y-4">
          <UploadProgressSSE
            isActive={sseActive || uploadStatus === 'processing'}
            currentStep={processingStep}
            stepProgress={processingProgress}
            questionCount={isDone ? questionCount : null}
            uploadProgress={uploadProgress}
          />

          {isDone && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              새 강의 업로드
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
