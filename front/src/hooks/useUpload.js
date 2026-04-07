import { useState, useRef, useCallback } from 'react'

/**
 * 파일 업로드 훅
 * @param {Function} uploadFn - (formData, onProgress) => Promise
 */
export function useUpload(uploadFn) {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const abortRef = useRef(null)

  const upload = useCallback(
    async (file, extraData = {}) => {
      setIsUploading(true)
      setProgress(0)
      setError(null)
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)
      Object.entries(extraData).forEach(([k, v]) => formData.append(k, v))

      try {
        const res = await uploadFn(formData, (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1))
          setProgress(pct)
        })
        setResult(res)
        setProgress(100)
        return { success: true, data: res }
      } catch (err) {
        const message = err.message || '업로드에 실패했습니다.'
        setError(message)
        return { success: false, error: message }
      } finally {
        setIsUploading(false)
      }
    },
    [uploadFn]
  )

  const reset = useCallback(() => {
    setProgress(0)
    setIsUploading(false)
    setError(null)
    setResult(null)
  }, [])

  return { upload, progress, isUploading, error, result, reset }
}
