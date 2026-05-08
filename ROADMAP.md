# Industry AI News — 开发路线图

本文档描述 Chrome 扩展（Plasmo + React）的后续方向与阶段目标，与 `README.md` 中的技术栈（Supabase、摘要 LLM、自动化）对齐。

---

## 当前基线（已实现）

- **壳与体验**：Side Panel、浅/深主题、顶栏（菜单打开设置）、首次行业引导、设置（行业、提醒模式、Pro 邮箱、**仅本地演示数据**）、`chrome.storage.sync` 持久化。
- **内容展示**：左图右文列表、分页与触底加载、点击新开标签页；在线拉取 `lib/rss-feeds.ts` 白名单 RSS，失败或开启「仅演示」时使用 `MOCK_BRIEFS`；RSS 条目支持解析 **缩略图**（`media:thumbnail` / 图片类 `enclosure`）。
- **提醒**：`alarms` + `notifications`（占位文案，非真实摘要管线）。
- **未完全落地**：摘要服务端缓存/限流、真实邮件投递、CI 定时拉取/发版、商店上架材料等。
- **已具备**：Supabase 偏好 LWW 同步、Edge + DeepSeek 摘要（需部署函数与 Secret `DEEPSEEK_API_KEY`）、会话与 `options.html` 回调、**GitHub Actions CI**（`npm test` + `npm run build`）。

---

## 阶段 A：数据与展示打通 ✅（已落地第一版）

**目标**：侧栏展示可更新的真实（或半真实）资讯流，替代纯静态 mock；建立可替换的数据访问层。

**主要工作**

- 统一 `NewsBrief` 等数据模型（含可选 `dataSource: "rss" | "mock"`）。
- 按行业配置 **RSS/Atom 源**（白名单），见 `lib/rss-feeds.ts`；在扩展内 `fetch` → `parseRssXml`（`lib/parse-rss.ts`）→ 聚合、去重、按日期排序。
- `lib/news-service.ts`：`loadNewsForIndustries`（选项 **`mockOnly`** 时仅返回演示数据；否则 **5 分钟内存缓存**；**全部源失败时回退** `MOCK_BRIEFS`）、`clearNewsCache`。
- 侧栏 `sidepanel.tsx` 异步拉取；`NewsFeed` 区分**用户主动演示模式**与**在线失败回退**的提示文案。

**验收**

- 切换行业后列表内容随之变化；链接可打开真实文章页。
- 断网或源失败时有明确提示，且可降级到 mock，不白屏。

**后续可增强（仍属阶段 A 延伸）**

- ~~开发开关「仅演示数据」~~ → 已做：`STORAGE.newsMockOnly` + 设置页「资讯数据」。
- ~~RSS 缩略图~~ → 已做：`parse-rss` 提取 `thumbnail` / 图片 `enclosure`。
- 服务端代理以应对个别域名限制；正文摘要清洗与 `content:encoded` 命名空间兼容。

---

## 阶段 B：后端与账号（第一版已闭环）

**目标**：多设备一致、为 AI 与邮件打基础。

**已做**

- `@supabase/supabase-js` + `lib/env-public.ts` + `lib/supabase-chrome-storage.ts` + `lib/supabase.ts`（PKCE、`detectSessionInUrl`、会话持久化）。
- `options.tsx`：邮件链接回跳、完成会话；`lib/auth-redirect.ts` 生成 `chrome-extension://…/options.html`。
- 侧栏 `SettingsModal` 中 **账号**：未配置时说明；已配置时 OTP 登录、登出、订阅 `onAuthStateChange`（含 `TOKEN_REFRESHED` 时再次与云端对齐偏好）。
- `lib/extension-preferences-sync.ts`：`user_extension_preferences` 与 `chrome.storage.sync` 的 LWW（`prefsLastLocalWriteAt` vs `updated_at`）；迁移与 RLS 见 `supabase/migrations/20250430120000_user_extension_preferences.sql`。
- 登出：`clearSensitiveLocalPrefsAfterSignOut` 清空本地 **提醒邮箱**（PII）；行业/主题/演示 Pro 等保留在 `sync`，便于未登录继续使用。
- `.github/workflows/ci.yml`：`npm ci` → `npm test` → `npm run build`。

