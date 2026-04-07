import { useEffect, useState, useRef, useCallback } from 'react'
import { Send, Plus, MessageSquare, ChevronDown } from 'lucide-react'
import { ChatBubble } from '../../components/student/ChatBubble.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useQAStore } from '../../store/qaStore.js'
import { useQAStream } from '../../hooks/useQAStream.js'
import { useUIStore } from '../../store/uiStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { formatDate } from '../../utils/formatDate.js'

export default function QAPage() {
  const {
    sessions,
    currentSession,
    messages,
    isAITyping,
    streamingText,
    isLoading,
    fetchSessions,
    startSession,
    selectSession,
    addUserMessage,
    clearMessages,
  } = useQAStore()
  const { sendMessage, isStreaming, streamError, abort } = useQAStream()
  const addToast = useUIStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)

  const [inputText, setInputText] = useState('')
  const [showSessionList, setShowSessionList] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    if (streamError) {
      addToast({ type: 'error', message: streamError })
    }
  }, [streamError, addToast])

  async function handleNewSession() {
    try {
      const session = await startSession()
      return session
    } catch {
      addToast({ type: 'error', message: '세션 생성에 실패했습니다.' })
    }
  }

  async function handleSend() {
    const text = inputText.trim()
    if (!text || isStreaming) return

    let session = currentSession
    if (!session) {
      session = await handleNewSession()
      if (!session) return
    }

    setInputText('')
    addUserMessage(text)
    await sendMessage(session.id, text, user?.academyId, user?.id)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-3">
      {/* 모바일 세션 선택 드롭다운 (lg 미만에서만) */}
      <div className="lg:hidden relative flex-shrink-0">
        <button
          onClick={() => setShowSessionList((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all duration-150 active:scale-[0.97]"
        >
          <MessageSquare size={15} className="text-zinc-500" />
          <span className="text-zinc-700">{currentSession?.title || '대화 선택'}</span>
          <ChevronDown size={14} className="text-zinc-400" />
        </button>
        {showSessionList && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">대화 내역</span>
              <button
                onClick={() => { handleNewSession(); setShowSessionList(false) }}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-400"
                aria-label="새 대화 시작"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {sessions.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-4">대화 내역이 없습니다</p>
              )}
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => { selectSession(session.id); setShowSessionList(false) }}
                  className={[
                    'w-full text-left px-3 py-2 text-sm transition-colors duration-150',
                    currentSession?.id === session.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-zinc-600 hover:bg-zinc-50',
                  ].join(' ')}
                >
                  <p className="truncate">{session.title || '새 대화'}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session list (lg 이상에서만 사이드패널) */}
      <div className="w-56 flex-shrink-0 flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden hidden lg:flex">
        <div className="px-3 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700">대화 내역</span>
          <button
            onClick={handleNewSession}
            aria-label="새 대화 시작"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sessions.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">대화 내역이 없습니다</p>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => selectSession(session.id)}
              className={[
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5',
                currentSession?.id === session.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-zinc-600 hover:bg-zinc-50',
              ].join(' ')}
            >
              <p className="truncate font-medium">{session.title || '새 대화'}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {formatDate(session.updatedAt || session.createdAt)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-600" />
            <span className="text-sm font-semibold text-zinc-800">
              {currentSession?.title || 'AI Q&A'}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleNewSession}>
            <Plus size={14} />
            새 대화
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading && !messages.length ? (
            <PageSpinner />
          ) : !currentSession && !messages.length ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
              <MessageSquare size={48} className="opacity-30" />
              <p className="text-center">
                <span className="font-medium text-zinc-600 block mb-1">AI Q&A에 오신 것을 환영합니다!</span>
                궁금한 수능 내용을 무엇이든 물어보세요.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <ChatBubble
                  message={{ id: 'streaming', role: 'ai', content: '', createdAt: new Date().toISOString() }}
                  isStreaming
                  streamingText={streamingText}
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="수능 관련 질문을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
              rows={2}
              disabled={isStreaming}
              aria-label="질문 입력"
              className={[
                'flex-1 resize-none px-4 py-3 text-sm rounded-xl border outline-none transition-colors',
                'placeholder:text-zinc-400',
                'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isStreaming ? 'bg-zinc-50 border-zinc-200' : 'border-zinc-200 bg-white',
              ].join(' ')}
            />
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              aria-label="전송"
              className="flex-shrink-0 h-12 w-12 p-0 rounded-xl"
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 ml-1">
            강의 내용 기반 RAG 답변 · 답변 불가 시 교강사에게 에스컬레이션
          </p>
        </div>
      </div>
    </div>
  )
}
