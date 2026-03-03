# Tasks: EaglePack Import Feature

## 1. 基础设施和类型定义

- [ ] 1.1 创建 TypeScript 类型定义文件 `lib/types/eaglepack.ts`
  - [ ] 1.1.1 定义 EagleMetadata 接口
  - [ ] 1.1.2 定义 EagleImageMetadata 接口
  - [ ] 1.1.3 定义 ImportRequest 接口
  - [ ] 1.1.4 定义 ImportResponse 接口
  - [ ] 1.1.5 定义 ImportResult 接口
  - [ ] 1.1.6 定义 AssetImportInfo 接口
  - [ ] 1.1.7 定义 ImportError 接口
  - [ ] 1.1.8 定义 ExtractedImage 接口

- [ ] 1.2 安装必要的依赖包
  - [ ] 1.2.1 安装 `adm-zip` 用于 ZIP 文件处理
  - [ ] 1.2.2 安装 `@types/adm-zip` 类型定义
  - [ ] 1.2.3 验证 `fast-check` 已安装用于属性测试

## 2. 元数据解析器实现

- [ ] 2.1 创建 `lib/eaglepack-metadata-parser.ts`
  - [ ] 2.1.1 实现 MetadataParser 类
  - [ ] 2.1.2 实现 parse() 方法读取和解析 JSON
  - [ ] 2.1.3 实现 validate() 方法验证元数据格式
  - [ ] 2.1.4 实现 buildFilenameMap() 方法构建文件名映射
  - [ ] 2.1.5 添加错误处理和详细错误信息

- [ ] 2.2 为 MetadataParser 编写单元测试
  - [ ] 2.2.1 测试有效 JSON 解析
  - [ ] 2.2.2 测试无效 JSON 错误处理
  - [ ] 2.2.3 测试缺失必需字段的处理
  - [ ] 2.2.4 测试文件名映射构建

- [ ] 2.3 为 MetadataParser 编写属性测试
  - [ ] 2.3.1 创建 eagleMetadataArbitrary 生成器
  - [ ] 2.3.2 实现 Property 6: Metadata Parsing Round-Trip
  - [ ] 2.3.3 实现 Property 7: Complete Metadata Extraction
  - [ ] 2.3.4 实现 Property 8: Invalid JSON Error Reporting

## 3. 图片提取器实现

- [ ] 3.1 创建 `lib/eaglepack-image-extractor.ts`
  - [ ] 3.1.1 实现 ImageExtractor 类
  - [ ] 3.1.2 实现 extractImages() 方法遍历目录
  - [ ] 3.1.3 实现 isSupportedFormat() 方法检查格式
  - [ ] 3.1.4 实现 readImageFile() 方法读取文件
  - [ ] 3.1.5 实现 getMimeType() 方法推断 MIME 类型
  - [ ] 3.1.6 添加不支持格式的跳过逻辑

- [ ] 3.2 为 ImageExtractor 编写单元测试
  - [ ] 3.2.1 测试支持格式识别
  - [ ] 3.2.2 测试不支持格式跳过
  - [ ] 3.2.3 测试文件读取
  - [ ] 3.2.4 测试 MIME 类型推断

- [ ] 3.3 为 ImageExtractor 编写属性测试
  - [ ] 3.3.1 创建 validImageArbitrary 生成器
  - [ ] 3.3.2 实现 Property 9: Image Binary Data Extraction
  - [ ] 3.3.3 实现 Property 10: Unsupported Format Handling
  - [ ] 3.3.4 实现 Property 11: Filename Preservation

## 4. 资源导入器实现

- [ ] 4.1 创建 `lib/eaglepack-asset-importer.ts`
  - [ ] 4.1.1 实现 AssetImporter 类
  - [ ] 4.1.2 实现 importAsset() 方法协调导入流程
  - [ ] 4.1.3 实现 uploadToCloudinary() 方法上传图片
  - [ ] 4.1.4 实现 saveToDatabase() 方法保存记录
  - [ ] 4.1.5 实现 associateTags() 方法关联标签
  - [ ] 4.1.6 实现 checkExisting() 方法检查重复
  - [ ] 4.1.7 添加 Cloudinary 失败时的清理逻辑

