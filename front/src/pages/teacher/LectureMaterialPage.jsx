import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Trash2, Download, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { lectureApi } from '../../api/lecture.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { formatDate } from '../../utils/formatDate.js'

export default function LectureMaterialPage() {
  const [lectures, setLectures] = useState([])
  const [materials, setMaterials] = useState([])
  const [selectedLecture, setSelectedLecture] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  useEffect(() => {
    lectureApi.getList({ limit: 50 })
      .then((res) => {
        const list = res.data || []
        setLectures(list)
        if (list.length > 0) setSelectedLecture(list[0].id)
      })
      .catch((err) => {
        addToast({ type: 'error', message: err?.message || '강의 목록을 불러오는 데 실패했습니다.' })
      })
  }, [addToast])

  useEffect(() => {
    if (!selectedLecture) return
    setIsLoading(true)
    lectureApi
      .getMaterials(selectedLecture)
      .then((res) => setMaterials(res.data || []))
      .catch((err) => {
        setMaterials([])
        addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
      })
      .finally(() => setIsLoading(false))
  }, [selectedLecture])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !selectedLecture) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await lectureApi.uploadMaterial(selectedLecture, formData)
      setMaterials((prev) => [res.data, ...prev])
      addToast({ type: 'success', message: '자료가 업로드됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '업로드에 실패했습니다.' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDownload(url, filename) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      addToast({ type: 'error', message: '다운로드에 실패했습니다.' })
    }
  }

  async function handleDelete(materialId) {
    const ok = await showConfirm('자료를 삭제하시겠습니까?', { confirmLabel: '삭제', danger: true })
    if (!ok) return
    try {
      await lectureApi.deleteMaterial(selectedLecture, materialId)
      setMaterials((prev) => prev.filter((m) => m.id !== materialId))
      addToast({ type: 'success', message: '자료가 삭제됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '삭제에 실패했습니다.' })
    }
  }

  async function handleDeleteLecture() {
    if (!selectedLecture) return
    const lecture = lectures.find((l) => l.id === selectedLecture)
    const ok = await showConfirm(
      `"${lecture?.title}" 강의를 삭제하시겠습니까?\n강의와 관련된 자료, 문제가 모두 삭제됩니다.`,
      { confirmLabel: '강의 삭제', danger: true }
    )
    if (!ok) return
    setIsDeleting(true)
    try {
      await lectureApi.delete(selectedLecture)
      const next = lectures.filter((l) => l.id !== selectedLecture)
      setLectures(next)
      setSelectedLecture(next.length > 0 ? next[0].id : '')
      setMaterials([])
      addToast({ type: 'success', message: '강의가 삭제됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '강의 삭제에 실패했습니다.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const lectureOptions = lectures.map((l) => ({ value: l.id, label: l.title }))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">강의 자료</h1>
          <p className="text-zinc-500 text-sm mt-1">강의별 정리 자료를 업로드하고 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            id="lecture-select"
            value={selectedLecture}
            onChange={(e) => setSelectedLecture(e.target.value)}
            options={lectureOptions}
            placeholder="강의 선택"
          />
          <button
            type="button"
            onClick={handleDeleteLecture}
            disabled={!selectedLecture || isDeleting}
            aria-label="강의 삭제"
            title="선택한 강의 삭제"
            className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
          </button>
          <div className="w-px h-5 bg-zinc-200 mx-1" />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/teacher/upload')}
          >
            <Plus size={14} />
            강의 추가
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={isUploading}
            disabled={!selectedLecture}
          >
            <Upload size={14} />
            자료 업로드
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png"
            onChange={handleUpload}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-zinc-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">등록된 자료가 없습니다.</p>
          <p className="text-sm mt-1">PDF, PPT, Word, 이미지 파일을 업로드하세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm" aria-label="강의 자료 목록">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">파일명</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 hidden sm:table-cell">크기</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 hidden md:table-cell">업로드일</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary-600 flex-shrink-0" />
                      <span className="text-zinc-800 truncate max-w-xs">{m.title || m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                    {m.size ? `${(m.size / 1024).toFixed(0)} KB` : '-'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
                    {formatDate(m.createdAt ?? m.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {(m.file_url || m.url) && (
                        <button
                          type="button"
                          onClick={() => handleDownload(m.file_url || m.url, m.title || m.name)}
                          aria-label="다운로드"
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <Download size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
                        aria-label="삭제"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
