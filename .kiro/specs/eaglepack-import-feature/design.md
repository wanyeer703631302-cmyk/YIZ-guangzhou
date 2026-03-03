# Design Document: EaglePack Import Feature

## Overview

本设计文档描述了 EaglePack 导入功能的技术实现方案。该功能允许用户导入 Eagle 设计资源管理工具导出的 .eaglepack 文件，解析其中的图片和元数据，并将其集成到现有的图片管理系统中。

EaglePack 文件本质上是一个 ZIP 压缩包，包含：
- 图片文件（PNG、JPG、GIF、SVG、WEBP 等格式）
- metadata.json 文件（包含标签、分类、注释等元数据）

系统将采用流式处理方式，支持大文件导入，提供实时进度反馈，并具备完善的错误处理和恢复机制。

## Architecture

### 整体架构

```
┌─────────────┐
│   Client    │
│  (Upload)   │
└──────┬──────┘
       │ POST /api/import-eaglepack
       │ multipart/form-data
       ▼
┌─────────────────────────────────────┐
│     Import Handler (API Route)      │
│  - 文件验证                          │
│  - 认证检查                          │
│  - 调用导入服务                      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│    EaglePackImportService           │
│  - 解压缩管理                        │
│  - 元数据解析                        │
│  - 图片提取                          │
│  - 进度跟踪                          │
└──────────┬──────────────────────────┘
           │
           ├──────────────┬──────────────┐
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Unzipper │   │ Metadata │   │  Image   │
    │          │   │  Parser  │   │Extractor │
    └──────────┘   └──────────┘   └──────────┘
           │              │              │
           └──────────────┴──────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │   Asset Storage Layer   │
           │  - Cloudinary Upload    │
           │  - Database Persistence │
           │  - Tag Management       │
           └─────────────────────────┘
```

### 处理流程

1. **上传阶段**：接收 .eaglepack 文件，验证格式和大小
2. **解压阶段**：流式解压缩文件到临时目录
3. **解析阶段**：读取并解析 metadata.json
4. **提取阶段**：遍历图片文件，提取二进制数据
5. **导入阶段**：上传到 Cloudinary，保存到数据库，关联元数据
6. **清理阶段**：删除临时文件，生成导入报告

## Components and Interfaces

### 1. API Route Handler

**文件**: `api/import-eaglepack.ts`

```typescript
interface ImportRequest {
  file: Buffer // .eaglepack 文件
  userId: string // 从认证中获取
  options?: {
    skipExisting?: boolean // 跳过已存在的图片
    overwriteExisting?: boolean // 覆盖已存在的图片
  }
}

interface ImportResponse {
  success: boolean
  data?: ImportResult
  error?: string
}

interface ImportResult {
  summary: {
    totalFiles: number
    successCount: number
    failedCount: number
    skippedCount: number
    newTagsCount: number
    newCategoriesCount: number
    duration: number // 毫秒
  }
  assets: AssetImportInfo[]
  errors: ImportError[]
}

interface AssetImportInfo {
  filename: string
  assetId: string
  status: 'success' | 'failed' | 'skipped'
  tags: string[]
  category?: string
}

interface ImportError {
  filename: string
  error: string
  phase: 'unzip' | 'parse' | 'extract' | 'upload' | 'database'
}
```

### 2. EaglePackImportService

**文件**: `lib/eaglepack-import-service.ts`

核心服务类，负责协调整个导入流程。

```typescript
class EaglePackImportService {
  constructor(
    private userId: string,
    private options: ImportOptions
  ) {}

  /**
   * 执行完整的导入流程
   */
  async import(fileBuffer: Buffer): Promise<ImportResult>

  /**
   * 解压 .eaglepack 文件到临时目录
   */
  private async unzip(fileBuffer: Buffer): Promise<string>

  /**
   * 解析 metadata.json 文件
   */
  private async parseMetadata(tempDir: string): Promise<EagleMetadata>

  /**
   * 提取并导入所有图片
   */
  private async importImages(
    tempDir: string,
    metadata: EagleMetadata
  ): Promise<AssetImportInfo[]>

  /**
   * 清理临时文件
   */
  private async cleanup(tempDir: string): Promise<void>

  /**
   * 生成导入报告
   */
  private generateReport(
    results: AssetImportInfo[],
    errors: ImportError[],
    startTime: number
  ): ImportResult
}
```

