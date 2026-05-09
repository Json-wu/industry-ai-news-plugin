import type { IndustryId } from "./industries"
import type { UiLang } from "./ui-locale"

export type Messages = {
  accountSection: string
  accountNotConfiguredBody: string
  accountLoadingSession: string
  accountSignedInPrefix: string
  signOut: string
  accountOtpIntro: string
  sendMagicEmail: string
  sending: string
  accountOpenOptionsLink: string
  otpEnterEmail: string
  otpSentBlurb: string

  settingsTitle: string
  watchIndustries: string
  freeIndustryCap: (n: number) => string
  proUnlimitedIndustries: string
  proDemoCheckbox: string
  newsDataSection: string
  mockOnlyBold: string
  mockOnlyHelpBeforeMono: string
  mockOnlyHelpAfterMono: string
  reminderModeSection: string
  receiveEmailSection: string
  emailPlaceholderEnabled: string
  emailPlaceholderDisabled: string
  subscribeDigestBold: string
  subscribeDigestHelp: string
  digestCronHintBeforeMono: string
  digestCronHintAfterMono: string
  cancel: string
  save: string

  briefSubtitle: string
  discoverMore: string
  loadMoreScrollHint: string
  nextPage: string
  endOfList: string
  loadingNews: string
  emptyNews: string
  emptyNewsHint: string
  mockBannerUserChose: string
  mockBannerFallback: string
  rssPartialFailure: (joinedErrors: string) => string
  rssFetchFailed: (firstError: string) => string
  feedNoItems: (feedUrl: string) => string

  notificationSingleWithTitle: (titleHint: string) => string
  notificationSingleNoTitle: string
  notificationMultiWithTitle: (count: number, titleHint: string) => string
  notificationMultiNoTitle: (count: number) => string

  reminderEvery2hLabel: string
  reminderEvery2hDesc: string
  reminderDndLabel: string
  reminderDndDesc: string
  reminderTwiceLabel: string
  reminderTwiceDesc: string

  industryLabel: Record<IndustryId, string>

  onboardingTitle: string
  onboardingSubtitle: string
  onboardingPickOneError: string
  onboardingFreeCapError: (n: number) => string
  getStarted: string

  themeGroup: string
  themeLight: string
  themeDark: string
  settingsMenuTitle: string
  settingsOpenAria: string

  optionsProcessing: string
  optionsEnvMissing: string
  optionsSupabaseInitFail: string
  optionsSignedIn: (mail: string) => string
  optionsSignedInSynced: (mail: string) => string
  optionsNoSession: string
  optionsSessionReadError: string

  loadingPanel: string
}

