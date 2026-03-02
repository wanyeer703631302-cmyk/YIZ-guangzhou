# Bugfix Requirements Document

## Introduction

当后端服务返回非JSON格式的响应（如纯文本错误信息）时，前端API客户端在尝试解析响应时会抛出JSON解析错误。这导致用户看到维护模式页面，错误信息显示为 `Unexpected token 'A', "A server e"... is not valid JSON`。

该bug影响所有API请求，当后端服务出现故障或返回非标准响应时，前端无法优雅地处理这些情况，导致整个网站不可用。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 后端返回非JSON格式的响应（如纯文本错误信息"A server error occurred"）THEN 系统在 `api.ts` 的 `request` 方法中调用 `response.json()` 时抛出 JSON 解析错误

1.2 WHEN JSON解析失败抛出异常 THEN 系统在catch块中捕获错误并返回通用的 "Network error" 错误信息，丢失了后端返回的实际错误内容

1.3 WHEN API客户端返回 "Network error" 错误 THEN 健康检查失败，导致整个应用显示维护模式页面，用户无法访问网站

### Expected Behavior (Correct)

2.1 WHEN 后端返回非JSON格式的响应 THEN 系统 SHALL 检测响应的 Content-Type，如果不是 application/json，则将响应体作为纯文本读取

2.2 WHEN 响应体是纯文本 THEN 系统 SHALL 将文本内容包装成标准的 ApiResponse 格式返回，保留原始错误信息

2.3 WHEN JSON解析失败 THEN 系统 SHALL 尝试将响应体作为纯文本读取，并在错误信息中包含实际的响应内容

2.4 WHEN 后端服务不可用但返回了错误信息 THEN 用户 SHALL 在维护模式页面的错误详情中看到后端返回的实际错误内容，而不是通用的 "Network error"

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 后端返回有效的JSON响应且HTTP状态码为2xx THEN 系统 SHALL CONTINUE TO 成功解析并返回数据

3.2 WHEN 后端返回有效的JSON错误响应（包含error字段）THEN 系统 SHALL CONTINUE TO 正确提取并返回错误信息

3.3 WHEN 网络请求完全失败（如网络断开、DNS解析失败）THEN 系统 SHALL CONTINUE TO 在catch块中捕获并返回适当的错误信息

3.4 WHEN API请求需要认证 THEN 系统 SHALL CONTINUE TO 正确添加 Authorization 头部

3.5 WHEN 上传文件使用FormData THEN 系统 SHALL CONTINUE TO 正确处理multipart/form-data请求