### 3. Metadata Parser

**文件**: `lib/eaglepack-metadata-parser.ts`

负责解析 Eagle 的 metadata.json 格式。

```typescript
interface EagleMetadata {
  version: string
  images: EagleImageMetadata[]
}

interface EagleImageMetadata {
  id: string
  name: string
  filename: string
  tags: string[]
  folders?: string[] // Eagle 的文件夹结构
  annotation?: string
  width?: number
  height?: number
  modificationTime?: number
}

class MetadataParser {
  /**
   * 解析 metadata.json 文件
   */
  async parse(filePath: string): Promise<EagleMetadata>

  /**
   * 验证元数据格式
   */
  private validate(data: unknown): EagleMetadata

  /**
   * 构建文件名到元数据的映射
   */
  buildFilenameMap(metadata: EagleMetadata): Map<string, EagleImageMetadata>
}
```

### 4. Image Extractor

**文件**: `lib/eaglepack-image-extractor.ts`

负责从解压目录中提取图片文件。

```typescript
interface ExtractedImage {
  filename: string
  buffer: Buffer
  mimetype: string
  size: number
}

class ImageExtractor {
  private readonly SUPPORTED_FORMATS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'
  ]

  /**
   * 从目录中提取所有支持的图片文件
   */
  async extractImages(directory: string): Promise<ExtractedImage[]>

  /**
   * 检查文件是否为支持的图片格式
   */
  private isSupportedFormat(filename: string): boolean

  /**
   * 读取图片文件为 Buffer
   */
  private async readImageFile(filePath: string): Promise<Buffer>

  /**
   * 根据文件扩展名推断 MIME 类型
   */
  private getMimeType(filename: string): string
}
```

### 5. Asset Importer

**文件**: `lib/eaglepack-asset-importer.ts`

负责将提取的图片导入到系统中。

```typescript
class AssetImporter {
  constructor(private userId: string) {}

  /**
   * 导入单个图片资源
   */
  async importAsset(
    image: ExtractedImage,
    metadata: EagleImageMetadata
  ): Promise<AssetImportInfo>

  /**
   * 上传图片到 Cloudinary
   */
  private async uploadToCloudinary(
    buffer: Buffer,
    filename: string
  ): Promise<CloudinaryResult>

  /**
   * 保存资源记录到数据库
   */
  private async saveToDatabase(
    cloudinaryResult: CloudinaryResult,
    metadata: EagleImageMetadata,
    size: number
  ): Promise<string>

  /**
   * 处理标签关联
   */
  private async associateTags(
    assetId: string,
    tags: string[]
  ): Promise<void>

  /**
   * 检查资源是否已存在
   */
  private async checkExisting(
    filename: string
  ): Promise<string | null>
}
```

### 6. Progress Tracker

**文件**: `lib/eaglepack-progress-tracker.ts`

负责跟踪导入进度（可选，用于未来支持 WebSocket 实时进度）。

```typescript
interface ProgressUpdate {
  phase: 'unzip' | 'parse' | 'import' | 'cleanup'
  totalFiles: number
  processedFiles: number
  currentFile?: string
  percentage: number
}

class ProgressTracker {
  private totalFiles: number = 0
  private processedFiles: number = 0

  setTotal(total: number): void
  increment(): void
  getProgress(): ProgressUpdate
}
```

## Data Models

### 数据库模型扩展

现有的 Prisma schema 已经包含了所需的模型（Asset, Tag, AssetTag），无需修改。但需要注意：

1. **Asset 模型**：存储导入的图片
   - `title`: 使用 Eagle 的图片名称
   - `url`: Cloudinary URL
   - `thumbnailUrl`: 自动生成的缩略图 URL
   - `size`: 文件大小
   - `userId`: 导入用户的 ID
   - `folderId`: 可选，如果需要映射 Eagle 的文件夹结构

2. **Tag 模型**：存储标签
   - 使用 `connectOrCreate` 策略，如果标签不存在则创建

3. **AssetTag 模型**：多对多关系
   - 关联 Asset 和 Tag

### Eagle Metadata 格式

Eagle 的 metadata.json 格式示例：

