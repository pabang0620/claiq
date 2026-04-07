import { useEffect, useRef, useCallback } from 'react'

/**
 * 폴링 훅
 * @param {Function} fetchFn - 비동기 조회 함수
 * @param {Function} shouldStop - (data) => boolean
 * @param {number} interval - 폴링 주기 ms
 * @param {boolean} enabled - 활성화 여부
 */
export function usePolling(fetchFn, shouldStop, interval = 3000, enabled = true) {
  const timerRef = useRef(null)
  const fetchFnRef = useRef(fetchFn)
  const shouldStopRef = useRef(shouldStop)

  fetchFnRef.current = fetchFn
  shouldStopRef.current = shouldStop

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const poll = async () => {
      try {
        const data = await fetchFnRef.current()
        if (shouldStopRef.current?.(data)) {
          stop()
        }
      } catch {
        // 폴링 에러는 무시 (다음 인터벌에 재시도)
      }
    }

    poll()
    timerRef.current = setInterval(poll, interval)

    return stop
  }, [enabled, interval, stop])

  return { stop }
}