const zh: Messages = {
  accountSection: "账号",
  accountNotConfiguredBody:
    "未配置 Supabase：构建时请在环境变量中设置 PLASMO_PUBLIC_SUPABASE_URL 与 PLASMO_PUBLIC_SUPABASE_ANON_KEY（参见仓库 .env.example），重新构建后登录才会生效。",
  accountLoadingSession: "正在读取登录状态…",
  accountSignedInPrefix: "已登录：",
  signOut: "登出",
  accountOtpIntro:
    "使用邮箱一次性登录。邮件内链接会打开本扩展的「选项」页以完成会话；若收不到，请查垃圾箱并在 Supabase 控制台核对 Redirect URL。",
  sendMagicEmail: "发送登录邮件",
  sending: "发送中…",
  accountOpenOptionsLink:
    "打开扩展「选项」页（邮件链接也会打开此页以完成登录）",
  otpEnterEmail: "请输入邮箱",
  otpSentBlurb:
    "已发送登录邮件，请查收；点击链接后在此扩展的「选项」页完成登录。",

  settingsTitle: "设置",
  watchIndustries: "关注行业",
  freeIndustryCap: (n) => `免费版最多 ${n} 个；开启 Pro 不限。`,
  proUnlimitedIndustries: "Pro：行业数量不限。",
  proDemoCheckbox: "Pro（演示开关：邮箱与不限行业）",
  newsDataSection: "资讯数据",
  mockOnlyBold: "仅使用本地演示数据",
  mockOnlyHelpBeforeMono: "开启后不请求网络 RSS，便于离线或调试。关闭后按设置中的行业拉取 ",
  mockOnlyHelpAfterMono: " 里配置的源。",
  reminderModeSection: "提醒模式",
  receiveEmailSection: "接收邮箱",
  emailPlaceholderEnabled: "name@example.com",
  emailPlaceholderDisabled: "开启 Pro 后可填写",
  subscribeDigestBold: "订阅邮件简报",
  subscribeDigestHelp:
    "需配置 Resend 与定时任务；正文摘要来自与侧栏相同的 URL 缓存。关闭后等同于退订（也可通过邮件内退订链接）。",
  digestCronHintBeforeMono: "发信频率见仓库 ",
  digestCronHintAfterMono: "；服务端限流见 Edge 配置。",
  cancel: "取消",
  save: "保存",

  briefSubtitle: "简报",
  discoverMore: "发现更多",
  loadMoreScrollHint: "继续向下滑动以加载更多",
  nextPage: "下一页",
  endOfList: "— 已加载全部 —",
  loadingNews: "正在拉取资讯…",
  emptyNews: "暂无符合已选行业的简报。",
  emptyNewsHint: "可在设置中调整关注行业。",
  mockBannerUserChose: "已开启「仅使用本地演示数据」，未请求在线 RSS",
  mockBannerFallback: "当前为演示数据（在线源不可用或解析失败时回退）",
  rssPartialFailure: (e) => `部分源未成功：${e}`,
  rssFetchFailed: (e) => `无法拉取在线资讯，已显示演示数据。${e}`,
  feedNoItems: (u) => `${u}: 无有效条目或解析失败`,

  notificationSingleWithTitle: (h) => `新简报 ${h}点击图标可在侧栏查看。`,
  notificationSingleNoTitle: "检测到 1 条新行业简报，点击图标可在侧栏查看。",
  notificationMultiWithTitle: (c, h) =>
    `共 ${c} 条新简报，含 ${h}等。点击图标可在侧栏查看。`,
  notificationMultiNoTitle: (c) =>
    `检测到 ${c} 条新行业简报，点击图标可在侧栏查看。`,

  reminderEvery2hLabel: "每 2 小时",
  reminderEvery2hDesc: "默认，定时提醒",
  reminderDndLabel: "免打扰",
  reminderDndDesc: "不推送系统提醒",
  reminderTwiceLabel: "每天 2 次",
  reminderTwiceDesc: "约 9:00 与 18:00",

  industryLabel: {
    tech: "科技",
    military: "军事",
    politics: "政治",
    medical: "医疗",
    biology: "生物",
    environment: "环境"
  },

  onboardingTitle: "选择感兴趣的行业",
  onboardingSubtitle: "我们将据此展示新闻简报；之后可在设置中随时修改。",
  onboardingPickOneError: "请至少选择一个行业。",
  onboardingFreeCapError: (n) => `免费版最多选择 ${n} 个行业。`,
  getStarted: "开始使用",

  themeGroup: "主题",
  themeLight: "浅色",
  themeDark: "深色",
  settingsMenuTitle: "设置",
  settingsOpenAria: "打开设置",

  optionsProcessing: "正在处理登录信息…",
  optionsEnvMissing:
    "未配置 Supabase 环境变量，请设置 PLASMO_PUBLIC_SUPABASE_URL 与 PLASMO_PUBLIC_SUPABASE_ANON_KEY 后重新构建。",
  optionsSupabaseInitFail: "无法初始化 Supabase 客户端。",
  optionsSignedIn: (mail) => `已登录：${mail}。可关闭本页并返回侧栏。`,
  optionsSignedInSynced: (mail) =>
    `已登录：${mail}。可关闭本页并返回侧栏。偏好已写入本机并与云端对齐。`,
  optionsNoSession:
    "未识别到有效会话。若你刚刚点击了邮件中的链接，请重试；否则请从侧栏重新发送登录邮件。",
  optionsSessionReadError: "读取会话时出错。",

  loadingPanel: "加载中…"
}

