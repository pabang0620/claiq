import { Button } from '../../components/ui/Button.jsx'
import { DdayCounter } from '../../components/student/DdayCounter.jsx'
import { RoadmapTimeline } from '../../components/student/RoadmapTimeline.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useRoadmap } from '../../hooks/useRoadmap.js'
import { useUIStore } from '../../store/uiStore.js'
import { RotateCcw, Info } from 'lucide-react'

export default function RoadmapPage() {
  const { roadmap, isLoading, isRegenerating, error, regenerateRoadmap } = useRoadmap()
  const addToast = useUIStore((s) => s.addToast)

  async function handleRegenerate() {
    const result = await regenerateRoadmap()
    if (result.success) {
      addToast({ type: 'success', message: '로드맵이 재생성됐습니다.' })
    } else {
      addToast({ type: 'error', message: result.error || '재생성에 실패했습니다.' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">D-day 로드맵</h1>
          <p className="text-zinc-500 text-sm mt-1">수능까지 남은 날을 역산한 맞춤형 학습 계획입니다.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          loading={isRegenerating}
        >
          <RotateCcw size={14} />
          로드맵 재생성
        </Button>
      </div>

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <Info size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
        <div className="space-y-1">
          <p className="font-medium">AI 맞춤형 학습 로드맵이란?</p>
          <p className="text-blue-700 leading-relaxed">
            내가 푼 문제의 유형별 정답률을 분석해 약점 위주로 수능까지 주차별 학습 계획을 자동 생성합니다.
            문제를 많이 풀수록 더 정확해지며, <span className="font-semibold">로드맵 재생성</span> 버튼으로 최신 데이터 기반의 새 계획을 만들 수 있습니다.
          </p>
        </div>
      </div>

      <DdayCounter />

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">{error}</div>
      ) : !roadmap ? (
        <div className="text-center py-12 text-zinc-400 bg-white rounded-xl border border-zinc-200">
          <p className="font-medium">로드맵이 아직 생성되지 않았습니다.</p>
          <p className="text-sm mt-2">재생성 버튼을 클릭해 첫 로드맵을 만들어보세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-zinc-600">
              총 <span className="font-semibold text-zinc-900">{roadmap.items?.length || 0}</span>주 학습 계획
            </p>
            {(roadmap.updated_at || roadmap.updatedAt) && (
              <p className="text-xs text-zinc-400">
                마지막 업데이트: {new Date(roadmap.updated_at || roadmap.updatedAt).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
          <RoadmapTimeline items={roadmap.items || []} ddayCount={roadmap.dday_count ?? roadmap.ddayCount ?? 0} />
        </div>
      )}
    </div>
  )
}
