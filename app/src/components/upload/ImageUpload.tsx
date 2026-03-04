/**
 * 图片上传组件
 * 支持拖拽上传、点击选择、预览、进度显示和错误处理
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle2, RefreshCw, LogIn } from 'lucide-react'
import { apiClient } from '../../services/api'
import { useAuth } from '../../contexts'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Card } from '../ui/card'
import { toast } from 'sonner'
import type { Asset } from '../../types/api'

interface ImageUploadProps {
  onUploadSuccess?: (asset: Asset) => void
  onUploadComplete?: () => void
  folderId?: string
}

interface UploadState {
  file: File | null
  preview: string | null
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export function ImageUpload({
  onUploadSuccess,
  onUploadComplete,
  folderId,
}: ImageUploadProps) {
  const { isAuthenticated } = useAuth()
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return '只支持图片格式文件'
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return '文件大小不能超过10MB'
    }

    return null
  }

  // 处理文件选择
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadState({
        file: null,
        preview: null,
        uploading: false,
        progress: 0,
        error,
        success: false,
      })
      toast.error(error)
      return
    }

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadState({
        file,
        preview: e.target?.result as string,
        uploading: false,
        progress: 0,
        error: null,
        success: false,
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFilesSelect = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      setUploadState({
        file: null,
        preview: null,
        uploading: false,
        progress: 0,
        error: '未检测到可上传的图片文件',
        success: false,
      })
      setSelectedFiles([])
      toast.error('未检测到可上传的图片文件')
      return
    }

    const oversized = imageFiles.find(file => file.size > 10 * 1024 * 1024)
    if (oversized) {
      setUploadState({
        file: null,
        preview: null,
        uploading: false,
        progress: 0,
        error: `文件过大: ${oversized.name}（超过10MB）`,
        success: false,
      })
      setSelectedFiles([])
      toast.error(`文件过大: ${oversized.name}（超过10MB）`)
      return
    }

    setSelectedFiles(imageFiles)
    handleFileSelect(imageFiles[0])
  }, [handleFileSelect])

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // 处理文件放置
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFilesSelect(files)
      }
    },
    [handleFilesSelect]
  )

  // 处理点击选择
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 处理文件输入变化
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFilesSelect(Array.from(files))
      }
    },
    [handleFilesSelect]
  )

  const handleFolderInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFilesSelect(Array.from(files))
      }
    },
    [handleFilesSelect]
  )

  // 上传文件
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setUploadState((prev) => ({
      ...prev,
      uploading: true,
      progress: 0,
      error: null,
      success: false,
    }))

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 200)

      const successAssets: Asset[] = []
      const failedNames: string[] = []
      const failedErrors: string[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const result = await apiClient.uploadAsset(file, {
          title: file.webkitRelativePath || file.name,
          folderId,
        })
        const percent = Math.round(((i + 1) / selectedFiles.length) * 100)
        setUploadState((prev) => ({
          ...prev,
          progress: Math.max(prev.progress, percent),
        }))
        if (result.success && result.data) {
          successAssets.push(result.data)
          if (onUploadSuccess) {
            onUploadSuccess(result.data)
          }
        } else {
          failedNames.push(file.name)
          if (result.error) {
            failedErrors.push(result.error)
          }
        }
      }

      clearInterval(progressInterval)

      if (successAssets.length > 0) {
        setUploadState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          success: true,
          error: failedNames.length > 0 ? (failedErrors[0] || `部分失败：${failedNames.length} 个文件上传失败`) : null,
        }))

        if (failedNames.length === 0) {
          if (selectedFiles.length > 1) {
            toast.success(`批量上传成功，共 ${selectedFiles.length} 张图片`)
          } else {
            toast.success('图片上传成功！')
          }
        } else {
          toast.warning(`已上传 ${successAssets.length} 张，失败 ${failedNames.length} 张`)
        }

        setTimeout(() => {
          setUploadState({
            file: null,
            preview: null,
            uploading: false,
            progress: 0,
            error: null,
            success: false,
          })
          setSelectedFiles([])
          if (onUploadComplete) {
            onUploadComplete()
          }
        }, 2000)
      } else {
        throw new Error(failedErrors[0] || '上传失败，请重试')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '上传失败，请重试'

      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: errorMessage,
        success: false,
      }))

      toast.error(errorMessage)
    }
  }, [selectedFiles, folderId, onUploadSuccess, onUploadComplete])

  // 重试上传
  const handleRetry = useCallback(() => {
    handleUpload()
  }, [handleUpload])

  // 取消/清除
  const handleClear = useCallback(() => {
    setUploadState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
    setSelectedFiles([])
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="p-6">
        {/* 未登录提示 */}
        {!isAuthenticated && (
          <div className="text-center py-12">
            <LogIn className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">需要登录</h3>
            <p className="text-gray-600 mb-6">
              请先登录后再上传图片
            </p>
            <Button onClick={() => {
              toast.info('请点击右上角用户图标登录')
              if (onUploadComplete) onUploadComplete()
            }}>
              知道了
            </Button>
          </div>
        )}

        {/* 已登录 - 显示上传界面 */}
        {isAuthenticated && (
          <>
            {/* 上传区域 */}
            {!uploadState.preview && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <input
              ref={folderInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFolderInputChange}
              {...({ webkitdirectory: '', directory: '' } as any)}
            />

            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              拖拽图片到此处或点击选择
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF 等图片格式，最大 10MB
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  folderInputRef.current?.click()
                }}
              >
                选择文件夹上传
              </Button>
            </div>
          </div>
        )}

        {/* 预览和上传区域 */}
        {uploadState.preview && (
          <div className="space-y-4">
            {/* 预览图片 */}
            <div className="relative">
              <img
                src={uploadState.preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              {!uploadState.uploading && !uploadState.success && (
                <button
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 文件信息 */}
            <div className="text-sm text-gray-600">
              <p className="font-medium">{uploadState.file?.name}</p>
              <p className="text-gray-500">
                {uploadState.file &&
                  `${(uploadState.file.size / 1024 / 1024).toFixed(2)} MB`}
              </p>
              {selectedFiles.length > 1 && (
                <p className="text-gray-500">
                  已选择 {selectedFiles.length} 张图片（将批量上传）
                </p>
              )}
            </div>

            {/* 上传进度 */}
            {uploadState.uploading && (
              <div className="space-y-2">
                <Progress value={uploadState.progress} className="w-full" />
                <p className="text-sm text-center text-gray-600">
                  上传中... {uploadState.progress}%
                </p>
              </div>
            )}

            {/* 成功状态 */}
            {uploadState.success && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">上传成功！</span>
              </div>
            )}

            {/* 错误状态 */}
            {uploadState.error && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">上传失败</p>
                    <p className="text-sm">{uploadState.error}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 上传按钮 */}
            {!uploadState.uploading &&
              !uploadState.success &&
              !uploadState.error && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    className="flex-1"
                    disabled={!uploadState.file}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFiles.length > 1 ? `批量上传 ${selectedFiles.length} 张` : '上传图片'}
                  </Button>
                  <Button onClick={handleClear} variant="outline">
                    取消
                  </Button>
                </div>
              )}
          </div>
        )}
          </>
        )}
      </Card>
    </div>
  )
}
