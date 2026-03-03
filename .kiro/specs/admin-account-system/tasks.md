# Implementation Plan: Admin Account System

## Overview

本实现计划将管理员账号系统分解为增量式的开发任务。实现将基于现有的用户认证系统，添加角色管理、用户管理、临时密码机制和审计日志功能。所有任务使用TypeScript + Node.js + PostgreSQL技术栈。

## Tasks

- [ ] 1. 数据库Schema扩展和迁移
  - [x] 1.1 更新Prisma schema添加角色和临时密码字段
    - 在User模型中添加role字段（enum: ADMIN, USER）
    - 在User模型中添加requirePasswordChange字段（boolean）
    - 更新User模型的relations
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 创建AuditLog数据模型
    - 定义AuditAction枚举（USER_CREATED, USER_UPDATED, USER_DELETED等）
    - 创建AuditLog模型包含action, performedById, targetUserId, details等字段
    - 添加必要的索引和关系
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 1.3 生成并执行数据库迁移
    - 运行prisma migrate dev创建迁移文件
    - 验证迁移SQL正确性
    - 执行迁移更新数据库schema
    - _Requirements: 1.3, 10.1_
  
  - [ ] 1.4 迁移演示账号为管理员
    - 创建数据迁移脚本将demo@yiz.com角色设置为ADMIN
    - 验证迁移后的账号可以正常登录
    - _Requirements: 7.1, 7.2_

- [ ] 2. 扩展认证服务支持角色
  - [x] 2.1 更新JWT payload包含角色信息
    - 修改lib/auth.ts中的JWTPayload接口添加role字段
    - 更新generateToken函数接受role参数
    - 更新token生成逻辑在payload中包含role
    - _Requirements: 1.4, 8.2_
  
  - [ ]* 2.2 编写属性测试验证会话角色包含
    - **Property 2: Session Role Inclusion**
    - **Validates: Requirements 1.4, 8.2**
  
  - [x] 2.3 更新认证中间件解析角色信息
    - 修改withAuth中间件从token中提取role
    - 在AuthRequest接口中添加userRole字段
    - 将解析的role附加到request对象
    - _Requirements: 1.4, 8.2_
  
  - [x] 2.4 实现角色验证中间件
    - 创建withRole中间件函数检查用户角色
    - 支持指定required role参数
    - 返回403错误当角色不匹配时
    - _Requirements: 8.3, 8.4_
  
  - [ ]* 2.5 编写属性测试验证管理员端点授权
    - **Property 16: Admin Endpoint Authorization**
    - **Validates: Requirements 4.4, 8.3, 8.4**

- [ ] 3. 实现密码管理功能
  - [x] 3.1 创建密码复杂度验证函数
    - 实现validatePasswordComplexity函数
    - 检查最少8个字符
    - 检查包含大小写字母和数字
    - 返回详细的验证错误信息
    - _Requirements: 8.5_
  
  - [ ]* 3.2 编写属性测试验证密码复杂度
    - **Property 17: Password Complexity Enforcement**
    - **Validates: Requirements 8.5**
  
  - [x] 3.3 实现临时密码生成函数
    - 创建generateTemporaryPassword函数
    - 生成符合复杂度要求的随机密码
    - 返回明文密码（用于显示给管理员）
    - _Requirements: 3.2, 3.4_
  
  - [x] 3.4 创建密码修改API端点
    - 实现POST /api/user/password/change端点
    - 验证当前密码正确性
    - 验证新密码复杂度
    - 更新密码并清除requirePasswordChange标记
    - _Requirements: 9.4, 9.5_
  
  - [ ]* 3.5 编写属性测试验证密码修改标记清除
    - **Property 21: Password Change Flag Clearing**
    - **Validates: Requirements 9.4**
  
  - [x] 3.6 创建强制密码修改API端点
    - 实现POST /api/user/password/force-change端点
    - 验证临时密码正确性
    - 防止重用临时密码
    - 清除requirePasswordChange标记
    - _Requirements: 9.3, 9.5_
  
  - [ ]* 3.7 编写属性测试验证临时密码重用防止
    - **Property 22: Temporary Password Reuse Prevention**
    - **Validates: Requirements 9.5**

