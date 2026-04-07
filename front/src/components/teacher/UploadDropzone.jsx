import { useState, useRef, useCallback } from 'react'
import { Upload, FileAudio, X, Music } from 'lucide-react'

const ACCEPT_TYPES = '.mp3,.m4a,.wav,.ogg,.webm,.mp4'
const MAX_SIZE_MB = 500

export function UploadDropzone({ onFileSelect, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const inputRef = useRef(null)

  const validateFile = useCallback((file) => {
    if (!file) return '파일을 선택해주세요.'
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = ['mp3', 'm4a', 'wav', 'ogg', 'webm', 'mp4']
    if (!allowed.includes(ext)) return '지원하지 않는 파일 형식입니다. (MP3, M4A, WAV, OGG, WebM, MP4)'
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`
    return null
  }, [])

  const handleFile = useCallback(
    (file) => {
      const err = validateFile(file)
      if (err) {
        setFileError(err)
        return
      }
      setFileError('')
      setSelectedFile(file)
      onFileSelect(file)
    },
    [validateFile, onFileSelect]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile]
  )

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const removeFile = () => {
    setSelectedFile(null)
    setFileError('')
    if (inputRef.current) inputRef.current.value = ''
    onFileSelect(null)
  }

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Music size={20} className="text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800 truncate">{selectedFile.name}</p>
            <p className="text-xs text-zinc-500">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={removeFile}
              aria-label="파일 제거"
              className="p-1.5 rounded-lg hover:bg-primary-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="파일을 드래그하거나 클릭하여 업로드"
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          className={[
            'w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all',
            disabled
              ? 'cursor-not-allowed opacity-50 border-zinc-200'
              : isDragging
              ? 'cursor-copy border-primary-400 bg-primary-50'
              : 'cursor-pointer border-zinc-200 hover:border-primary-300 hover:bg-primary-50/50',
          ].join(' ')}
        >
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <Upload size={24} className="text-primary-700" />
          </div>
          <div className="text-center">
            <p className="font-medium text-zinc-700">
              {isDragging ? '여기에 놓아주세요!' : '파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              MP3, M4A, WAV, OGG, WebM, MP4 · 최대 {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      )}

      {fileError && (
        <p role="alert" className="text-xs text-red-500 mt-2">{fileError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  )
}
