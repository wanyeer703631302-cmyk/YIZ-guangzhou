# ImageUpload Component

图片上传组件，支持拖拽上传、点击选择、预览、进度显示和错误处理。

## 功能特性

- ✅ 支持拖拽上传和点击选择文件
- ✅ 实时预览上传的图片
- ✅ 显示上传进度条
- ✅ 文件验证（类型和大小）
- ✅ 错误处理和重试功能
- ✅ 成功提示和自动刷新
- ✅ 响应式设计

## 使用方法

### 基本用法

```tsx
import { ImageUpload } from '@/components/upload'

function MyComponent() {
  return <ImageUpload />
}
```

### 带回调的用法

```tsx
import { ImageUpload } from '@/components/upload'
import { useState } from 'react'
import { apiClient } from '@/services/api'
import type { Asset } from '@/types/api'

function GalleryWithUpload() {
  const [assets, setAssets] = useState<Asset[]>([])

  // 刷新资源列表
  const refreshAssets = async () => {
    const result = await apiClient.getAssets()
    if (result.success && result.data) {
      setAssets(result.data.items)
    }
  }

  // 上传成功回调
  const handleUploadSuccess = (newAsset: Asset) => {
    console.log('新上传的资源:', newAsset)
    // 可以立即将新资源添加到列表
    setAssets((prev) => [newAsset, ...prev])
  }

  // 上传完成回调（在成功提示显示2秒后）
  const handleUploadComplete = () => {
    // 刷新完整的资源列表
    refreshAssets()
  }

  return (
    <div>
      <ImageUpload
        onUploadSuccess={handleUploadSuccess}
        onUploadComplete={handleUploadComplete}
      />
      
      {/* 显示资源列表 */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {assets.map((asset) => (
          <img
            key={asset.id}
            src={asset.thumbnailUrl}
            alt={asset.title}
            className="w-full h-48 object-cover rounded"
          />
        ))}
      </div>
    </div>
  )
}
```

### 指定文件夹上传

```tsx
import { ImageUpload } from '@/components/upload'

function FolderUpload() {
  const folderId = 'folder-123'

  return (
    <ImageUpload
      folderId={folderId}
      onUploadComplete={() => {
        console.log('上传到文件夹:', folderId)
      }}
    />
  )
}
```

## Props

| 属性 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `onUploadSuccess` | `(asset: Asset) => void` | 否 | - | 上传成功时的回调，接收新上传的资源对象 |
| `onUploadComplete` | `() => void` | 否 | - | 上传完成后的回调（在成功提示显示2秒后调用） |
| `folderId` | `string` | 否 | - | 指定上传到的文件夹ID |

## 文件验证

组件会自动验证上传的文件：

- **文件类型**: 只允许图片格式（image/*）
- **文件大小**: 最大 10MB

如果文件不符合要求，会显示错误提示。

## 错误处理

组件提供完整的错误处理：

1. **文件验证错误**: 显示具体的验证失败原因
2. **上传失败**: 显示 API 返回的错误信息
3. **重试选项**: 提供"重试"按钮重新上传
4. **取消选项**: 提供"取消"按钮清除当前文件

## 上传流程

1. 用户拖拽或点击选择图片文件
2. 组件验证文件类型和大小
3. 显示图片预览
4. 用户点击"上传图片"按钮
5. 显示上传进度条
6. 上传成功后显示成功提示
7. 2秒后自动清除并调用 `onUploadComplete`

## 样式定制

组件使用 Tailwind CSS 和 shadcn/ui 组件库，可以通过修改 className 来定制样式。

## 依赖

- `lucide-react`: 图标库
- `sonner`: Toast 通知
- `@/components/ui/*`: shadcn/ui 组件
- `@/services/api`: API 客户端
- `@/types/api`: TypeScript 类型定义