- [ ] 4. 实现审计日志服务
  - [x] 4.1 创建审计日志记录函数
    - 实现createAuditLog函数在lib/audit.ts
    - 接受action, performedById, targetUserId, details参数
    - 从request中提取ipAddress和userAgent
    - 写入AuditLog表
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 4.2 编写属性测试验证审计日志创建
    - **Property 23: Audit Log Creation on User Operations**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  
  - [x] 4.3 创建审计日志查询API端点
    - 实现GET /api/audit/logs端点
    - 支持分页参数（page, limit）
    - 支持过滤参数（action, startDate, endDate）
    - 按创建时间倒序返回日志
    - 仅允许管理员访问
    - _Requirements: 10.5_
  
  - [ ]* 4.4 编写属性测试验证审计日志时间顺序
    - **Property 24: Audit Log Chronological Order**
    - **Validates: Requirements 10.5**

- [ ] 5. Checkpoint - 验证基础设施
  - 确保所有测试通过，数据库迁移成功，基础服务正常工作

- [ ] 6. 实现用户创建功能
  - [x] 6.1 创建用户创建API端点
    - 实现POST /api/user/manage/create端点
    - 验证请求者为管理员
    - 验证邮箱格式
    - 检查邮箱是否已存在
    - 生成临时密码
    - 创建用户并设置requirePasswordChange为true
    - 记录审计日志
    - 返回用户信息和临时密码
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 6.2 编写属性测试验证角色分配完整性
    - **Property 1: Role Assignment Completeness**
    - **Validates: Requirements 1.3**
  
  - [ ]* 6.3 编写属性测试验证邮箱格式验证
    - **Property 4: Email Format Validation**
    - **Validates: Requirements 3.1**
  
  - [ ]* 6.4 编写属性测试验证临时密码创建
    - **Property 5: User Creation with Temporary Password**
    - **Validates: Requirements 3.2, 3.4**
  
  - [ ]* 6.5 编写属性测试验证重复邮箱防止
    - **Property 6: Duplicate Email Prevention**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.6 编写属性测试验证角色指定保留
    - **Property 7: Role Specification Preservation**
    - **Validates: Requirements 3.5**
  
  - [ ]* 6.7 编写属性测试验证临时密码标记设置
    - **Property 18: Temporary Password Flag Setting**
    - **Validates: Requirements 9.1**

- [ ] 7. 实现用户列表查询功能
  - [x] 7.1 创建用户列表API端点
    - 实现GET /api/user/manage/list端点
    - 验证请求者为管理员
    - 支持分页参数（page, limit，默认limit=50）
    - 返回用户列表包含email, role, createdAt字段
    - 返回总数和分页信息
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 7.2 编写属性测试验证用户列表完整性
    - **Property 8: User List Completeness**
    - **Validates: Requirements 4.1**
  
  - [ ]* 7.3 编写属性测试验证用户列表字段包含
    - **Property 9: User List Field Inclusion**
    - **Validates: Requirements 4.2**

- [ ] 8. 实现用户更新功能
  - [x] 8.1 创建用户更新API端点
    - 实现PUT /api/user/manage/:userId端点
    - 验证请求者为管理员
    - 支持更新name字段
    - 支持更新role字段（防止自己修改自己的角色）
    - 支持resetPassword选项生成新临时密码
    - 记录审计日志
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 8.2 编写属性测试验证角色变更持久化
    - **Property 10: Role Change Persistence**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.3 编写属性测试验证密码重置功能
    - **Property 11: Password Reset Functionality**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 9. 实现用户删除功能
  - [x] 9.1 创建用户删除API端点
    - 实现DELETE /api/user/manage/:userId端点
    - 验证请求者为管理员
    - 防止删除自己的账号
    - 检查是否为最后一个管理员账号
    - 删除用户记录
    - 记录审计日志
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [ ]* 9.2 编写属性测试验证用户删除完整性
    - **Property 12: User Deletion Completeness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 9.3 编写属性测试验证会话失效
    - **Property 13: Session Invalidation on Deletion**
    - **Validates: Requirements 6.4**
  
  - [ ]* 9.4 编写属性测试验证最后管理员保护
    - **Property 14: Last Admin Protection**
    - **Validates: Requirements 6.5**

