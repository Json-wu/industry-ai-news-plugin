import type { IndustryId } from "./industries"

export type NewsBrief = {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  industry: IndustryId
  /** 稳定缩略图；未设置时用 picsum 按 id 派生 */
  imageUrl?: string
  /** 列表批次来源：RSS 聚合或本地演示 */
  dataSource?: "rss" | "mock"
}

export function imageUrlForBrief(b: NewsBrief): string {
  if (b.imageUrl) {
    return b.imageUrl
  }
  return `https://picsum.photos/seed/ian-${encodeURIComponent(b.id)}/200/200`
}

const THUMB = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`

/** Demo data — 后续可替换为 API 拉取 */
export const MOCK_BRIEFS: NewsBrief[] = [
  {
    id: "1",
    title: "国产大模型在工业质检场景取得突破",
    summary: "多模态技术结合产线数据，在三家头部制造企业试点中显著降低误检率。",
    url: "https://example.com/news/tech-1",
    source: "科技日报",
    publishedAt: "2026-04-21",
    industry: "tech",
    imageUrl: THUMB("tech-a")
  },
  {
    id: "2",
    title: "欧盟拟更新前沿 AI 安全框架草案",
    summary: "草案强调开源权重与红队测试披露，或影响海外模型部署策略。",
    url: "https://example.com/news/politics-1",
    source: "Politico EU",
    publishedAt: "2026-04-21",
    industry: "politics",
    imageUrl: THUMB("pol-a")
  },
  {
    id: "3",
    title: "新一代舰载雷达外场联试进展披露",
    summary: "在复杂电磁环境测试中达到阶段指标，后续将转入舰上适配。",
    url: "https://example.com/news/mil-1",
    source: "简氏防务",
    publishedAt: "2026-04-20",
    industry: "military",
    imageUrl: THUMB("mil-a")
  },
  {
    id: "4",
    title: "肿瘤早筛多癌种联检获临床路径关注",
    summary: "液体活检与真实世界数据结合，多家三甲医院启动队列研究。",
    url: "https://example.com/news/med-1",
    source: "医学快讯",
    publishedAt: "2026-04-20",
    industry: "medical",
    imageUrl: THUMB("med-a")
  },
  {
    id: "5",
    title: "合成生物平台融资密集，行业迎来整合期",
    summary: "平台型公司与细分管线并购增多，机构提示估值分化风险。",
    url: "https://example.com/news/bio-1",
    source: "CB Insights",
    publishedAt: "2026-04-19",
    industry: "biology",
    imageUrl: THUMB("bio-a")
  },
  {
    id: "6",
    title: "沿海风电运维「无人化+AI」示范工程落地",
    summary: "利用无人机与边缘推理降低停机窗口，为存量风电改造提供参考。",
    url: "https://example.com/news/env-1",
    source: "能源观察",
    publishedAt: "2026-04-19",
    industry: "environment",
    imageUrl: THUMB("env-a")
  },
  {
    id: "7",
    title: "端侧大模型在智能手机 SoC 上的功耗优化新进展",
    summary: "多家芯片厂公布联合调优方案，推理延迟在旗舰机上进一步下降。",
    url: "https://example.com/news/tech-2",
    source: "芯智讯",
    publishedAt: "2026-04-18",
    industry: "tech",
    imageUrl: THUMB("tech-b")
  },
  {
    id: "8",
    title: "国会听证会聚焦选举深度伪造治理路径",
    summary: "跨党派倡议平台水印与可溯源，平台责任边界成为讨论焦点。",
    url: "https://example.com/news/pol-2",
    source: "Reuters",
    publishedAt: "2026-04-18",
    industry: "politics",
    imageUrl: THUMB("pol-b")
  },
  {
    id: "9",
    title: "空军新型教练机高教阶段试飞科目扩容",
    summary: "强调复杂气象与编队导调，为后续接装衔接铺路。",
    url: "https://example.com/news/mil-2",
    source: "国防周刊",
    publishedAt: "2026-04-17",
    industry: "military",
    imageUrl: THUMB("mil-b")
  },
  {
    id: "10",
    title: "口服 GLP-1 类药物真实世界依从性研究发布",
    summary: "大样本显示生活方式干预仍与药物协同不可或缺。",
    url: "https://example.com/news/med-2",
    source: "NEJM 摘要",
    publishedAt: "2026-04-17",
    industry: "medical",
    imageUrl: THUMB("med-b")
  },
  {
    id: "11",
    title: "基因编辑递送工具取得动物实验效率提升",
    summary: "新型脂质纳米颗粒在肝脏靶向性上展现更好分布特性。",
    url: "https://example.com/news/bio-2",
    source: "Nature 摘要",
    publishedAt: "2026-04-16",
    industry: "biology",
    imageUrl: THUMB("bio-b")
  },
  {
    id: "12",
    title: "碳市场扩容纳入新行业，配套 MRV 细则征求意见",
    summary: "数据质量与第三方核查成为配套文件的重点章节。",
    url: "https://example.com/news/env-2",
    source: "财经十一人",
    publishedAt: "2026-04-16",
    industry: "environment",
    imageUrl: THUMB("env-b")
  },
  {
    id: "13",
    title: "RISC-V 高性能服务器板卡在开源社区受关注",
    summary: "软件生态与固件安全仍是企业采纳前的主要评估项。",
    url: "https://example.com/news/tech-3",
    source: "开源中国",
    publishedAt: "2026-04-15",
    industry: "tech",
    imageUrl: THUMB("tech-c")
  },
  {
    id: "14",
    title: "能源转型补贴退出节奏引发多国政策博弈",
    summary: "制造业回流与绿电消纳在选举周期内被重新定价。",
    url: "https://example.com/news/pol-3",
    source: "Bloomberg",
    publishedAt: "2026-04-15",
    industry: "politics",
    imageUrl: THUMB("pol-c")
  },
  {
    id: "15",
    title: "近海声呐监测网络与民船数据融合试验启动",
    summary: "强调隐私脱敏与海域分级共享机制。",
    url: "https://example.com/news/mil-3",
    source: "海事技术",
    publishedAt: "2026-04-14",
    industry: "military",
    imageUrl: THUMB("mil-c")
  },
  {
    id: "16",
    title: "数字疗法纳入地方医保支付试点再扩围",
    summary: "疗效证据等级与复评周期在指南中被反复强调。",
    url: "https://example.com/news/med-3",
    source: "健康界",
    publishedAt: "2026-04-14",
    industry: "medical",
    imageUrl: THUMB("med-c")
  },
  {
    id: "17",
    title: "农业微生物菌剂在盐碱地修复中的田间数据公布",
    summary: "多季对照显示产量回升路径与土壤指标改善可观测。",
    url: "https://example.com/news/bio-3",
    source: "农财网",
    publishedAt: "2026-04-13",
    industry: "biology",
    imageUrl: THUMB("bio-c")
  },
  {
    id: "18",
    title: "特高压外送与储能配比新规测算引发讨论",
    summary: "区域电网协同调度模型成为论证核心。",
    url: "https://example.com/news/env-3",
    source: "电力知库",
    publishedAt: "2026-04-13",
    industry: "environment",
    imageUrl: THUMB("env-c")
  },
  {
    id: "19",
    title: "人形机器人在汽车总装线试点搬运与质检",
    summary: "安全笼与协作域划分成为产线改造标配。",
    url: "https://example.com/news/tech-4",
    source: "机器之心",
    publishedAt: "2026-04-12",
    industry: "tech",
    imageUrl: THUMB("tech-d")
  },
  {
    id: "20",
    title: "联合国气候峰会前夕多国更新NDC目标表述",
    summary: "甲烷与非二氧化碳温室气体被更多写入附件指标。",
    url: "https://example.com/news/pol-4",
    source: "Carbon Brief",
    publishedAt: "2026-04-12",
    industry: "politics",
    imageUrl: THUMB("pol-d")
  }
]

export function filterBriefsByIndustries(
  briefs: NewsBrief[],
  industryIds: IndustryId[]
): NewsBrief[] {
  if (industryIds.length === 0) {
    return []
  }
  const set = new Set<string>(industryIds)
  return briefs.filter((b) => set.has(b.industry))
}