- [ ] 4.2 为 AssetImporter 编写单元测试（使用 Mock）
  - [ ] 4.2.1 Mock Cloudinary 上传
  - [ ] 4.2.2 Mock Prisma 数据库操作
  - [ ] 4.2.3 测试单个资源导入流程
  - [ ] 4.2.4 测试标签关联逻辑
  - [ ] 4.2.5 测试重复检测逻辑
  - [ ] 4.2.6 测试错误处理和清理

- [ ] 4.3 为 AssetImporter 编写属性测试
  - [ ] 4.3.1 实现 Property 12: Cloudinary Upload Success
  - [ ] 4.3.2 实现 Property 13: Database Record Creation
  - [ ] 4.3.3 实现 Property 14: Unique Identifier Generation
  - [ ] 4.3.4 实现 Property 15: Duplicate Handling
  - [ ] 4.3.5 实现 Property 16: Timestamp Recording
  - [ ] 4.3.6 实现 Property 17: Complete Metadata Association
  - [ ] 4.3.7 实现 Property 18: New Metadata Entity Creation
  - [ ] 4.3.8 实现 Property 19: One-to-One Metadata Mapping

## 5. 导入服务实现

- [ ] 5.1 创建 `lib/eaglepack-import-service.ts`
  - [ ] 5.1.1 实现 EaglePackImportService 类
  - [ ] 5.1.2 实现 import() 主方法协调整个流程
  - [ ] 5.1.3 实现 unzip() 方法解压文件
  - [ ] 5.1.4 实现 parseMetadata() 方法调用解析器
  - [ ] 5.1.5 实现 importImages() 方法批量导入
  - [ ] 5.1.6 实现 cleanup() 方法清理临时文件
  - [ ] 5.1.7 实现 generateReport() 方法生成报告
  - [ ] 5.1.8 添加进度跟踪逻辑
  - [ ] 5.1.9 添加错误收集逻辑

- [ ] 5.2 为 EaglePackImportService 编写单元测试
  - [ ] 5.2.1 Mock 所有依赖组件
  - [ ] 5.2.2 测试完整导入流程
  - [ ] 5.2.3 测试解压缩功能
  - [ ] 5.2.4 测试元数据解析调用
  - [ ] 5.2.5 测试批量导入逻辑
  - [ ] 5.2.6 测试临时文件清理
  - [ ] 5.2.7 测试报告生成

- [ ] 5.3 为 EaglePackImportService 编写属性测试
  - [ ] 5.3.1 实现 Property 3: Unzip and Content Access
  - [ ] 5.3.2 实现 Property 4: Metadata File Location
  - [ ] 5.3.3 实现 Property 5: Image File Identification
  - [ ] 5.3.4 实现 Property 20: Total File Count Reporting
  - [ ] 5.3.5 实现 Property 21: Success Count Accuracy
  - [ ] 5.3.6 实现 Property 22: Failure Reporting Completeness
  - [ ] 5.3.7 实现 Property 23: Error Isolation
  - [ ] 5.3.8 实现 Property 24: Error Collection
  - [ ] 5.3.9 实现 Property 25: Complete Import Report Generation

## 6. API 路由实现

- [ ] 6.1 创建 `api/import-eaglepack.ts`
  - [ ] 6.1.1 配置 Multer 中间件接受 .eaglepack 文件
  - [ ] 6.1.2 实现文件验证逻辑（扩展名、大小、ZIP 格式）
  - [ ] 6.1.3 集成 withAuth 中间件进行认证
  - [ ] 6.1.4 调用 EaglePackImportService 执行导入
  - [ ] 6.1.5 处理导入选项（skipExisting, overwriteExisting）
  - [ ] 6.1.6 格式化响应数据
  - [ ] 6.1.7 添加错误处理和适当的 HTTP 状态码
  - [ ] 6.1.8 配置 bodyParser: false

