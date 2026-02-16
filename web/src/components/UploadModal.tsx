'use client'

import { useState, useCallback } from 'react'
import { X, UploadCloud, Loader2, Check, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface UploadModalProps {
  onClose: () => void
  folderId: string | null
  onUploadSuccess?: () => void
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export function UploadModal({ onClose, folderId, onUploadSuccess }: UploadModalProps) {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [tags, setTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      id: generateId(),
      status: 'pending',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    if (!session?.user?.id) return false

    const formData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('folderId', folderId || '')
    formData.append('tags', tags)
    formData.append('title', uploadFile.file.name.replace(/\.[^/.]+$/, ''))
    formData.append('userId', session.user.id)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '上传失败')
      }

      return true
    } catch (err: any) {
      throw new Error(err.message || '上传失败')
    }
  }

  const handleUploadAll = async () => {
    if (files.length === 0 || !session?.user?.id) return

    setIsUploading(true)
    const pendingFiles = files.filter(f => f.status === 'pending')

    for (const file of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        await uploadFile(file)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
        ))
      } catch (err: any) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error', error: err.message } : f
        ))
      }
    }

    setIsUploading(false)
    
    // 如果有成功上传的文件，触发刷新
    const hasSuccess = files.some(f => f.status === 'success')
    if (hasSuccess && onUploadSuccess) {
      onUploadSuccess()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold">上传图片</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* 拖拽区域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging 
                ? 'border-black bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${
              isDragging ? 'text-black' : 'text-gray-400'
            }`} />
            <p className="text-gray-600 mb-2">拖拽图片到这里，或</p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <span className="text-black font-medium underline cursor-pointer hover:no-underline">
                点击选择文件
              </span>
            </label>
          </div>

          {/* 标签输入 */}
          {files.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="设计, UI, 灵感..."
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">这些标签会应用到所有上传的图片</p>
            </div>
          )}

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                待上传文件 ({files.length})
                {successCount > 0 && <span className="text-green-600 ml-2">✓ {successCount} 成功</span>}
                {errorCount > 0 && <span className="text-red-600 ml-2">✗ {errorCount} 失败</span>}
              </h3>
              
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    file.status === 'success' ? 'bg-green-50 border-green-200' :
                    file.status === 'error' ? 'bg-red-50 border-red-200' :
                    file.status === 'uploading' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* 缩略图 */}
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file.file)} 
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-pulse w-3/4" />
                      </div>
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'success' && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {file.status === 'pending' && !isUploading && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {successCount > 0 ? '完成' : '取消'}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>上传 {pendingCount} 个文件</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
