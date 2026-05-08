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

### 邮件简报（Pro 接收邮箱）

1. 在 [Resend](https://resend.com) 创建 API Key；发件域名验证后，将 `EMAIL_FROM` 设为你的域名发件人（测试可用 Resend 文档中的 `onboarding@resend.dev`，仅能发到有限测试地址）。
2. Supabase **Edge Functions → Secrets** 增加：`RESEND_API_KEY`、`EMAIL_FROM`（可选）、`EMAIL_DIGEST_CRON_SECRET`（随机长串）、`SUPABASE_SERVICE_ROLE_KEY`（控制台 **API → service_role**，勿提交到 Git）。
3. 部署：`npx supabase functions deploy send-news-email-digest`
4. GitHub 仓库 **Settings → Secrets and variables → Actions** 增加：`EMAIL_DIGEST_URL`（`https://<ref>.supabase.co/functions/v1/send-news-email-digest`）、`EMAIL_DIGEST_CRON_SECRET`（与上一步同名 Secret 值一致）。  
   工作流见 `.github/workflows/email-digest.yml`（默认定时每天 2 次 UTC）；也可在 Actions 里 **Run workflow** 手动试发。
