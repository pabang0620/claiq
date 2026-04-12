import { useState } from 'react'
import { CheckCircle, XCircle, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Textarea } from '../ui/Textarea.jsx'
import { Input } from '../ui/Input.jsx'
import { useUIStore } from '../../store/uiStore.js'

const DIFFICULTY_COLOR = { A: 'danger', B: 'warning', C: 'success' }
const DIFFICULTY_LABEL = { A: '상', B: '중', C: '하' }

export function QuestionCard({ question, onReview, isLoading = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editContent, setEditContent] = useState(question.content || '')
  const [editOptions, setEditOptions] = useState(question.options || [])
  const [editExplanation, setEditExplanation] = useState(question.explanation || '')
  const showConfirm = useUIStore((s) => s.showConfirm)

  async function handleApprove() {
    const ok = await showConfirm(
      '이 문제를 승인하시겠습니까?\n승인된 문제는 학생에게 출제됩니다.',
      { confirmLabel: '승인' }
    )
    if (!ok) return
    onReview(question.id, 'approve')
  }

  async function handleReject() {
    const ok = await showConfirm(
      '이 문제를 반려하시겠습니까?\n반려된 문제는 학생에게 출제되지 않습니다.',
      { confirmLabel: '반려', danger: true }
    )
    if (!ok) return
    onReview(question.id, 'reject')
  }

  async function handleSaveEdit() {
    const ok = await showConfirm(
      '수정 내용을 저장하고 승인하시겠습니까?\n승인된 문제는 학생에게 출제됩니다.',
      { confirmLabel: '저장 및 승인' }
    )
    if (!ok) return
    onReview(question.id, 'edit', {
      content: editContent,
      options: editOptions,
      explanation: editExplanation,
    })
    setIsEditing(false)
  }

  function updateOption(idx, val) {
    const next = editOptions.map((o, i) => (i === idx ? { ...o, text: val } : o))
    setEditOptions(next)
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={question.typeName || question.typeCode} variant="primary" />
          <Badge
            label={`난이도 ${DIFFICULTY_LABEL[question.difficulty] || question.difficulty}`}
            variant={DIFFICULTY_COLOR[question.difficulty] || 'default'}
          />
          <Badge
            label={question.type === 'multiple_choice' ? '5지선다' : '단답형'}
            variant="default"
          />
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          aria-label={expanded ? '접기' : '펼치기'}
          className="p-1 text-zinc-400 hover:text-zinc-600"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              id={`q-${question.id}-content`}
              label="문제 내용"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
            />
            {question.type === 'multiple_choice' && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-600">선택지</p>
                {editOptions.map((opt, i) => (
                  <Input
                    key={opt.label ?? i}
                    id={`opt-${opt.label ?? i}`}
                    placeholder={`${opt.label}번 선택지`}
                    value={opt.text}
                    onChange={(e) => updateOption(i, e.target.value)}
                  />
                ))}
              </div>
            )}
            <Textarea
              id={`q-${question.id}-expl`}
              label="해설"
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                loading={isLoading}
              >
                저장 및 승인
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {question.content}
            </p>

            {expanded && question.type === 'multiple_choice' && question.options?.length > 0 && (
              <ol className="mt-4 space-y-2">
                {question.options.map((opt) => (
                  <li
                    key={opt.label}
                    className={[
                      'flex items-start gap-2 text-sm px-3 py-2 rounded-lg',
                      String(opt.label) === String(question.correctAnswer)
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-zinc-50 text-zinc-700',
                    ].join(' ')}
                  >
                    <span className="font-semibold flex-shrink-0">{'①②③④⑤'.charAt(Number(opt.label) - 1) || opt.label}</span>
                    <span>{opt.text}</span>
                  </li>
                ))}
              </ol>
            )}

            {expanded && question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">해설</p>
                <p className="text-sm text-blue-800">{question.explanation}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            loading={isLoading}
            variant="primary"
          >
            <CheckCircle size={14} />
            승인
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            <Edit3 size={14} />
            수정
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleReject}
            disabled={isLoading}
          >
            <XCircle size={14} />
            반려
          </Button>
        </div>
      )}
    </div>
  )
}