- [ ] 6.2 为 API 路由编写属性测试
  - [ ] 6.2.1 实现 Property 1: Valid EaglePack File Acceptance
  - [ ] 6.2.2 实现 Property 2: Invalid File Format Rejection

## 7. 集成测试

- [ ] 7.1 创建测试辅助工具
  - [ ] 7.1.1 创建生成测试 .eaglepack 文件的工具函数
  - [ ] 7.1.2 创建清理测试数据的工具函数
  - [ ] 7.1.3 配置测试环境的 Cloudinary 凭证

- [ ] 7.2 编写端到端集成测试
  - [ ] 7.2.1 测试完整的成功导入流程
  - [ ] 7.2.2 测试包含部分失败的导入流程
  - [ ] 7.2.3 测试重复图片处理
  - [ ] 7.2.4 测试标签和分类创建
  - [ ] 7.2.5 测试错误场景（缺失 metadata.json）
  - [ ] 7.2.6 测试错误场景（损坏的 ZIP 文件）
  - [ ] 7.2.7 验证数据库记录正确性
  - [ ] 7.2.8 验证 Cloudinary 上传（使用测试环境）

## 8. 文档和部署

- [ ] 8.1 更新 API 文档
  - [ ] 8.1.1 在 README.md 中添加 EaglePack 导入 API 说明
  - [ ] 8.1.2 提供请求示例（curl 和 JavaScript）
  - [ ] 8.1.3 说明响应格式和错误代码

- [ ] 8.2 添加用户指南
  - [ ] 8.2.1 说明如何从 Eagle 导出 .eaglepack 文件
  - [ ] 8.2.2 说明导入选项的使用
  - [ ] 8.2.3 说明如何解读导入报告

- [ ] 8.3 配置和部署
  - [ ] 8.3.1 验证 Vercel 配置支持文件上传大小限制
  - [ ] 8.3.2 配置临时文件目录（Vercel 的 /tmp）
  - [ ] 8.3.3 测试生产环境部署

## 9. 性能优化（可选）

- [ ] 9.1 实现流式处理优化
  - [ ] 9.1.1 使用流式 ZIP 解压减少内存占用
  - [ ] 9.1.2 实现并发图片上传（限制并发数）

- [ ] 9.2 添加进度 WebSocket 支持（可选）
  - [ ] 9.2.1 实现 WebSocket 连接管理
  - [ ] 9.2.2 在导入过程中发送实时进度更新

## 10. 验收测试

- [ ] 10.1 手动测试所有需求场景
  - [ ] 10.1.1 验证 Requirement 1: 上传 EaglePack 文件
  - [ ] 10.1.2 验证 Requirement 2: 解析 EaglePack 文件结构
  - [ ] 10.1.3 验证 Requirement 3: 解析元数据 JSON
  - [ ] 10.1.4 验证 Requirement 4: 提取图片文件
  - [ ] 10.1.5 验证 Requirement 5: 导入图片到系统
  - [ ] 10.1.6 验证 Requirement 6: 关联元数据
  - [ ] 10.1.7 验证 Requirement 7: 导入进度反馈
  - [ ] 10.1.8 验证 Requirement 8: 错误处理和恢复
  - [ ] 10.1.9 验证 Requirement 9: 导入结果报告

- [ ] 10.2 性能测试
  - [ ] 10.2.1 测试大文件导入（100+ 图片）
  - [ ] 10.2.2 测试并发导入请求
  - [ ] 10.2.3 验证内存使用合理

- [ ] 10.3 安全测试
  - [ ] 10.3.1 测试恶意 ZIP 文件（ZIP 炸弹）
  - [ ] 10.3.2 测试路径遍历攻击
  - [ ] 10.3.3 验证认证和授权

