import { Bot, User } from 'lucide-react'
import { formatRelative } from '../../utils/formatDate.js'
import { StreamingText } from './StreamingText.jsx'

export function ChatBubble({ message, isStreaming = false, streamingText = '' }) {
  const isUser = message.role === 'user'

  const content = isStreaming && !isUser ? streamingText : message.content

  return (
    <div
      className={[
        'flex items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      ].join(' ')}
      aria-label={isUser ? '내 메시지' : 'AI 답변'}
    >
      {/* Avatar */}
      <div
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary-600' : 'bg-zinc-800',
        ].join(' ')}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Bot size={15} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={['max-w-[75%]', isUser ? 'items-end' : 'items-start', 'flex flex-col gap-1'].join(' ')}>
        <div
          className={[
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-primary-700 text-white rounded-tr-sm'
              : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm',
          ].join(' ')}
        >
          {isStreaming && !isUser ? (
            <StreamingText text={streamingText} isStreaming={isStreaming} />
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {message.isEscalated && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              교강사 답변 대기
            </span>
          )}
          <span className="text-xs text-zinc-400">
            {formatRelative(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
