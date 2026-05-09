# industry-ai-news-plugin
🚀 An AI-powered Chrome extension that aggregates authoritative news across industries (Tech, Military, Medical, etc.), generates smart summaries using LLMs, and pushes real-time updates.

# Industry AI News: Smart Summary & Push 🚀

**Industry AI News** is a powerful Chrome extension designed for professionals and enthusiasts who need to stay ahead of the curve without spending hours scrolling through news sites. Leveraging advanced AI, it filters, summarizes, and pushes authoritative industry news directly to you.

## ✨ Features

- **🎯 Industry Selection:** Choose your focus areas—Technology, Military, Politics, Medical, Biology, Environment, and more.
- **🤖 AI-Powered Summaries:** Short summaries via Supabase Edge + DeepSeek (OpenAI-compatible API); keys stay on the server.
- **🔔 Smart Push:** Receive non-intrusive browser notifications or email digests at your preferred frequency.
- **🌍 Authoritative Sources:** Multi-source aggregation from top-tier global news outlets to ensure information quality.
- **💎 Premium Tiers:** Free users can track up to 3 industries; Pro users enjoy unlimited access and real-time email alerts.

## 🛠 Tech Stack

- **Framework:** [Plasmo](https://www.plasmo.com/) (Browser Extension Framework)
- **Frontend:** React + Tailwind CSS
- **Backend:** Supabase (Database & Auth)
- **AI Engine:** DeepSeek API (via Supabase Edge Function; `DEEPSEEK_API_KEY` as project secret)
- **Automation:** GitHub Actions / Cron Jobs

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm / npm
- DeepSeek API Key（仅用于 `supabase secrets set`，不写入扩展 `.env`）

### Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/industry-ai-news-plugin.git
2. 可选：在仓库根目录复制 `.env.example` 为 `.env`，填写 Supabase 的 `PLASMO_PUBLIC_SUPABASE_URL` 与 `PLASMO_PUBLIC_SUPABASE_ANON_KEY`（anon 为**公开**密钥，可打进扩展；勿把 `service_role` 放进扩展）。在 Supabase 控制台 **Authentication → URL configuration** 的 **Redirect URLs** 中加入 `chrome-extension://<扩展ID>/options.html`；扩展 ID 在 `chrome://extensions` 中展开本扩展可见，不同安装/打包可能不同。邮件 Magic Link 会打开该「选项」页以完成 `chrome.storage.local` 中的会话，侧栏「设置」里可发信与登出。
3. 安装并构建（Plasmo 的 `manifest.json` 在**构建输出目录**中，**不要**在仓库根目录用「加载已解压的扩展程序」）：
   ```bash
   cd industry-ai-news-plugin
   npm install
   npm run build
   ```
4. 在 Chrome 中安装：`chrome://extensions` → 打开「开发者模式」→「加载已解压的扩展程序」→ 选择本仓库下的 **`build/chrome-mv3-prod`** 文件夹（该目录内应包含 `manifest.json`、`sidepanel.html`、`options.html` 等）。  
5. 开发时可用 `npm run dev`，在终端里会提示要加载的 dev 输出目录；修改代码后一般需刷新扩展。

### 本地 CI 对齐

与 GitHub Actions 一致跑测试与生产构建可在仓库根执行：

```bash
npm ci
npm test
npm run build
```

### 数据库脚本

```bash
# 本地：启动 Postgres 容器并执行 supabase/migrations/*.sql
npm run db:local:up

# 服务器（Supabase）：部署迁移
# 方式一：已 supabase link
npm run db:deploy

# 方式二：显式 DB 连接串
SUPABASE_DB_URL='postgresql://...' npm run db:deploy
```

### 数据库迁移（含摘要缓存、邮件退订字段）

```bash
npm run db:deploy
```

### AI 摘要 Edge（`summarize-article`）

在 Edge Secrets 中配置：`DEEPSEEK_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`（必填，用于写 `article_summary_cache` / `user_llm_usage_daily`）；可选 `SUMMARY_CACHE_TTL_HOURS`、`SUMMARY_DAILY_LLM_ITEMS_PER_USER`。

**部署**：本机执行 `npx supabase functions deploy summarize-article`。若在 macOS 上出现 **`error running container: exit 139`**（Docker 内打包段错误），可改用 **GitHub Actions → Deploy Edge Functions**（手动运行），在仓库 Secrets 中配置 `SUPABASE_ACCESS_TOKEN` 与 `SUPABASE_PROJECT_REF`（见 `.github/workflows/deploy-edge-functions.yml`）。

### 邮件简报（Pro + 订阅开关未关闭）

1. 在 [Resend](https://resend.com) 创建 API Key；正式环境验证发件域名后设置 `EMAIL_FROM`（测试可用 `onboarding@resend.dev`）。
2. Edge Secrets：`RESEND_API_KEY`、`EMAIL_FROM`、`EMAIL_DIGEST_CRON_SECRET`、`SUPABASE_SERVICE_ROLE_KEY`；**可选** `EMAIL_UNSUBSCRIBE_SECRET`（建议 ≥32 字符随机串）— 设置后邮件内含退订链接，并需部署 `email-unsubscribe`。
3. 部署：`npx supabase functions deploy send-news-email-digest`；若有退订：`npx supabase functions deploy email-unsubscribe`。
4. GitHub Actions：`EMAIL_DIGEST_URL`、`EMAIL_DIGEST_CRON_SECRET`（与 Edge 一致）。工作流见 `.github/workflows/email-digest.yml`。
