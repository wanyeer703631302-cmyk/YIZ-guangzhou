# 需求文档

## 介绍

本功能旨在将旧网页（YIZ-guangzhou）中已配置好的后端服务、数据库和Vercel部署配置迁移到当前的前端应用（app/目录）中，实现完整的全栈应用，并最终上传到GitHub进行版本管理。

当前前端应用已实现带网格畸变和鼠标跟随模式的3D图片展示功能，包括点赞、收藏等交互。旧网页使用Express后端、Cloudinary图片存储、Prisma ORM + PostgreSQL数据库，并已部署到Vercel。

## 术语表

- **Frontend_App**: 当前的React + TypeScript + Vite前端应用（位于app/目录）
- **Legacy_Backend**: 旧网页的Express后端服务（位于YIZ-guangzhou/server/）
- **Legacy_Database**: 旧网页的PostgreSQL数据库配置（使用Prisma ORM）
- **Cloudinary_Service**: 云端图片存储和CDN服务
- **Migration_System**: 执行迁移操作的整体系统
- **Vercel_Config**: Vercel平台的部署配置文件
- **Environment_Variables**: 环境变量配置（数据库连接、API密钥等）
- **API_Client**: 前端用于调用后端API的客户端模块
- **GitHub_Repository**: 用于版本控制的Git仓库

## 需求

### 需求 1: 后端服务迁移

**用户故事:** 作为开发者，我希望将旧网页的后端服务迁移到新项目中，以便前端应用可以使用完整的后端功能。

#### 验收标准

1. THE Migration_System SHALL 复制Legacy_Backend的所有源代码到Frontend_App项目的backend目录
2. THE Migration_System SHALL 保留Legacy_Backend的所有依赖配置（package.json）
3. THE Migration_System SHALL 保留Cloudinary_Service的配置代码和上传逻辑
4. THE Migration_System SHALL 保留CORS配置以支持前后端分离架构
5. WHEN 后端服务启动时，THE Legacy_Backend SHALL 在指定端口（3001）上运行并响应健康检查请求

### 需求 2: 数据库配置迁移

**用户故事:** 作为开发者，我希望迁移数据库配置和Schema，以便新应用可以使用相同的数据结构。

#### 验收标准

1. THE Migration_System SHALL 复制Prisma schema文件到Frontend_App项目
2. THE Migration_System SHALL 保留所有数据模型定义（User、Asset、Folder、Tag等）
3. THE Migration_System SHALL 保留所有数据关系和索引配置
4. THE Migration_System SHALL 复制数据库迁移脚本（如果存在）
5. THE Migration_System SHALL 在package.json中添加Prisma相关的构建和部署脚本

### 需求 3: 环境变量配置

**用户故事:** 作为开发者，我希望配置所有必需的环境变量，以便应用可以连接到数据库和第三方服务。

#### 验收标准

1. THE Migration_System SHALL 创建.env.example文件，包含所有必需的Environment_Variables模板
2. THE Migration_System SHALL 在.env.example中包含DATABASE_URL配置项
3. THE Migration_System SHALL 在.env.example中包含Cloudinary_Service的三个配置项（CLOUD_NAME、API_KEY、API_SECRET）
4. THE Migration_System SHALL 在.env.example中包含NEXTAUTH相关配置项（如果使用NextAuth）
5. THE Migration_System SHALL 在.env.example中为每个配置项添加说明注释
6. THE Migration_System SHALL 创建.gitignore规则以排除实际的.env文件

### 需求 4: 前端API集成

**用户故事:** 作为开发者，我希望前端应用能够调用后端API，以便实现图片上传、获取资源列表等功能。

#### 验收标准

1. THE Migration_System SHALL 创建API_Client模块用于封装HTTP请求
2. THE API_Client SHALL 提供上传图片的方法（uploadAsset）
3. THE API_Client SHALL 提供获取资源列表的方法（getAssets）
4. THE API_Client SHALL 提供按文件夹筛选资源的方法
5. THE API_Client SHALL 使用Environment_Variables中的API_URL配置后端地址
6. WHEN API请求失败时，THE API_Client SHALL 返回包含错误信息的响应对象

### 需求 5: Vercel部署配置

**用户故事:** 作为开发者，我希望配置Vercel部署，以便应用可以自动部署到生产环境。

#### 验收标准

1. THE Migration_System SHALL 创建vercel.json配置文件
2. THE Vercel_Config SHALL 配置前端构建命令和输出目录
3. THE Vercel_Config SHALL 配置后端API路由重写规则
4. THE Vercel_Config SHALL 配置Environment_Variables的引用
5. WHERE 使用monorepo结构，THE Vercel_Config SHALL 正确配置根目录和构建目录
6. THE Migration_System SHALL 创建部署说明文档，包含Vercel环境变量配置步骤

### 需求 6: 项目结构整合

**用户故事:** 作为开发者，我希望整合前后端代码到统一的项目结构中，以便于管理和部署。

#### 验收标准

1. THE Migration_System SHALL 创建清晰的目录结构，分离前端和后端代码
2. THE Migration_System SHALL 在根目录创建统一的package.json用于管理工作区
3. THE Migration_System SHALL 配置npm scripts以支持同时启动前后端开发服务器
4. THE Migration_System SHALL 配置npm scripts以支持独立构建前端和后端
5. THE Migration_System SHALL 保留Frontend_App现有的所有功能代码（3D展示、交互等）
6. THE Migration_System SHALL 更新README.md文档，说明新的项目结构和启动方式

