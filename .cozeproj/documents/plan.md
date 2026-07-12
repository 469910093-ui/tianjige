# 天机阁 - 自有服务器部署方案

## 概述
将天机阁 AI 算命网站部署到用户自有的云服务器（阿里云/腾讯云 ECS），绑定自有域名并配置 HTTPS。核心改造点：将平台专用 SDK（coze-coding-dev-sdk）替换为标准 LLM API 接入，适配自有服务器运行环境。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| LLM 接入 | 直接调用火山引擎/豆包 API（REST） | 原项目已用 doubao-seed 模型，保持一致 |
| 进程管理 | PM2 | Node.js 生产标准方案，自动重启/日志/监控 |
| 反向代理 | Nginx | SSL 终端、静态资源、gzip、反向代理 |
| HTTPS | Let's Encrypt + Certbot | 免费、自动续期、业界标准 |
| 域名 DNS | A 记录指向服务器 IP | 最简单直接的解析方式 |

## 功能模块

### 1. LLM 接入改造（核心）
将 `coze-coding-dev-sdk` 替换为直接 REST API 调用，需要：
- 新增环境变量 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`
- 改造 `src/app/api/chat/route.ts`：用 fetch/axios 直接调 LLM API，保留 SSE 流式输出
- 改造 `src/app/api/report/route.ts`：同上，非流式调用
- 创建 `src/lib/llm-client.ts`：封装统一的 LLM 调用逻辑（流式 + 非流式）

### 2. 服务器环境配置
在 ECS 上安装：Node.js 24、pnpm、PM2、Nginx、Certbot

### 3. 项目配置适配
- 创建 `.env.production` 模板，包含所有生产环境变量
- 修改 `server.ts` 监听 `0.0.0.0`（默认 localhost 仅本机可访问）
- 移除或适配 `COZE_PROJECT_ENV` 等 Coze 平台特有变量

### 4. Nginx 反向代理配置
- 监听 80/443 端口，代理到 Node.js 3000 端口
- 配置 WebSocket 支持（SSE 流式输出需要长连接）
- gzip 压缩、静态资源缓存

### 5. HTTPS 与域名
- Certbot 申请 Let's Encrypt 证书
- Nginx 配置 SSL，HTTP 自动跳转 HTTPS
- DNS A 记录指向服务器公网 IP

## 是否有原型设计
否（纯部署配置改造，无页面/UI 变更）

## 实施步骤

1. **LLM 接入改造** — 创建 `src/lib/llm-client.ts` 封装标准 LLM API 调用（流式 + 非流式），改造 `src/app/api/chat/route.ts` 和 `src/app/api/report/route.ts`，移除 coze-coding-dev-sdk 依赖。涉及文件：`src/lib/llm-client.ts`、`src/app/api/chat/route.ts`、`src/app/api/report/route.ts`

2. **生产环境配置** — 修改 `src/server.ts` 默认监听 `0.0.0.0`，创建 `.env.production` 模板文件（含 LLM_API_KEY/LLM_BASE_URL/LLM_MODEL/PORT 等变量），确保构建脚本在生产模式下正常工作。涉及文件：`src/server.ts`、`.env.production`、`package.json`

3. **服务器环境搭建** — 在 ECS 上安装 Node.js 24、pnpm、PM2、Nginx、Certbot；配置防火墙开放 80/443 端口；将项目代码上传至服务器并执行 `pnpm install && pnpm build`。涉及：ECS 服务器运维操作

4. **PM2 进程管理配置** — 创建 `ecosystem.config.js`（PM2 配置文件），设置生产环境变量、日志路径、自动重启策略；启动服务并验证 Node.js 端口正常监听。涉及文件：`ecosystem.config.js`

5. **Nginx 反向代理配置** — 编写 Nginx 站点配置文件，设置反向代理到 Node.js 端口、WebSocket/SSE 长连接支持、gzip 压缩、静态资源缓存策略。涉及文件：Nginx 站点配置

6. **域名注册与 DNS 解析** — 注册域名，添加 A 记录指向 ECS 公网 IP，等待 DNS 生效后验证域名可访问 HTTP 服务。涉及：域名注册商控制台操作

7. **HTTPS 证书配置** — 使用 Certbot 申请 Let's Encrypt 证书，配置 Nginx SSL，设置 HTTP 自动跳转 HTTPS，配置证书自动续期 cron。涉及：Certbot 命令 + Nginx SSL 配置

8. **全链路验证** — 逐一测试所有页面和 API（八字/紫微/奇门/六爻/星座/塔罗/运势/综合测算），确认 AI 流式对话正常、报告生成正常、HTTPS 有效、域名可访问。涉及：端到端功能测试
