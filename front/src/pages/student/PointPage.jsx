import { useEffect, useState } from 'react'
import { Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react'
import { PointSummary } from '../../components/student/PointSummary.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { usePointStore } from '../../store/pointStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { formatPointWithUnit } from '../../utils/formatPoint.js'
import { formatDate } from '../../utils/formatDate.js'
import { pointApi } from '../../api/point.api.js'
import { POINT_EVENT_LABELS } from '../../constants/points.js'

export default function PointPage() {
  const { balance, transactions, isLoading, fetchBalance, fetchTransactions, redeem } = usePointStore()
  const addToast = useUIStore((s) => s.addToast)
  const [rewards, setRewards] = useState([])
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemingId, setRedeemingId] = useState(null)

  useEffect(() => {
    fetchBalance()
    fetchTransactions()
    pointApi.getRewards().then((res) => setRewards(res.data || [])).catch(() => {})
  }, [fetchBalance, fetchTransactions])

  async function handleRedeem(reward) {
    if (balance < reward.required_points) {
      addToast({ type: 'error', message: '포인트가 부족합니다.' })
      return
    }
    setRedeemingId(reward.id)
    const result = await redeem()
    setRedeemingId(null)
    if (result.success) {
      addToast({ type: 'success', message: `${reward.name} 교환 완료!` })
      setShowRedeemModal(false)
    } else {
      addToast({ type: 'error', message: result.error || '교환에 실패했습니다.' })
    }
  }

  if (isLoading && !transactions.length) return <PageSpinner />

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">포인트</h1>
          <p className="text-zinc-500 text-sm mt-1">학습 참여로 포인트를 모아 혜택과 교환하세요.</p>
        </div>
        <Button size="sm" onClick={() => setShowRedeemModal(true)}>
          <Gift size={14} />
          쿠폰 교환
        </Button>
      </div>

      <PointSummary
        balance={balance}
        todayEarned={transactions.filter((t) => {
          const today = new Date().toDateString()
          return new Date(t.created_at).toDateString() === today && t.amount > 0
        }).reduce((sum, t) => sum + t.amount, 0)}
        totalEarned={transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)}
      />

      {/* Transaction history */}
      <Card title="거래 내역">
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">거래 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      t.amount > 0 ? 'bg-emerald-100' : 'bg-red-100',
                    ].join(' ')}
                  >
                    {t.amount > 0 ? (
                      <TrendingUp size={14} className="text-emerald-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {POINT_EVENT_LABELS[t.type] || t.type || '포인트 변동'}
                    </p>
                    <p className="text-xs text-zinc-400">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                <span
                  className={[
                    'text-sm font-bold',
                    t.amount > 0 ? 'text-emerald-600' : 'text-red-500',
                  ].join(' ')}
                >
                  {t.amount > 0 ? '+' : ''}{formatPointWithUnit(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Redeem modal */}
      <Modal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="쿠폰 교환"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            현재 잔액: <span className="font-bold text-primary-700">{formatPointWithUnit(balance)}</span>
          </p>
          {rewards.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">교환 가능한 쿠폰이 없습니다.</p>
          ) : (
            rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{reward.name}</p>
                  <p className="text-xs text-zinc-500">{formatPointWithUnit(reward.required_points)} 필요</p>
                </div>
                <Button
                  size="sm"
                  variant={balance >= reward.required_points ? 'primary' : 'outline'}
                  disabled={balance < reward.required_points}
                  loading={redeemingId === reward.id}
                  onClick={() => handleRedeem(reward)}
                >
                  교환
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