- [ ] 10. 实现临时密码强制修改中间件
  - [ ] 10.1 创建密码修改检查中间件
    - 实现withPasswordChangeCheck中间件
    - 检查用户的requirePasswordChange标记
    - 如果为true且不是密码修改端点，返回403错误
    - 在错误响应中包含requirePasswordChange标记
    - _Requirements: 9.2, 9.3_
  
  - [ ]* 10.2 编写属性测试验证会话中的临时密码标记
    - **Property 19: Temporary Password Flag in Session**
    - **Validates: Requirements 9.2**
  
  - [ ]* 10.3 编写属性测试验证密码修改强制执行
    - **Property 20: Password Change Enforcement**
    - **Validates: Requirements 9.3**
  
  - [ ] 10.4 将密码修改检查中间件应用到所有保护端点
    - 更新所有需要认证的端点添加密码修改检查
    - 排除密码修改和登出端点
    - _Requirements: 9.3_

- [ ] 11. Checkpoint - 验证后端API
  - 确保所有API端点正常工作，所有测试通过

- [ ] 12. 移除公开注册功能
  - [x] 12.1 删除注册API端点
    - 删除或禁用POST /api/auth/register端点
    - 返回410 Gone状态码表示端点已永久移除
    - _Requirements: 2.1, 2.3_
  
  - [ ] 12.2 删除注册UI组件
    - 删除注册页面组件
    - 删除注册表单组件
    - 更新路由配置移除注册路由
    - _Requirements: 2.2_
  
  - [ ] 12.3 更新登录页面移除注册链接
    - 从登录页面移除"注册"链接
    - 更新UI文案
    - _Requirements: 2.2_

- [ ] 13. 实现管理员控制面板前端
  - [x] 13.1 创建管理员路由保护
    - 实现AdminRoute组件检查用户角色
    - 非管理员用户重定向到首页
    - _Requirements: 8.3, 8.4_
  
  - [x] 13.2 创建管理员控制面板页面
    - 创建AdminDashboard组件
    - 显示用户统计信息（总用户数、管理员数）
    - 显示快速操作按钮
    - 显示最近的审计日志摘要
    - _Requirements: 4.1_
  
  - [ ] 13.3 添加管理员导航菜单项
    - 在主导航中添加"用户管理"菜单项
    - 仅对管理员显示
    - _Requirements: 4.1_

- [ ] 14. 实现用户管理表格组件
  - [x] 14.1 创建用户列表表格组件
    - 创建UserManagementTable组件
    - 显示用户列表（email, name, role, createdAt）
    - 实现分页功能
    - 添加操作按钮（编辑、删除）
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 14.2 实现用户搜索和过滤
    - 添加搜索框按邮箱搜索
    - 添加角色过滤下拉框
    - _Requirements: 4.1_
  
  - [ ]* 14.3 编写用户管理表格组件单元测试
    - 测试表格渲染
    - 测试分页功能
    - 测试搜索和过滤

- [ ] 15. 实现创建用户对话框
  - [x] 15.1 创建用户创建表单组件
    - 创建CreateUserModal组件
    - 实现表单包含email, name, role字段
    - 实现表单验证（邮箱格式、必填字段）
    - 调用创建用户API
    - _Requirements: 3.1, 3.5_
  
  - [x] 15.2 实现临时密码显示
    - 创建成功后显示生成的临时密码
    - 提供复制密码按钮
    - 显示安全提示信息
    - _Requirements: 3.4_
  
  - [ ]* 15.3 编写创建用户对话框单元测试
    - 测试表单验证
    - 测试API调用
    - 测试临时密码显示

- [ ] 16. 实现编辑用户对话框
  - [ ] 16.1 创建用户编辑表单组件
    - 创建EditUserModal组件
    - 加载并显示当前用户信息
    - 支持修改name和role
    - 添加"重置密码"按钮
    - 调用更新用户API
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 16.2 实现密码重置功能
    - 点击重置密码按钮调用API
    - 显示新生成的临时密码
    - 提供复制密码按钮
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 16.3 编写编辑用户对话框单元测试
    - 测试表单加载
    - 测试更新功能
    - 测试密码重置

- [ ] 17. 实现删除用户确认对话框
  - [ ] 17.1 创建删除确认对话框组件
    - 创建DeleteUserConfirmation组件
    - 显示用户信息和警告信息
    - 要求输入确认文本
    - 调用删除用户API
    - _Requirements: 6.1_
  
  - [ ] 17.2 实现删除错误处理
    - 处理"无法删除自己"错误
    - 处理"无法删除最后管理员"错误
    - 显示友好的错误信息
    - _Requirements: 6.3, 6.5_
  
  - [ ]* 17.3 编写删除确认对话框单元测试
    - 测试确认流程
    - 测试错误处理

