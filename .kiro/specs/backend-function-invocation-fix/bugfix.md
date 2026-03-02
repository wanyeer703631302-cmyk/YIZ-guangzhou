# Bugfix Requirements Document

## Introduction

用户网站显示云函数调用失败错误 (`FUNCTION_INVOCATION_FAILED`)，导致整个网站无法访问。后端健康检查 API (`/api/health`) 调用失败，可能是由于缺少必需的环境变量（DATABASE_URL、Cloudinary 配置）或数据库连接问题。即使某些服务未配置，系统也应该能够优雅降级并返回友好的错误信息，而不是导致整个函数调用失败。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 后端 API 被调用且缺少必需的环境变量时 THEN 系统返回 `FUNCTION_INVOCATION_FAILED` 错误并导致整个函数崩溃

1.2 WHEN 健康检查 API (`/api/health`) 被调用且数据库连接失败时 THEN 系统返回 `FUNCTION_INVOCATION_FAILED` 错误而不是返回服务状态信息

1.3 WHEN 后端初始化时缺少 DATABASE_URL 或 Cloudinary 配置时 THEN 系统无法启动并导致所有 API 请求失败

### Expected Behavior (Correct)

2.1 WHEN 后端 API 被调用且缺少必需的环境变量时 THEN 系统 SHALL 返回 HTTP 500 错误和友好的错误信息（如 "服务配置不完整"）而不是导致函数崩溃

2.2 WHEN 健康检查 API (`/api/health`) 被调用且数据库连接失败时 THEN 系统 SHALL 返回 HTTP 503 错误和服务状态信息（包括哪些服务不可用）

2.3 WHEN 后端初始化时缺少 DATABASE_URL 或 Cloudinary 配置时 THEN 系统 SHALL 记录警告日志并允许部分功能降级运行，而不是完全无法启动

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 所有必需的环境变量都正确配置且数据库连接正常时 THEN 系统 SHALL CONTINUE TO 正常处理所有 API 请求

3.2 WHEN 健康检查 API (`/api/health`) 被调用且所有服务正常时 THEN 系统 SHALL CONTINUE TO 返回 HTTP 200 和健康状态信息

3.3 WHEN 其他 API 端点（非健康检查）被调用且服务正常时 THEN 系统 SHALL CONTINUE TO 返回正确的业务数据和响应