```json
{
  "version": "3.0",
  "images": [
    {
      "id": "LQWER123456",
      "name": "设计稿-首页",
      "filename": "design-homepage.png",
      "tags": ["UI设计", "首页", "移动端"],
      "folders": ["项目A", "设计稿"],
      "annotation": "首页设计第一版",
      "width": 1920,
      "height": 1080,
      "modificationTime": 1704067200000
    }
  ]
}
```

### 临时文件结构

解压后的临时目录结构：

```
/tmp/eaglepack-{uuid}/
  ├── metadata.json
  ├── images/
  │   ├── design-homepage.png
  │   ├── icon-user.svg
  │   └── photo-banner.jpg
  └── ...
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid EaglePack File Acceptance

*For any* valid .eaglepack file (valid ZIP format with .eaglepack extension), the Import_System should accept the file without returning a format error.

**Validates: Requirements 1.1**

### Property 2: Invalid File Format Rejection

*For any* file that is either not a valid ZIP format or does not have a .eaglepack extension, the Import_System should reject the file and return a descriptive format error.

**Validates: Requirements 1.2, 1.4**

### Property 3: Unzip and Content Access

*For any* valid .eaglepack file, after unzipping, all files contained in the archive should be accessible in the temporary directory.

**Validates: Requirements 2.1**

### Property 4: Metadata File Location

*For any* .eaglepack file containing a metadata.json file, the Import_System should successfully locate and identify the metadata.json file after unzipping.

**Validates: Requirements 2.2**

### Property 5: Image File Identification

*For any* .eaglepack file, the Import_System should identify all image files with supported formats (PNG, JPG, JPEG, GIF, SVG, WEBP) contained in the archive.

**Validates: Requirements 2.4, 4.2**

### Property 6: Metadata Parsing Round-Trip

*For any* valid EagleMetadata object, serializing it to JSON and then parsing it back should produce an equivalent object.

**Validates: Requirements 3.7**

### Property 7: Complete Metadata Extraction

*For any* valid metadata.json file, the Metadata_Parser should extract all specified fields (tags, folders/categories, annotations, filename) for each image entry.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6**

### Property 8: Invalid JSON Error Reporting

*For any* invalid JSON content, the Metadata_Parser should return a parsing error with information about the error location or nature.

**Validates: Requirements 3.2**

### Property 9: Image Binary Data Extraction

*For any* supported image file in the archive, the Image_Extractor should successfully extract the complete binary data as a Buffer.

**Validates: Requirements 4.1**

### Property 10: Unsupported Format Handling

*For any* .eaglepack file containing a mix of supported and unsupported file formats, the Image_Extractor should skip unsupported files, log warnings, and continue processing supported files.

**Validates: Requirements 4.3**

### Property 11: Filename Preservation

*For any* image file extracted from the archive, the original filename should be preserved in the extraction result.

**Validates: Requirements 4.4**

### Property 12: Cloudinary Upload Success

*For any* valid image buffer with supported format, uploading to Cloudinary should return a secure URL and public ID.

**Validates: Requirements 5.1**

### Property 13: Database Record Creation

*For any* successfully uploaded image, a corresponding Asset record should be created in the database with all required fields populated.

**Validates: Requirements 5.2**

### Property 14: Unique Identifier Generation

*For any* set of imported images, each should receive a unique identifier (CUID), and no two images should share the same ID.

**Validates: Requirements 5.3**

### Property 15: Duplicate Handling

*For any* image that already exists in the system (matched by filename or URL), the Import_System should respect the user's configuration option (skip or overwrite) and handle it accordingly.

**Validates: Requirements 5.4**

### Property 16: Timestamp Recording

*For any* imported image, the Asset record should have a createdAt timestamp that reflects the import time.

**Validates: Requirements 5.5**

### Property 17: Complete Metadata Association

*For any* successfully imported image with metadata, all metadata fields (tags, category/folder, annotation) should be correctly associated with the Asset record in the database.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 18: New Metadata Entity Creation

*For any* tag or category name that does not exist in the system, the Import_System should create a new Tag or Folder entity before associating it with the asset.

**Validates: Requirements 6.4, 6.5**

### Property 19: One-to-One Metadata Mapping

*For any* imported image, there should be exactly one metadata entry associated with it, maintaining a one-to-one mapping between images and their metadata.

**Validates: Requirements 6.6**

### Property 20: Total File Count Reporting

*For any* .eaglepack file, the import result should report the correct total number of image files found in the archive.

**Validates: Requirements 7.1**

### Property 21: Success Count Accuracy

*For any* completed import operation, the number of successfully imported images in the report should equal the number of Asset records created in the database.

**Validates: Requirements 7.4**

### Property 22: Failure Reporting Completeness

*For any* import operation with failures, the report should list all failed files with specific error reasons, and the count should match the number of error entries.

**Validates: Requirements 7.5, 8.5**

### Property 23: Error Isolation

*For any* .eaglepack file containing a mix of valid and invalid images, a failure in importing one image should not prevent the Import_System from attempting to import the remaining images.

**Validates: Requirements 8.1**

### Property 24: Error Collection

*For any* import operation, all errors encountered during the process should be collected and included in the final error report, with no errors silently ignored.

**Validates: Requirements 8.3**

### Property 25: Complete Import Report Generation

*For any* completed import operation, the generated report should contain all required fields: summary statistics (total, success, failed, skipped counts), new tags/categories count, duration, asset list, and error list.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

## Error Handling

### Error Categories

1. **Validation Errors** (4xx)
   - Invalid file format
   - File size exceeded
   - Missing metadata.json
   - Invalid JSON format

2. **Processing Errors** (5xx)
   - Unzip failure
   - Cloudinary upload failure
   - Database save failure
   - Temporary file cleanup failure

3. **Partial Failures**
   - Individual image import failures
   - Unsupported file format warnings
   - Corrupted image file warnings

### Error Handling Strategy

1. **Fail Fast for Critical Errors**
   - Invalid .eaglepack format → reject immediately
   - Missing metadata.json → reject immediately
   - Authentication failure → reject immediately

2. **Continue on Partial Failures**
   - Single image upload failure → log error, continue with next
   - Unsupported file format → skip file, log warning, continue
   - Corrupted image → skip file, log error, continue

3. **Cleanup on Fatal Errors**
   - If database connection fails → cleanup Cloudinary uploads
   - If process crashes → cleanup temporary files (via temp directory auto-cleanup)

4. **Error Response Format**

```typescript
{
  success: false,
  error: "主要错误信息",
  details?: {
    phase: "unzip" | "parse" | "import" | "cleanup",
    filename?: string,
    originalError?: string
  }
}
```

### Rollback Strategy

由于导入是一个多步骤过程，完全的事务回滚较为复杂。采用以下策略：

1. **No Rollback for Partial Success**
   - 如果部分图片成功导入，不回滚已成功的部分
   - 在报告中明确列出成功和失败的项目
   - 用户可以根据报告决定是否手动清理

2. **Cleanup on Complete Failure**
   - 如果在任何图片导入前发生致命错误，不会有数据残留
   - 临时文件通过 OS 的 temp 目录机制自动清理

3. **Cloudinary Cleanup**
   - 如果 Cloudinary 上传成功但数据库保存失败，删除 Cloudinary 上的文件
   - 使用 try-catch-finally 确保清理代码执行

## Testing Strategy

### Unit Testing

使用 Vitest 进行单元测试，重点测试各个组件的独立功能：

1. **MetadataParser 测试**
   - 测试有效 JSON 解析
   - 测试无效 JSON 错误处理
   - 测试文件名映射构建
   - 测试边界情况（空数组、缺失字段）

2. **ImageExtractor 测试**
   - 测试支持格式识别
   - 测试文件读取
   - 测试 MIME 类型推断
   - 测试不支持格式跳过

3. **AssetImporter 测试**
   - Mock Cloudinary 和 Prisma
   - 测试单个资源导入流程
   - 测试标签关联逻辑
   - 测试重复检测

4. **EaglePackImportService 测试**
   - Mock 所有依赖
   - 测试完整导入流程
   - 测试错误处理和恢复
   - 测试报告生成

### Property-Based Testing

使用 fast-check 进行基于属性的测试，每个测试至少运行 100 次迭代：

1. **Property 2: Invalid File Format Rejection**
   ```typescript
   // Feature: eaglepack-import-feature, Property 2: Invalid file format rejection
   fc.assert(
     fc.property(
       fc.oneof(
         fc.record({ ext: fc.constantFrom('.txt', '.pdf', '.doc'), isZip: fc.constant(false) }),
         fc.record({ ext: fc.constant('.eaglepack'), isZip: fc.constant(false) })
       ),
       async (fileSpec) => {
         const result = await importService.validateFile(fileSpec)
         expect(result.success).toBe(false)
         expect(result.error).toContain('格式')
       }
     ),
     { numRuns: 100 }
   )
   ```

2. **Property 6: Metadata Parsing Round-Trip**
   ```typescript
   // Feature: eaglepack-import-feature, Property 6: Metadata parsing round-trip
   fc.assert(
     fc.property(
       eagleMetadataArbitrary,
       (metadata) => {
         const json = JSON.stringify(metadata)
         const parsed = metadataParser.parse(json)
         expect(parsed).toEqual(metadata)
       }
     ),
     { numRuns: 100 }
   )
   ```

3. **Property 11: Filename Preservation**
   ```typescript
   // Feature: eaglepack-import-feature, Property 11: Filename preservation
   fc.assert(
     fc.property(
       fc.array(fc.record({
         filename: fc.string({ minLength: 1, maxLength: 50 }),
         ext: fc.constantFrom('.png', '.jpg', '.gif')
       })),
       async (files) => {
         const extracted = await imageExtractor.extractImages(files)
         const extractedNames = extracted.map(e => e.filename)
         const originalNames = files.map(f => f.filename + f.ext)
         expect(extractedNames).toEqual(originalNames)
       }
     ),
     { numRuns: 100 }
   )
   ```

4. **Property 14: Unique Identifier Generation**
   ```typescript
   // Feature: eaglepack-import-feature, Property 14: Unique identifier generation
   fc.assert(
     fc.property(
       fc.array(validImageArbitrary, { minLength: 2, maxLength: 20 }),
       async (images) => {
         const result = await importService.import(images)
         const ids = result.assets.map(a => a.assetId)
         const uniqueIds = new Set(ids)
         expect(uniqueIds.size).toBe(ids.length)
       }
     ),
     { numRuns: 100 }
   )
   ```

5. **Property 23: Error Isolation**
   ```typescript
   // Feature: eaglepack-import-feature, Property 23: Error isolation
   fc.assert(
     fc.property(
       fc.array(
         fc.record({
           image: validImageArbitrary,
           shouldFail: fc.boolean()
         }),
         { minLength: 3, maxLength: 10 }
       ),
       async (testCases) => {
         const validCount = testCases.filter(tc => !tc.shouldFail).length
         const result = await importService.import(testCases)
         expect(result.summary.successCount).toBe(validCount)
         expect(result.summary.totalFiles).toBe(testCases.length)
       }
     ),
     { numRuns: 100 }
   )
   ```

### Integration Testing

1. **End-to-End Import Test**
   - 创建真实的 .eaglepack 文件
   - 执行完整导入流程
   - 验证数据库记录
   - 验证 Cloudinary 上传（使用测试环境）

2. **Error Scenario Tests**
   - 测试各种错误场景的端到端处理
   - 验证错误报告的完整性
   - 验证清理逻辑

### Test Data Generators

使用 fast-check 创建自定义生成器：

```typescript
// 生成有效的 Eagle 元数据
const eagleMetadataArbitrary = fc.record({
  version: fc.constant('3.0'),
  images: fc.array(
    fc.record({
      id: fc.hexaString({ minLength: 10, maxLength: 15 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      filename: fc.string({ minLength: 1, maxLength: 50 }),
      tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
      folders: fc.option(fc.array(fc.string(), { maxLength: 5 })),
      annotation: fc.option(fc.string({ maxLength: 200 })),
      width: fc.option(fc.integer({ min: 1, max: 4096 })),
      height: fc.option(fc.integer({ min: 1, max: 4096 })),
      modificationTime: fc.option(fc.integer({ min: 0 }))
    })
  )
})

// 生成有效的图片文件规格
const validImageArbitrary = fc.record({
  filename: fc.string({ minLength: 1, maxLength: 50 }),
  format: fc.constantFrom('png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'),
  size: fc.integer({ min: 1024, max: 5 * 1024 * 1024 }) // 1KB to 5MB
})
```

### Test Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 25 properties implemented
- Integration test coverage: All critical paths
- Error handling coverage: All error categories tested