### 需求 7: GitHub仓库配置

**用户故事:** 作为开发者，我希望将整合后的项目上传到GitHub，以便进行版本控制和协作开发。

#### 验收标准

1. THE Migration_System SHALL 创建.gitignore文件，排除node_modules、.env、dist等文件
2. THE Migration_System SHALL 创建README.md文件，包含项目介绍、安装步骤和部署指南
3. THE Migration_System SHALL 在README.md中说明如何配置Environment_Variables
4. THE Migration_System SHALL 在README.md中说明如何在本地运行开发环境
5. THE Migration_System SHALL 在README.md中说明如何部署到Vercel
6. THE Migration_System SHALL 提供git初始化和首次提交的命令说明

### 需求 8: 数据持久化功能

**用户故事:** 作为用户，我希望我的点赞和收藏操作能够保存到数据库，以便下次访问时仍然保留。

#### 验收标准

1. WHEN 用户点击点赞按钮时，THE Frontend_App SHALL 调用API保存点赞记录到Legacy_Database
2. WHEN 用户点击收藏按钮时，THE Frontend_App SHALL 调用API保存收藏记录到Legacy_Database
3. WHEN 页面加载时，THE Frontend_App SHALL 从API获取用户的点赞和收藏状态
4. THE Legacy_Backend SHALL 提供创建点赞记录的API端点（POST /api/likes）
5. THE Legacy_Backend SHALL 提供删除点赞记录的API端点（DELETE /api/likes/:id）
6. THE Legacy_Backend SHALL 提供创建收藏记录的API端点（POST /api/favorites）
7. THE Legacy_Backend SHALL 提供删除收藏记录的API端点（DELETE /api/favorites/:id）
8. THE Legacy_Backend SHALL 提供获取用户点赞和收藏列表的API端点（GET /api/user/interactions）

### 需求 9: 图片资源加载

**用户故事:** 作为用户，我希望看到从数据库加载的真实图片，而不是硬编码的示例数据。

#### 验收标准

1. WHEN Frontend_App初始化时，THE Frontend_App SHALL 调用API获取资源列表
2. THE Frontend_App SHALL 使用API返回的图片URL替换硬编码的示例数据
3. THE Frontend_App SHALL 使用API返回的thumbnailUrl作为纹理加载源
4. THE Frontend_App SHALL 保留现有的3D网格畸变和鼠标跟随效果
5. WHEN API返回空列表时，THE Frontend_App SHALL 显示友好的空状态提示
6. WHEN API请求失败时，THE Frontend_App SHALL 显示错误提示并提供重试选项

### 需求 10: 用户认证集成

**用户故事:** 作为用户，我希望能够登录系统，以便我的点赞和收藏与我的账户关联。

#### 验收标准

1. THE Migration_System SHALL 保留Legacy_Database中的用户认证相关表（User、Session、Account）
2. THE Frontend_App SHALL 提供登录界面组件
3. THE Frontend_App SHALL 提供注册界面组件
4. WHEN 用户提交登录表单时，THE Frontend_App SHALL 调用认证API验证凭据
5. WHEN 认证成功时，THE Frontend_App SHALL 存储会话令牌到本地存储
6. THE API_Client SHALL 在所有需要认证的请求中包含会话令牌
7. WHEN 会话过期时，THE Frontend_App SHALL 提示用户重新登录
8. THE Legacy_Backend SHALL 验证每个需要认证的API请求的会话令牌

### 需求 11: 图片上传功能

**用户故事:** 作为用户，我希望能够上传新的图片到画廊，以便展示我的作品。

#### 验收标准

1. THE Frontend_App SHALL 提供图片上传界面组件
2. THE Frontend_App SHALL 支持拖拽上传和点击选择文件
3. WHEN 用户选择图片文件时，THE Frontend_App SHALL 显示上传预览
4. WHEN 用户确认上传时，THE Frontend_App SHALL 调用API上传图片到Cloudinary_Service
5. THE Frontend_App SHALL 显示上传进度指示器
6. WHEN 上传成功时，THE Frontend_App SHALL 刷新资源列表以显示新上传的图片
7. WHEN 上传失败时，THE Frontend_App SHALL 显示错误信息并允许重试
8. THE Legacy_Backend SHALL 验证上传文件的大小不超过10MB
9. THE Legacy_Backend SHALL 验证上传文件的类型为图片格式

### 需求 12: 配置验证和错误处理

**用户故事:** 作为开发者，我希望系统能够验证配置的正确性，以便快速发现和解决配置问题。

#### 验收标准

1. WHEN Legacy_Backend启动时，THE Legacy_Backend SHALL 验证所有必需的Environment_Variables是否已配置
2. WHEN 必需的Environment_Variables缺失时，THE Legacy_Backend SHALL 记录错误日志并拒绝启动
3. WHEN Legacy_Backend启动时，THE Legacy_Backend SHALL 测试Legacy_Database连接
4. WHEN Legacy_Database连接失败时，THE Legacy_Backend SHALL 记录详细的错误信息
5. WHEN Legacy_Backend启动时，THE Legacy_Backend SHALL 测试Cloudinary_Service连接
6. THE Legacy_Backend SHALL 在健康检查端点（/health）返回所有服务的状态
7. THE Frontend_App SHALL 在启动时调用健康检查端点验证后端可用性
8. WHEN 后端不可用时，THE Frontend_App SHALL 显示维护模式提示
