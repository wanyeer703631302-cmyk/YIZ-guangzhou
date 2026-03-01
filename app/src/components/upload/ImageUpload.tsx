/**
 * 图片上传组件
 * 支持拖拽上传、点击选择、预览、进度显示和错误处理
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { apiClient } from '../../services/api'
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

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
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
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  // 上传文件
  const handleUpload = useCallback(async () => {
    if (!uploadState.file) return

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

      // 调用API上传
      const result = await apiClient.uploadAsset(uploadState.file, {
        title: uploadState.file.name,
        folderId,
      })

      clearInterval(progressInterval)

      if (result.success && result.data) {
        setUploadState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          success: true,
          error: null,
        }))

        toast.success('图片上传成功！')

        // 调用成功回调
        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }

        // 延迟后重置状态并调用完成回调
        setTimeout(() => {
          setUploadState({
            file: null,
            preview: null,
            uploading: false,
            progress: 0,
            error: null,
            success: false,
          })
          if (onUploadComplete) {
            onUploadComplete()
          }
        }, 2000)
      } else {
        throw new Error(result.error || '上传失败')
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
  }, [uploadState.file, folderId, onUploadSuccess, onUploadComplete])

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
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="p-6">
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
              className="hidden"
              onChange={handleFileInputChange}
            />

            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              拖拽图片到此处或点击选择
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF 等图片格式，最大 10MB
            </p>
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
                    上传图片
                  </Button>
                  <Button onClick={handleClear} variant="outline">
                    取消
                  </Button>
                </div>
              )}
          </div>
        )}
      </Card>
    </div>
  )
}
