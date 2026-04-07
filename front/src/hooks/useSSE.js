import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * 범용 SSE 훅
 * @param {string|null} url - SSE 엔드포인트 경로 (null이면 연결 안 함)
 * @param {{ onMessage, onError, onOpen, onClose }} handlers
 */
export function useSSE(url, handlers) {
  const esRef = useRef(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const connect = useCallback(() => {
    if (!url) return
    const token = useAuthStore.getState().accessToken
    const fullUrl = `${BASE_URL}${url}${token ? `?token=${token}` : ''}`

    esRef.current = new EventSource(fullUrl, { withCredentials: true })

    esRef.current.onopen = () => handlersRef.current.onOpen?.()

    esRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        handlersRef.current.onMessage?.(data)
      } catch {
        handlersRef.current.onMessage?.({ raw: e.data })
      }
    }

    esRef.current.onerror = (e) => {
      handlersRef.current.onError?.(e)
      esRef.current?.close()
      esRef.current = null
    }
  }, [url])

  const disconnect = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    handlersRef.current.onClose?.()
  }, [])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  return { disconnect }
}
