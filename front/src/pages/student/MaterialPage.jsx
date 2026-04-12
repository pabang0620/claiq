import { useEffect, useState } from 'react'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { lectureApi } from '../../api/lecture.api.js'
import { formatDate } from '../../utils/formatDate.js'
import { useUIStore } from '../../store/uiStore.js'

export default function MaterialPage() {
  const addToast = useUIStore((s) => s.addToast)
  const [materials, setMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    lectureApi
      .getMyMaterials()
      .then((res) => setMaterials(res.data || []))
      .catch((err) => {
        setError(err?.message || '자료를 불러오지 못했습니다.')
        addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">강의 자료</h1>
        <p className="text-zinc-500 text-sm mt-1">교강사가 업로드한 강의 정리 자료입니다.</p>
      </div>

      {error ? (
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">{error}</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-200 text-zinc-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">등록된 자료가 없습니다.</p>
          <p className="text-sm mt-1">교강사가 자료를 업로드하면 여기서 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{m.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.lectureName}</p>
                  <p className="text-xs text-zinc-400 mt-1">{formatDate(m.createdAt)}</p>
                </div>
              </div>
              {m.url && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    <ExternalLink size={13} />
                    열기
                  </a>
                  <a
                    href={m.url}
                    download
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 font-medium"
                  >
                    <Download size={13} />
                    다운로드
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
