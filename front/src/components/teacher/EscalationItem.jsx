import { useState, useEffect } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Textarea } from '../ui/Textarea.jsx'
import { Badge } from '../ui/Badge.jsx'
import { formatRelative } from '../../utils/formatDate.js'
import { qaApi } from '../../api/qa.api.js'

export function EscalationItem({ item, onAnswer, isLoading = false }) {
  const [expanded, setExpanded] = useState(false)
  const [answer, setAnswer] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [messages, setMessages] = useState(null)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const isAnswered = item.escalation_response != null

  useEffect(() => {
    if (!expanded || messages !== null) return
    setLoadingMessages(true)
    qaApi.getMessages(item.session_id)
      .then((res) => setMessages(res.data || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false))
  }, [expanded, item.session_id, messages])

  async function handleSubmit() {
    if (!answer.trim()) return
    try {
      await onAnswer(item.id, answer)
      setAnswer('')
      setIsReplying(false)
    } catch (err) {
      // onAnswer (QAEscalationPage.handleAnswer) already shows error toast
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-zinc-50/50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} className="text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-zinc-800">{item.student_name}</span>
              <Badge label={item.session_title || '질문'} variant="primary" size="sm" />
              {isAnswered ? (
                <Badge label="답변 완료" variant="success" size="sm" />
              ) : (
                <Badge label="답변 대기" variant="warning" size="sm" />
              )}
            </div>
            <p className="text-sm text-zinc-600 mt-0.5 truncate">{item.student_question || item.content}</p>
            <p className="text-xs text-zinc-400 mt-1">{formatRelative(item.created_at)}</p>
          </div>
        </div>
        <button aria-label={expanded ? '접기' : '펼치기'} className="flex-shrink-0 text-zinc-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 space-y-4">
          {/* Conversation history */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 mb-2">대화 내역</p>
            {loadingMessages ? (
              <div className="py-4 text-center text-xs text-zinc-400">불러오는 중...</div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={[
                      'p-3 rounded-lg text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-zinc-50 border border-zinc-100 text-zinc-700'
                        : msg.is_escalated
                        ? 'bg-amber-50 border border-amber-100 text-amber-800'
                        : 'bg-primary-50 border border-primary-100 text-primary-800',
                    ].join(' ')}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-60">
                      {msg.role === 'user' ? item.student_name : 'AI'}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-500 mb-1">학생 질문</p>
                <p className="text-sm text-zinc-700">{item.student_question || item.content}</p>
              </div>
            )}
          </div>

          {/* Teacher answer */}
          {isAnswered && item.escalation_response ? (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-2">내 답변</p>
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                <p className="text-sm text-primary-800">{item.escalation_response}</p>
              </div>
            </div>
          ) : (
            <div>
              {isReplying ? (
                <div className="space-y-2">
                  <Textarea
                    id={`answer-${item.id}`}
                    label="답변 작성"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={3}
                    placeholder="학생 질문에 답변을 작성하세요..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmit} loading={isLoading}>
                      <Send size={14} />
                      답변 제출
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)} disabled={isLoading}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsReplying(true)}>
                  답변하기
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
