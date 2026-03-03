# Design Document: Batch Upload Feature

## Overview

批量上传功能允许用户选择整个文件夹进行批量图片上传，系统会递归扫描文件夹内的所有图片文件，并提供实时进度反馈、错误处理和重试机制。该功能基于现有的单文件上传API，通过前端协调多个上传任务来实现批量处理。

### Key Design Decisions

1. **前端驱动的批量处理**：批量上传逻辑主要在前端实现，复用现有的 `/api/upload` 端点进行单文件上传，避免后端大规模重构
2. **并发控制**：限制同时进行的上传数量为5个，平衡上传速度和系统资源
3. **文件夹结构保留**：通过在数据库中记录相对路径信息来保留原始文件夹层次结构
4. **渐进式增强**：在现有 `ImageUpload` 组件基础上扩展，保持向后兼容性
5. **错误恢复**：实现自动重试机制（最多3次）和手动批量重试功能

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BatchUploadModal                         │
│  (Main UI Component - Modal Dialog)                         │
│                                                              │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │  FolderSelector    │  │   UploadProgressPanel        │  │
│  │  - Folder input    │  │   - Progress bar             │  │
│  │  - File count      │  │   - File list with status    │  │
│  └────────────────────┘  │   - Speed indicator          │  │
│                          │   - Control buttons          │  │
│  ┌────────────────────┐  └──────────────────────────────┘  │
│  │  FileScanner       │                                     │
│  │  - Recursive scan  │  ┌──────────────────────────────┐  │
│  │  - Format filter   │  │   ErrorSummary               │  │
│  │  - Size validation │  │   - Failed files list        │  │
│  └────────────────────┘  │   - Retry button             │  │
│                          └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   UploadManager       │
                  │   - Task queue        │
                  │   - Concurrency ctrl  │
                  │   - State management  │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   apiClient.upload    │
                  │   (Existing API)      │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   Backend Services    │
                  │   - Cloudinary        │
                  │   - Prisma DB         │
                  └───────────────────────┘
```

### Data Flow

1. **文件夹选择阶段**：
   - 用户通过 `<input type="file" webkitdirectory>` 选择文件夹
   - `FileScanner` 递归扫描所有文件，过滤出支持的图片格式
   - 验证文件大小和可读性，排除无效文件
   - 显示发现的文件总数和文件夹结构预览

2. **上传准备阶段**：
   - `UploadManager` 为每个有效文件创建 `UploadTask`
   - 保存文件的相对路径信息（用于重建文件夹结构）
   - 初始化进度跟踪器

3. **上传执行阶段**：
   - `UploadManager` 使用任务队列管理上传
   - 维护最多5个并发上传
   - 每个任务调用现有的 `apiClient.uploadAsset` API
   - 实时更新进度信息（完成数、百分比、速度）

4. **错误处理阶段**：
   - 失败的任务自动重试（最多3次，间隔2秒）
   - 重试失败后加入失败列表
   - 用户可以批量重试所有失败的上传

5. **完成阶段**：
   - 显示上传摘要（总数、成功数、失败数）
   - 提供导出失败文件列表的选项
   - 刷新图库以显示新上传的图片

## Components and Interfaces

### 1. BatchUploadModal Component

主要的批量上传UI组件，以模态对话框形式呈现。

```typescript
interface BatchUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete?: (results: UploadResults) => void
  defaultFolderId?: string
}

interface UploadResults {
  total: number
  successful: number
  failed: number
  uploadedAssets: Asset[]
  failedFiles: FailedFile[]
}
```

### 2. FileScanner Module

负责文件夹扫描和文件验证。

```typescript
interface ScanResult {
  validFiles: FileWithPath[]
  invalidFiles: InvalidFile[]
  totalSize: number
  folderStructure: FolderNode
}

interface FileWithPath {
  file: File
  relativePath: string  // e.g., "subfolder/image.jpg"
  size: number
}

interface InvalidFile {
  path: string
  reason: 'unsupported_format' | 'too_large' | 'unreadable'
  details: string
}

interface FolderNode {
  name: string
  files: string[]
  subfolders: FolderNode[]
}

class FileScanner {
  /**
   * Scan files from folder input and validate them
   */
  async scanFolder(files: FileList): Promise<ScanResult>
  