- [ ] 18. 实现强制密码修改流程
  - [x] 18.1 创建强制密码修改组件
    - 创建ForcePasswordChange组件
    - 检测登录响应中的requirePasswordChange标记
    - 显示密码修改表单
    - 阻止访问其他功能
    - _Requirements: 9.2, 9.3_
  
  - [x] 18.2 实现密码修改表单
    - 输入当前临时密码
    - 输入新密码（两次确认）
    - 验证密码复杂度
    - 防止重用临时密码
    - 调用强制密码修改API
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [ ] 18.3 更新登录流程集成密码修改检查
    - 登录成功后检查requirePasswordChange
    - 如果为true，显示ForcePasswordChange组件
    - 密码修改成功后继续正常登录流程
    - _Requirements: 9.2, 9.3_
  
  - [ ]* 18.4 编写强制密码修改流程单元测试
    - 测试密码修改表单
    - 测试验证逻辑
    - 测试流程集成

- [ ] 19. 实现审计日志查看器
  - [ ] 19.1 创建审计日志列表组件
    - 创建AuditLogViewer组件
    - 显示审计日志列表（action, performedBy, targetUser, timestamp）
    - 实现分页功能
    - _Requirements: 10.5_
  
  - [ ] 19.2 实现审计日志过滤
    - 添加操作类型过滤
    - 添加日期范围过滤
    - 添加用户过滤
    - _Requirements: 10.5_
  
  - [ ] 19.3 实现审计日志详情展示
    - 点击日志条目显示详细信息
    - 显示details JSON数据（格式化）
    - 显示IP地址和User Agent
    - _Requirements: 10.2_
  
  - [ ]* 19.4 编写审计日志查看器单元测试
    - 测试列表渲染
    - 测试过滤功能
    - 测试详情展示

- [ ] 20. Checkpoint - 验证前端功能
  - 确保所有前端组件正常工作，用户体验流畅

- [ ] 21. 集成测试和端到端测试
  - [ ]* 21.1 编写用户创建端到端测试
    - 测试完整的用户创建流程
    - 验证临时密码可以登录
    - 验证强制密码修改流程
    - _Requirements: 3.1, 3.2, 3.4, 9.1, 9.2, 9.3_
  
  - [ ]* 21.2 编写用户管理端到端测试
    - 测试用户列表查看
    - 测试用户信息编辑
    - 测试密码重置
    - 测试用户删除
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 6.1, 6.2_
  
  - [ ]* 21.3 编写权限控制端到端测试
    - 测试管理员可以访问管理功能
    - 测试普通用户无法访问管理功能
    - 测试未认证用户被重定向
    - _Requirements: 8.3, 8.4_
  
  - [ ]* 21.4 编写审计日志端到端测试
    - 测试所有操作都记录审计日志
    - 测试审计日志查看功能
    - 测试审计日志过滤功能
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 22. 最终验证和文档
  - [ ] 22.1 验证所有需求已实现
    - 逐一检查需求文档中的所有验收标准
    - 确保所有功能正常工作
    - _Requirements: All_
  
  - [ ] 22.2 更新API文档
    - 记录所有新增的API端点
    - 记录请求和响应格式
    - 记录错误代码和错误信息
  
  - [ ] 22.3 创建管理员使用指南
    - 编写如何创建用户的指南
    - 编写如何管理用户的指南
    - 编写如何查看审计日志的指南
  
  - [ ] 22.4 准备部署清单
    - 列出需要执行的数据库迁移
    - 列出需要设置的环境变量
    - 列出部署后的验证步骤

- [ ] 23. Final Checkpoint - 完整系统验证
  - 确保所有测试通过，所有功能正常，系统可以部署

## Notes

- 任务标记为`*`的是可选的测试任务，可以跳过以加快MVP开发
- 每个任务都引用了具体的需求编号以确保可追溯性
- Checkpoint任务确保增量验证，及时发现问题
- 属性测试验证通用的正确性属性
- 单元测试验证特定的示例和边界情况
- 所有代码使用TypeScript编写，确保类型安全
