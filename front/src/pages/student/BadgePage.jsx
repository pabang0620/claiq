import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { StreakBadge } from '../../components/student/StreakBadge.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { usePointStore } from '../../store/pointStore.js'
import { BADGE_DEFINITIONS } from '../../constants/points.js'
import { useUIStore } from '../../store/uiStore.js'
import { badgeApi } from '../../api/badge.api.js'

export default function BadgePage() {
  const { badges, streak, isLoading, fetchBadges, fetchStreak } = usePointStore()
  const addToast = useUIStore((s) => s.addToast)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  useEffect(() => {
    fetchBadges().catch((err) =>
      addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
    )
    fetchStreak().catch((err) =>
      addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
    )
  }, [fetchBadges, fetchStreak])

  const handleClaimReward = async () => {
    if (isClaiming || isClaimed) return
    setIsClaiming(true)
    try {
      const res = await badgeApi.claimAllCompleteReward()
      if (res?.data?.alreadyClaimed) {
        addToast({ type: 'info', message: '이미 포인트를 수령했습니다.' })
        setIsClaimed(true)
      } else {
        addToast({ type: 'success', message: '500 포인트를 받았습니다!' })
        setIsClaimed(true)
      }
    } catch (err) {
      if (err?.alreadyClaimed) {
        addToast({ type: 'info', message: '이미 포인트를 수령했습니다.' })
        setIsClaimed(true)
      } else {
        addToast({ type: 'error', message: err?.message || '포인트 수령에 실패했습니다.' })
      }
    } finally {
      setIsClaiming(false)
    }
  }

  if (isLoading && !badges.length) return <PageSpinner />

  const earnedIds = new Set(badges.map((b) => b.code || b.badgeId || b.id))
  const isAllEarned = earnedIds.size === BADGE_DEFINITIONS.length

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">뱃지 & 스트릭</h1>
        <p className="text-zinc-500 text-sm mt-1">학습 목표를 달성하고 뱃지를 모아보세요!</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* 좌측: 뱃지 그리드 */}
        <div className="flex-1 min-w-0">
          <Card title={`뱃지 컬렉션 (${earnedIds.size}/${BADGE_DEFINITIONS.length})`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {BADGE_DEFINITIONS.map((def) => {
                const isEarned = earnedIds.has(def.id)
                const earned = badges.find((b) => (b.code || b.badgeId || b.id) === def.id)
                return (
                  <div
                    key={def.id}
                    className={[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                      isEarned
                        ? 'border-primary-200 bg-primary-50 shadow-sm'
                        : 'border-zinc-100 bg-zinc-50 opacity-50',
                    ].join(' ')}
                    aria-label={`${def.name}: ${isEarned ? '획득' : '미획득'}`}
                  >
                    <span
                      className={['text-4xl', !isEarned && 'grayscale'].join(' ')}
                      aria-hidden="true"
                    >
                      {def.icon}
                    </span>
                    <div className="text-center">
                      <p
                        className={[
                          'text-xs font-semibold',
                          isEarned ? 'text-zinc-800' : 'text-zinc-400',
                        ].join(' ')}
                      >
                        {def.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-tight">
                        {def.description}
                      </p>
                      {isEarned && earned?.earnedAt && (
                        <p className="text-xs text-primary-500 mt-1">
                          {new Date(earned.earnedAt).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                    {isEarned && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                        획득
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 우측: 스트릭 + 진행상황 + 포인트 버튼 */}
        <div className="w-full sm:w-80 space-y-4 shrink-0">
          <StreakBadge current={streak.current || 0} longest={streak.longest || 0} className="w-full" />

          {/* 진행상황 + 포인트 받기 */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
            <p className="text-sm font-medium text-primary-800">
              {isAllEarned
                ? '🎉 모든 뱃지를 획득했습니다! 대단해요!'
                : `아직 ${BADGE_DEFINITIONS.length - earnedIds.size}개 뱃지가 남았어요. 계속 학습해서 모아보세요!`}
            </p>

            {/* 포인트 받기 버튼 — 항상 노출 */}
            <div className="relative group mt-3 w-fit">
              <Button
                variant="primary"
                size="md"
                disabled={!isAllEarned || isClaimed}
                loading={isClaiming}
                onClick={handleClaimReward}
              >
                {isClaimed ? '수령 완료' : '포인트 받기'}
              </Button>

              {/* 툴팁: 뱃지 미완성 시에만 표시 */}
              {!isAllEarned && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  role="tooltip"
                >
                  뱃지 컬렉션을 완성하세요!
                  {/* 말풍선 꼬리 */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
