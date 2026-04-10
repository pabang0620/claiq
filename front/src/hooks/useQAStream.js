import { useCallback, useState, useRef } from 'react'
import { useQAStore } from '../store/qaStore.js'
import { useAuthStore } from '../store/authStore.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export function useQAStream() {
  const { appendStreamChunk, finalizeStream, startAIResponse } = useQAStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState(null)
  const controllerRef = useRef(null)

  const sendMessage = useCallback(
    async (sessionId, text, academyId, teacherId) => {
      setIsStreaming(true)
      setStreamError(null)
      startAIResponse()
      controllerRef.current = new AbortController()

      const token = useAuthStore.getState().accessToken

      try {
        const response = await fetch(`${BASE_URL}/qa/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            question: text,
            session_id: sessionId,
            academy_id: academyId,
            teacher_id: teacherId,
          }),
          signal: controllerRef.current.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`스트리밍 요청 실패: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(Boolean)
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              let data
              try {
                data = JSON.parse(line.slice(6))
              } catch {
                // JSON 파싱 실패 시 해당 라인 무시 (불완전 청크)
                continue
              }
              if (data.type === 'chunk') appendStreamChunk(data.content)
              if (data.type === 'done') finalizeStream(data.messageId, data.isEscalated)
              if (data.type === 'error') throw new Error(data.message)
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setStreamError(err.message || 'Q&A 스트리밍 오류가 발생했습니다.')
          finalizeStream(null, false)
        }
      } finally {
        setIsStreaming(false)
      }
    },
    [appendStreamChunk, finalizeStream, startAIResponse]
  )

  const abort = useCallback(() => {
    controllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { sendMessage, isStreaming, streamError, abort }
}
