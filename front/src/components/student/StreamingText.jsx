export function StreamingText({ text, isStreaming, className = '' }) {
  return (
    <span className={`inline ${className}`}>
      <span className="whitespace-pre-wrap">{text}</span>
      {isStreaming && (
        <span
          aria-hidden="true"
          className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-text-bottom"
        >
          ▌
        </span>
      )}
    </span>
  )
}