  /**
   * Validate single file
   */
  validateFile(file: File): ValidationResult
  
  /**
   * Build folder structure tree
   */
  buildFolderStructure(files: FileWithPath[]): FolderNode
}
```

### 3. UploadManager Class

管理上传任务队列和并发控制。

```typescript
interface UploadTask {
  id: string
  file: FileWithPath
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  progress: number
  error?: string
  retryCount: number
  uploadedAsset?: Asset
}

interface UploadManagerConfig {
  maxConcurrent: number  // Default: 5
  maxRetries: number     // Default: 3
  retryDelay: number     // Default: 2000ms
  folderId?: string
}

interface UploadProgress {
  completed: number
  total: number
  percentage: number
  speed: number  // MB/s
  tasks: UploadTask[]
}

class UploadManager {
  private tasks: UploadTask[] = []
  private activeUploads: Set<string> = new Set()
  private config: UploadManagerConfig
  private isPaused: boolean = false
  private isCancelled: boolean = false
  
  constructor(config: UploadManagerConfig)
  
  /**
   * Add files to upload queue
   */
  addFiles(files: FileWithPath[]): void
  
  /**
   * Start upload process
   */
  async start(
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResults>
  
  /**
   * Pause all ongoing uploads
   */
  pause(): void
  
  /**
   * Resume paused uploads
   */
  resume(): void
  
  /**
   * Cancel all uploads and cleanup
   */
  cancel(): void
  
  /**
   * Retry all failed uploads
   */
  async retryFailed(): Promise<void>
  
  /**
   * Get current progress
   */
  getProgress(): UploadProgress
  
  /**
   * Process next task in queue (internal)
   */
  private async processNext(): Promise<void>
  
  /**
   * Upload single file with retry logic (internal)
   */
  private async uploadFile(task: UploadTask): Promise<void>
}
```

### 4. UploadProgressPanel Component

显示上传进度的UI组件。

```typescript
interface UploadProgressPanelProps {
  progress: UploadProgress
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  isPaused: boolean
}
```

### 5. ErrorSummary Component

显示失败文件列表和重试选项。

```typescript
interface ErrorSummaryProps {
  failedTasks: UploadTask[]
  onRetryAll: () => void
  onRetryOne: (taskId: string) => void
  onExport: () => void
}
```

### 6. API Extensions

扩展现有的 API 客户端以支持批量上传所需的元数据。

```typescript
// Extend existing uploadAsset to accept relativePath
interface UploadOptions {
  title?: string
  folderId?: string
  tags?: string[]
  relativePath?: string  // NEW: for preserving folder structure
}

// In apiClient
async uploadAsset(
  file: File,
  options: UploadOptions
): Promise<ApiResponse<Asset>>
```

### 7. Database Schema Extension

扩展 Asset 模型以存储文件夹结构信息。

```prisma
model Asset {
  // ... existing fields ...
  relativePath String?  // NEW: e.g., "subfolder/image.jpg"
}
```

## Data Models

### Frontend State Models

```typescript
// Upload task state
type TaskStatus = 'pending' | 'uploading' | 'completed' | 'failed'

interface UploadTask {
  id: string
  file: FileWithPath
  status: TaskStatus
  progress: number
  error?: string
  retryCount: number
  uploadedAsset?: Asset
  startTime?: number
  endTime?: number
}

// Batch upload state
interface BatchUploadState {
  phase: 'selecting' | 'scanning' | 'ready' | 'uploading' | 'paused' | 'completed' | 'cancelled'
  scanResult: ScanResult | null
  uploadManager: UploadManager | null
  progress: UploadProgress | null
  isPaused: boolean
}

// Progress tracking
interface UploadProgress {
  completed: number
  total: number
  percentage: number
  speed: number
  estimatedTimeRemaining: number
  tasks: UploadTask[]
  startTime: number
  bytesUploaded: number
  totalBytes: number
}
```

### Backend Data Models

```typescript
// Extended Asset model (Prisma)
interface Asset {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  size: number
  folderId: string | null
  userId: string
  relativePath: string | null  // NEW: preserves folder structure
  createdAt: Date
  updatedAt: Date
}

// Folder structure reconstruction
interface ReconstructedFolder {
  name: string
  assets: Asset[]
  subfolders: ReconstructedFolder[]
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Recursive Folder Scanning Completeness

*For any* folder structure with nested subfolders, recursively scanning the folder should discover all image files at all nesting levels, regardless of depth.

**Validates: Requirements 1.2, 1.3**

### Property 2: File Count Display Accuracy

*For any* completed scan result, the displayed total count of discovered image files should equal the actual number of valid image files found by the scanner.

**Validates: Requirements 1.4**

### Property 3: Format Filtering Correctness

*For any* set of files with mixed extensions, the file scanner should include only files with supported image formats (JPG, JPEG, PNG, GIF, WEBP) and exclude all other file types.

**Validates: Requirements 1.5**

### Property 4: Task Creation Completeness

*For any* set of validated image files, when the user confirms upload, the upload manager should create exactly one upload task for each file, with no duplicates or omissions.

**Validates: Requirements 2.1**

### Property 5: Concurrency Limit Enforcement

*For any* batch upload in progress, at any given moment, the number of simultaneously active upload tasks should never exceed 5.

**Validates: Requirements 2.2**

### Property 6: Task Completion State Transition

*For any* upload task that completes successfully (receives success response from API), the upload manager should immediately mark that task's status as 'completed'.

**Validates: Requirements 2.3**

### Property 7: Folder Structure Preservation

*For any* set of files with relative paths in a folder hierarchy, after uploading, the stored relative paths in the database should preserve the original folder structure and file ordering from the source hierarchy.

**Validates: Requirements 2.4, 2.5**

### Property 8: Progress Display Accuracy

*For any* upload state, the progress tracker should display completion numbers and percentage that accurately reflect the actual state: displayed completed count equals actual completed tasks, displayed total equals actual total tasks, and displayed percentage equals (completed / total) × 100.

**Validates: Requirements 3.1, 3.2**

### Property 9: Upload Speed Calculation

*For any* upload progress data with bytes uploaded and time elapsed, the displayed upload speed should equal (bytes uploaded / time elapsed) converted to megabytes per second.

**Validates: Requirements 3.4**

### Property 10: Task Status Display Accuracy

*For any* upload task, the displayed status (pending, uploading, completed, failed) should match the actual current status of that task in the upload manager.

**Validates: Requirements 3.5**

### Property 11: Summary Accuracy

*For any* completed batch upload, the displayed summary counts (total files, successful uploads, failed uploads) should match the actual counts from the upload results.

**Validates: Requirements 3.6**

### Property 12: Failure Handling with Error Recording

*For any* upload task that fails (receives error response from API), the upload manager should mark the task status as 'failed' and record the error message, and the UI should display both the filename and the error reason.

**Validates: Requirements 4.1, 4.5**

### Property 13: Retry Logic with Failure List

*For any* upload task that fails, the system should automatically retry the upload up to 3 times, and if all retry attempts fail, the task should be added to the failed uploads list.

**Validates: Requirements 4.2, 4.4**

### Property 14: Batch Retry Functionality

*For any* set of failed upload tasks, triggering the "retry all" action should attempt to re-upload all tasks in the failed list.

**Validates: Requirements 4.6**

### Property 15: File Validation Rules

*For any* file encountered during scanning, the file scanner should validate that the file extension matches supported formats (JPG, JPEG, PNG, GIF, WEBP) and that the file size is less than 10 megabytes.

**Validates: Requirements 5.1, 5.2**

### Property 16: Invalid File Exclusion with Logging

*For any* file that fails validation (exceeds size limit or is unreadable), the file scanner should exclude it from the upload list and log the exclusion with the reason (warning for size, error for unreadable).

**Validates: Requirements 5.3, 5.5**

### Property 17: Readable File Verification

*For any* file being added to the upload list, the file scanner should verify that the file is readable before inclusion.

**Validates: Requirements 5.4**

### Property 18: Resume Functionality

*For any* paused upload state, when the user triggers resume, the upload manager should restart all suspended upload tasks and continue processing the queue.

**Validates: Requirements 6.4**

### Property 19: Cancel with Cleanup

*For any* ongoing batch upload, when the user triggers cancel, the upload manager should abort all active upload tasks and clean up temporary resources (clear task queue, reset state).

**Validates: Requirements 6.6**

### Property 20: Metadata Persistence Completeness

*For any* successfully completed upload task, the system should record all required metadata fields to the database: original filename (title), file size, upload timestamp (createdAt), storage path (url), and relative path.

**Validates: Requirements 7.1, 7.2**

### Property 21: Folder Structure Round-Trip

*For any* folder hierarchy uploaded to the system, reconstructing the folder structure from the database records (using relativePath fields) should produce an equivalent hierarchy with the same nesting relationships and file groupings.

**Validates: Requirements 7.3, 7.4**

### Property 22: Database Failure Recovery

*For any* upload task where database recording fails, the system should mark the task as failed and trigger the retry mechanism (up to 3 attempts).

**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **File System Errors**
   - Folder access denied
   - File read permission errors
   - File not found during upload

2. **Validation Errors**
   - Unsupported file format
   - File size exceeds limit
   - Corrupted file data

3. **Network Errors**
   - Upload timeout
   - Connection lost
   - API rate limiting

4. **Storage Errors**
   - Cloudinary upload failure
   - Storage quota exceeded

5. **Database Errors**
   - Database connection failure
   - Record creation failure
   - Transaction timeout

### Error Handling Strategies

#### 1. Validation Errors (Non-Retryable)

```typescript
// Exclude invalid files during scanning phase
if (file.size > MAX_FILE_SIZE) {
  invalidFiles.push({
    path: file.name,
    reason: 'too_large',
    details: `File size ${formatBytes(file.size)} exceeds limit of 10MB`
  })
  continue
}
```

#### 2. Network/Upload Errors (Retryable)

```typescript
// Automatic retry with exponential backoff
async uploadWithRetry(task: UploadTask): Promise<void> {
  for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
    try {
      const result = await apiClient.uploadAsset(task.file.file, {
        title: task.file.file.name,
        folderId: this.config.folderId,
        relativePath: task.file.relativePath
      })
      
      if (result.success) {
        task.status = 'completed'
        task.uploadedAsset = result.data
        return
      }
    } catch (error) {
      task.retryCount = attempt + 1
      
      if (attempt < this.config.maxRetries) {
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay)
        )
      } else {
        // All retries exhausted
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }
}
```

#### 3. Database Errors (Retryable with Cleanup)

```typescript
// Backend handles database failures with Cloudinary cleanup
try {
  const asset = await prisma.asset.create({ data: assetData })
  
  // Verify persistence
  const verified = await prisma.asset.findUnique({ 
    where: { id: asset.id } 
  })
  
  if (!verified) {
    throw new Error('Database verification failed')
  }
} catch (error) {
  // Cleanup Cloudinary upload
  await cloudinary.uploader.destroy(cloudinaryResult.public_id)
  throw error  // Propagate to trigger retry
}
```

#### 4. User-Initiated Cancellation

```typescript
// Graceful cancellation with cleanup
cancel(): void {
  this.isCancelled = true
  
  // Abort active uploads
  this.activeUploads.forEach(taskId => {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = 'failed'
      task.error = 'Cancelled by user'
    }
  })
  
  // Clear queue
  this.activeUploads.clear()
  
  // Cleanup resources
  this.tasks = []
}
```

### Error Display

```typescript
interface ErrorDisplay {
  // Individual file errors
  fileErrors: {
    filename: string
    error: string
    retryCount: number
  }[]
  
  // System-level errors
  systemErrors: {
    type: 'network' | 'storage' | 'database'
    message: string
    timestamp: Date
  }[]
  
  // Summary
  summary: {
    totalFailed: number
    retryableCount: number
    permanentFailures: number
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized test data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to implement property tests for the correctness properties defined above.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: batch-upload-feature, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { FileScanner } from './FileScanner'

describe('FileScanner Properties', () => {
  it('Property 3: Format Filtering Correctness', () => {
    // Feature: batch-upload-feature, Property 3: Format filtering correctness
    
    fc.assert(
      fc.property(
        fc.array(fc.record({
          name: fc.string(),
          extension: fc.oneof(
            fc.constantFrom('.jpg', '.jpeg', '.png', '.gif', '.webp'),
            fc.constantFrom('.txt', '.pdf', '.doc', '.mp4')
          )
        })),
        (files) => {
          const mockFiles = files.map(f => 
            new File([], f.name + f.extension, { 
              type: getTypeFromExtension(f.extension) 
            })
          )
          
          const scanner = new FileScanner()
          const result = scanner.scanFolder(mockFiles)
          
          // All included files should have supported extensions
          const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
          result.validFiles.every(f => 
            supportedExts.some(ext => f.file.name.endsWith(ext))
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing

Unit tests focus on specific scenarios and edge cases:

**1. File Scanner Tests**
```typescript
describe('FileScanner', () => {
  it('should exclude files larger than 10MB', () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg')
    const scanner = new FileScanner()
    const result = scanner.validateFile(largeFile)
    
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('too_large')
  })
  
  it('should handle empty folder', () => {
    const scanner = new FileScanner()
    const result = scanner.scanFolder([])
    
    expect(result.validFiles).toHaveLength(0)
    expect(result.invalidFiles).toHaveLength(0)
  })
})
```

**2. Upload Manager Tests**
```typescript
describe('UploadManager', () => {
  it('should not exceed concurrency limit', async () => {
    const files = createMockFiles(20)
    const manager = new UploadManager({ maxConcurrent: 5 })
    
    manager.addFiles(files)
    
    let maxConcurrent = 0
    await manager.start((progress) => {
      const activeCount = progress.tasks.filter(
        t => t.status === 'uploading'
      ).length
      maxConcurrent = Math.max(maxConcurrent, activeCount)
    })
    
    expect(maxConcurrent).toBeLessThanOrEqual(5)
  })
  
  it('should retry failed uploads', async () => {
    const mockApi = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true, data: mockAsset })
    
    const manager = new UploadManager({ maxRetries: 3 })
    const task = createMockTask()
    
    await manager.uploadFile(task)
    
    expect(mockApi).toHaveBeenCalledTimes(3)
    expect(task.status).toBe('completed')
  })
})
```

**3. Integration Tests**
```typescript
describe('Batch Upload Integration', () => {
  it('should complete full upload workflow', async () => {
    // 1. Scan folder
    const files = createMockFolderStructure()
    const scanner = new FileScanner()
    const scanResult = await scanner.scanFolder(files)
    
    // 2. Upload files
    const manager = new UploadManager({ maxConcurrent: 5 })
    manager.addFiles(scanResult.validFiles)
    
    const results = await manager.start((progress) => {
      console.log(`Progress: ${progress.percentage}%`)
    })
    
    // 3. Verify results
    expect(results.successful).toBe(scanResult.validFiles.length)
    expect(results.failed).toBe(0)
    
    // 4. Verify database records
    const assets = await prisma.asset.findMany({
      where: { id: { in: results.uploadedAssets.map(a => a.id) } }
    })
    expect(assets).toHaveLength(results.successful)
  })
})
```

**4. Error Handling Tests**
```typescript
describe('Error Handling', () => {
  it('should handle database failure with cleanup', async () => {
    const mockCloudinaryDestroy = vi.fn()
    const mockPrismaCreate = vi.fn().mockRejectedValue(
      new Error('Database connection failed')
    )
    
    const result = await uploadHandler(mockRequest, mockResponse)
    
    expect(mockCloudinaryDestroy).toHaveBeenCalled()
    expect(result.success).toBe(false)
  })
  
  it('should add to failed list after retry exhaustion', async () => {
    const manager = new UploadManager({ maxRetries: 3 })
    const mockApi = vi.fn().mockRejectedValue(new Error('Permanent failure'))
    
    manager.addFiles([createMockFile()])
    const results = await manager.start(() => {})
    
    expect(results.failed).toBe(1)
    expect(results.failedFiles).toHaveLength(1)
    expect(mockApi).toHaveBeenCalledTimes(4) // Initial + 3 retries
  })
})
```

### Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Property Tests**: All 22 correctness properties implemented
- **Unit Tests**: All error paths and edge cases covered
- **Integration Tests**: Complete workflows tested end-to-end

### Testing Tools

- **Vitest**: Test runner and assertion library
- **fast-check**: Property-based testing library
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **@testing-library/react**: Component testing utilities