const en: Messages = {
  accountSection: "Account",
  accountNotConfiguredBody:
    "Supabase is not configured. Set PLASMO_PUBLIC_SUPABASE_URL and PLASMO_PUBLIC_SUPABASE_ANON_KEY at build time (see .env.example), then rebuild for sign-in to work.",
  accountLoadingSession: "Loading session…",
  accountSignedInPrefix: "Signed in:",
  signOut: "Sign out",
  accountOtpIntro:
    "Sign in with a one-time email link. The link opens this extension’s Options page to finish the session. If you don’t see the email, check spam and verify Redirect URLs in the Supabase dashboard.",
  sendMagicEmail: "Send sign-in email",
  sending: "Sending…",
  accountOpenOptionsLink:
    "Open extension Options (the email link opens this page to complete sign-in)",
  otpEnterEmail: "Enter your email",
  otpSentBlurb:
    "Sign-in email sent. Open the link in the Options page to finish signing in.",

  settingsTitle: "Settings",
  watchIndustries: "Industries",
  freeIndustryCap: (n) => `Free tier: up to ${n}; enable Pro for unlimited.`,
  proUnlimitedIndustries: "Pro: unlimited industries.",
  proDemoCheckbox: "Pro (demo: email + unlimited industries)",
  newsDataSection: "News data",
  mockOnlyBold: "Use local demo data only",
  mockOnlyHelpBeforeMono:
    "When enabled, RSS is not fetched—useful offline or for debugging. When off, feeds follow your industries in ",
  mockOnlyHelpAfterMono: ".",
  reminderModeSection: "Reminders",
  receiveEmailSection: "Email",
  emailPlaceholderEnabled: "name@example.com",
  emailPlaceholderDisabled: "Enable Pro to set email",
  subscribeDigestBold: "Email digest",
  subscribeDigestHelp:
    "Requires Resend and a scheduled job. Summaries use the same URL cache as the side panel. Turning this off opts out (you can also use the link in emails).",
  digestCronHintBeforeMono: "Schedule: see ",
  digestCronHintAfterMono: " in the repo; rate limits are set on the Edge function.",
  cancel: "Cancel",
  save: "Save",

  briefSubtitle: "Brief",
  discoverMore: "Discover more",
  loadMoreScrollHint: "Scroll down to load more",
  nextPage: "Next",
  endOfList: "— End —",
  loadingNews: "Loading news…",
  emptyNews: "No briefs match your selected industries.",
  emptyNewsHint: "Change industries in Settings.",
  mockBannerUserChose:
    "“Use local demo data only” is on; online RSS was not requested.",
  mockBannerFallback:
    "Showing demo data (fallback when feeds fail or are unavailable).",
  rssPartialFailure: (e) => `Some feeds failed: ${e}`,
  rssFetchFailed: (e) => `Could not load online news; showing demo data. ${e}`,
  feedNoItems: (u) => `${u}: no items or parse failed`,

  notificationSingleWithTitle: (h) =>
    `New brief ${h} Open the extension to read in the side panel.`,
  notificationSingleNoTitle:
    "1 new industry brief—open the extension to read in the side panel.",
  notificationMultiWithTitle: (c, h) =>
    `${c} new briefs, including ${h} Open the extension to read in the side panel.`,
  notificationMultiNoTitle: (c) =>
    `${c} new industry briefs—open the extension to read in the side panel.`,

  reminderEvery2hLabel: "Every 2 hours",
  reminderEvery2hDesc: "Default; periodic reminders",
  reminderDndLabel: "Do not disturb",
  reminderDndDesc: "No system notifications",
  reminderTwiceLabel: "Twice daily",
  reminderTwiceDesc: "Around 9:00 and 18:00",

  industryLabel: {
    tech: "Technology",
    military: "Defense",
    politics: "Politics",
    medical: "Healthcare",
    biology: "Life sciences",
    environment: "Environment"
  },

  onboardingTitle: "Pick industries you care about",
  onboardingSubtitle:
    "We’ll tailor your brief; you can change this anytime in Settings.",
  onboardingPickOneError: "Select at least one industry.",
  onboardingFreeCapError: (n) => `Free tier allows up to ${n} industries.`,
  getStarted: "Get started",

  themeGroup: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  settingsMenuTitle: "Settings",
  settingsOpenAria: "Open settings",

  optionsProcessing: "Processing sign-in…",
  optionsEnvMissing:
    "Supabase env vars are missing. Set PLASMO_PUBLIC_SUPABASE_URL and PLASMO_PUBLIC_SUPABASE_ANON_KEY, then rebuild.",
  optionsSupabaseInitFail: "Could not initialize the Supabase client.",
  optionsSignedIn: (mail) =>
    `Signed in as ${mail}. You can close this tab and return to the side panel.`,
  optionsSignedInSynced: (mail) =>
    `Signed in as ${mail}. You can close this tab. Preferences synced with the cloud.`,
  optionsNoSession:
    "No active session. If you just clicked the email link, try again; otherwise send a new sign-in email from the side panel.",
  optionsSessionReadError: "Error reading session.",

  loadingPanel: "Loading…"
}

export function msg(lang: UiLang): Messages {
  return lang === "zh" ? zh : en
}
