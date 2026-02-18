'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
  titleOverride?: string
  descriptionOverride?: string
  originalUrlOverride?: string
  metaTagsOverride?: string[]
  folderIdOverride?: string | null
  eagleFolderName?: string | null
}

export function UploadModal({ onClose, folderId, onUploadSuccess }: UploadModalProps) {
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [tags, setTags] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [availableFolders, setAvailableFolders] = useState<{id: string, name: string}[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId)
  const [useEagleMetadata, setUseEagleMetadata] = useState(true)
  const folderInputRef = useRef<HTMLInputElement | null>(null)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  useEffect(() => {
    setSelectedFolderId(folderId)
  }, [folderId])

  useEffect(() => {
    const fetchFolders = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch('/api/folders')
        const result = await res.json()
        if (result.success) {
          setAvailableFolders(result.data.map((f: any) => ({ id: f.id, name: f.name })))
        }
      } catch {}
    }
    fetchFolders()
  }, [session?.user?.id])

  useEffect(() => {
    const el = folderInputRef.current
    if (el) {
      el.setAttribute('webkitdirectory', '')
      el.setAttribute('directory', '')
    }
  }, [])

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

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return
    const jsonFiles = selectedFiles.filter(f => f.name.toLowerCase().endsWith('.json'))
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'))
    const metaMap = await parseEagleJsonFiles(jsonFiles)
    const folderMap = await ensureFoldersFromMeta(metaMap)
    const uploadFiles: UploadFile[] = imageFiles.map(file => {
      const key = file.name.toLowerCase()
      const meta = metaMap[key] || null
      const eagleFolderName = meta?.folderName || null
      const folderIdOverride = eagleFolderName ? (folderMap[eagleFolderName] || null) : null
      return {
        file,
        id: generateId(),
        status: 'pending',
        progress: 0,
        titleOverride: meta?.title || undefined,
        descriptionOverride: meta?.description || undefined,
        originalUrlOverride: meta?.url || undefined,
        metaTagsOverride: meta?.tags || [],
        folderIdOverride,
        eagleFolderName
      }
    })
    setFiles(prev => [...prev, ...uploadFiles])
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
    formData.append('folderId', (useEagleMetadata ? (uploadFile.folderIdOverride ?? selectedFolderId) : selectedFolderId) || '')
    const combinedTags = [
      ...(tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      ...(useEagleMetadata ? (uploadFile.metaTagsOverride || []) : [])
    ]
    const uniqueTags = Array.from(new Set(combinedTags))
    formData.append('tags', uniqueTags.join(','))
    formData.append('title', (useEagleMetadata ? (uploadFile.titleOverride || uploadFile.file.name.replace(/\.[^/.]+$/, '')) : uploadFile.file.name.replace(/\.[^/.]+$/, '')))
    if (useEagleMetadata && uploadFile.descriptionOverride) {
      formData.append('description', uploadFile.descriptionOverride)
    }
    if (useEagleMetadata && uploadFile.originalUrlOverride) {
      formData.append('originalUrl', uploadFile.originalUrlOverride)
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let text = ''
        try {
          text = await response.text()
          const json = JSON.parse(text)
          throw new Error(json.message || '上传失败')
        } catch (e: any) {
          if (text) {
            const plain = text.replace(/<[^>]*>/g, '').trim()
            throw new Error(plain || '上传失败')
          }
          throw new Error(e?.message || '上传失败')
        }
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
            <p className="text-gray-600 mt-4 mb-2">或选择包含 Eagle 元数据的文件夹</p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                onChange={handleFolderSelect}
                ref={folderInputRef}
                className="hidden"
                disabled={isUploading}
              />
              <span className="text-black font-medium underline cursor-pointer hover:no-underline">
                选择文件夹
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
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="use-eagle"
                  type="checkbox"
                  checked={useEagleMetadata}
                  onChange={(e) => setUseEagleMetadata(e.target.checked)}
                />
                <label htmlFor="use-eagle" className="text-sm text-gray-700">自动匹配 Eagle 元数据（标题、链接、标签、分类）</label>
              </div>
            </div>
          )}

          {/* 选择文件夹 */}
          {files.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保存到文件夹
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">不分类</option>
                {availableFolders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">如果未选择，将保存为未分类</p>
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
                    <p className="text-sm font-medium truncate">{file.titleOverride || file.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                    {useEagleMetadata && (file.eagleFolderName || (file.metaTagsOverride && file.metaTagsOverride.length > 0) || file.originalUrlOverride) && (
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        {file.eagleFolderName && <div>分类：{file.eagleFolderName}</div>}
                        {file.metaTagsOverride && file.metaTagsOverride.length > 0 && (
                          <div>标签：{file.metaTagsOverride.join(', ')}</div>
                        )}
                        {file.originalUrlOverride && <div>来源：{file.originalUrlOverride}</div>}
                      </div>
                    )}
                    
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

async function parseEagleJsonFiles(jsonFiles: File[]) {
  const metaMap: Record<string, { title?: string; description?: string; tags?: string[]; url?: string; folderName?: string }> = {}
  for (const jf of jsonFiles) {
    try {
      const text = await jf.text()
      const obj = JSON.parse(text)
      const items = Array.isArray(obj) ? obj
        : Array.isArray(obj.images) ? obj.images
        : Array.isArray(obj.items) ? obj.items
        : Array.isArray(obj.data) ? obj.data
        : []
      for (const it of items) {
        const fileName = (it.fileName || it.name || it.title || it.path || it.file || it.filename || '').toString()
        const base = fileName.split('/').pop()?.toLowerCase() || ''
        if (!base) continue
        const tags = Array.isArray(it.tags) ? it.tags : typeof it.tags === 'string' ? it.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
        const folderName = it.folder || it.category || (Array.isArray(it.folders) ? it.folders[0] : undefined)
        const url = it.url || it.link || it.sourceUrl || it.website || undefined
        const description = it.annotation || it.desc || it.description || undefined
        const title = it.title || it.name || undefined
        metaMap[base] = { title, description, tags, url, folderName }
      }
    } catch {}
  }
  return metaMap
}

async function ensureFoldersFromMeta(metaMap: Record<string, { folderName?: string }>) {
  const names = Array.from(new Set(Object.values(metaMap).map(m => (m.folderName || '').trim()).filter(Boolean)))
  if (names.length === 0) return {}
  const existingRes = await fetch('/api/folders')
  const existingJson = await existingRes.json()
  const existing: { id: string; name: string }[] = existingJson.success ? existingJson.data.map((f: any) => ({ id: f.id, name: f.name })) : []
  const map: Record<string, string> = {}
  for (const n of names) {
    const found = existing.find(f => f.name === n)
    if (found) {
      map[n] = found.id
      continue
    }
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n })
      })
      const result = await res.json()
      if (result.success) {
        map[n] = result.data.id
      }
    } catch {}
  }
  return map
}