**运维**：在 Supabase 项目执行 `supabase db push`（或 `npm run db:deploy`）应用迁移。

**验收**：登录后跨设备偏好一致；登出后会话与提醒邮箱解绑。

---

## 阶段 C：AI 摘要（DeepSeek）（第一版已接好）

**目标**：列表展示模型生成的短摘要，并控制成本与合规。

**已做**

- Edge Function：`supabase/functions/summarize-article/index.ts`（校验用户 JWT，调用 **DeepSeek** OpenAI 兼容接口；**密钥为项目 Secret `DEEPSEEK_API_KEY`**，不进扩展）。
- 扩展：`lib/ai-summarize.ts` 在侧栏拉取 **在线 RSS 列表** 且用户已登录时，对前 `AI_SUMMARY_MAX_ITEMS` 条调用 `supabase.functions.invoke('summarize-article')`；失败或未部署函数时保留 RSS 原文/摘要。
- 默认模型 `deepseek-chat`；可选 Secret：`DEEPSEEK_MODEL`、`DEEPSEEK_API_BASE`（兼容其它 OpenAI 形状网关时自行替换基地址）。

**待增强**：URL + 模型维度的服务端缓存、限流与用量面板。

**部署**：`supabase secrets set DEEPSEEK_API_KEY=...`（在 [DeepSeek 开放平台](https://platform.deepseek.com/) 创建 API Key），再 `supabase functions deploy summarize-article`（需已 `supabase link` 或使用 `--project-ref`）。

**验收**：已部署且配置密钥时列表摘要为模型改写；否则静默保持 RSS 文案。

---

## 阶段 D：提醒与 Pro

**目标**：提醒与内容联动；Pro 边界清晰。

**已做（部分）**

- `background.ts`：按提醒模式拉取列表、与 `latestSeenNewsIds` 对比后弹系统通知；**文案中带首条新简报的标题**（`lib/news-delta.ts` 的 `firstNewBrief`）；点击通知打开侧栏。
- **邮件简报**：Edge `send-news-email-digest`（Resend 发 HTML、按 `user_extension_preferences` 中 Pro + 非免打扰 + 非「仅演示」+ 有效 `reminder_email` 拉取 RSS）；`last_email_digest_at` 限流；GitHub Actions `.github/workflows/email-digest.yml` 定时 `POST` 触发（需配置仓库 Secrets）。

**待做**

- 点击通知后滚动/定位到对应条目；邮件内容与侧栏 AI 摘要统一管线、更高刷新频率与退订链接等。

---

## 阶段 E：工程化与上架

- GitHub Actions：定时拉取/触发 Edge 函数、测试、发版。
- E2E、错误监控、API 用量与成本面板。
- Chrome 网上应用店：截图、隐私政策、权限说明。

---

## 优先级速览

| 优先级 | 方向 | 说明 |
|--------|------|------|
| P0 | 真实数据源 + 数据层 | 从「演示」到「可用」 |
| P0 | 密钥与 API 不外露 | 安全与可持续 |
| P1 | Supabase + 登录 + 同步 | 已实现第一版 |
| P1 | DeepSeek / LLM 摘要管线 | Edge 已接；缓存/限流待做 |
| P2 | 通知与邮件闭环 | 系统通知已有；邮件简报第一版已接 Resend + 定时任务 |
| P2 | CI/CD 与上架材料 | 发布与迭代效率 |

---

## 风险与依赖

- **抓取与版权**：遵守站点 robots、服务条款；优先官方 RSS/API。
- **CORS**：扩展在具备 `host_permissions` 的前提下，由 **Service Worker / 扩展页** 发起 `fetch` 通常可绕过网页 CORS；若个别源仍失败，需代理或后端。
- **成本**：DeepSeek API、邮件、带宽需预算与限流。

---

## 阶段 A 实施说明（仓库内）

实现入口见 `lib/rss-feeds.ts`、`lib/parse-rss.ts`、`lib/news-service.ts`；侧栏在 `sidepanel.tsx` 中调用 `loadNewsForIndustries`。详细行为以代码与单测为准。
