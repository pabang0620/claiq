import { useEffect, useState } from 'react'
import { UserPlus, UserMinus, Mail } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Tabs } from '../../components/ui/Tabs.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { academyApi } from '../../api/academy.api.js'
import { useUIStore } from '../../store/uiStore.js'
import { ROLES, ROLE_LABELS } from '../../constants/roles.js'
import { formatDate } from '../../utils/formatDate.js'

const TABS = [
  { value: 'all', label: '전체' },
  { value: 'teacher', label: '교강사' },
  { value: 'student', label: '수강생' },
]

const ROLE_OPTIONS = [
  { value: ROLES.TEACHER, label: '교강사' },
  { value: ROLES.STUDENT, label: '수강생' },
]

const ROLE_BADGE = { teacher: 'info', student: 'success', operator: 'warning' }

export default function MemberManagePage() {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: ROLES.STUDENT })
  const [isInviting, setIsInviting] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  useEffect(() => {
    let cancelled = false
    const role = activeTab === 'all' ? undefined : activeTab
    setIsLoading(true)
    academyApi
      .getMembers()
      .then((res) => {
        if (cancelled) return
        const allMembers = res.data || []
        setMembers(role ? allMembers.filter((m) => m.role === role) : allMembers)
      })
      .catch((err) => { if (!cancelled) { setMembers([]); addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' }) } })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [activeTab])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteForm.email.trim()) return
    setIsInviting(true)
    try {
      await academyApi.invite(inviteForm)
      addToast({ type: 'success', message: `${inviteForm.email} 멤버가 추가됐습니다.` })
      setShowInviteModal(false)
      setInviteForm({ email: '', role: ROLES.STUDENT })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '멤버 추가에 실패했습니다.' })
    } finally {
      setIsInviting(false)
    }
  }

  async function handleRemove(userId, name) {
    const ok = await showConfirm(`${name}님을 학원에서 제거하시겠습니까?`, { confirmLabel: '제거', danger: true })
    if (!ok) return
    try {
      await academyApi.removeMember(userId)
      setMembers((prev) => prev.filter((m) => m.id !== userId))
      addToast({ type: 'success', message: '멤버가 제거됐습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || '제거에 실패했습니다.' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">멤버 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">학원 멤버를 추가하고 관리합니다.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus size={14} />
          멤버 추가
        </Button>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <PageSpinner />
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 text-zinc-400">
          <p className="font-medium">멤버가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">이름</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">역할</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 hidden md:table-cell">이메일</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 hidden lg:table-cell">가입일</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {member.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-zinc-800">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={ROLE_LABELS[member.role] || member.role}
                      variant={ROLE_BADGE[member.role] || 'default'}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{member.email}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">
                    {formatDate(member.joinedAt ?? member.joined_at ?? member.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id, member.name)}
                      aria-label={`${member.name} 제거`}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <UserMinus size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="멤버 추가"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowInviteModal(false)} disabled={isInviting}>
              취소
            </Button>
            <Button form="invite-form" type="submit" loading={isInviting}>
              멤버 추가
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <Input
            id="invite-email"
            label="이메일"
            type="email"
            placeholder="추가할 멤버의 이메일을 입력하세요"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <Select
            id="invite-role"
            label="역할"
            value={inviteForm.role}
            onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
            options={ROLE_OPTIONS}
          />
          <p className="text-xs text-zinc-400">
            CLAIQ에 가입된 계정만 추가할 수 있습니다.
          </p>
        </form>
      </Modal>
    </div>
  )
}
