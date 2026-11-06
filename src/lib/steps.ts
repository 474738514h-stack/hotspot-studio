import type { StepId } from "@/lib/types"

export const STEPS: { id: StepId; title: string; desc: string }[] = [
  { id: 1, title: "新闻抓取", desc: "监控热点来源" },
  { id: 2, title: "建议匹配商品", desc: "系统智能推荐" },
  { id: 3, title: "匹配商品", desc: "商品库深度筛选" },
  { id: 4, title: "创作文案", desc: "LLM 微博文案生成" },
  { id: 5, title: "审核并发送", desc: "合规审核 · 模拟发布" },
]

export const OPERATOR = {
  name: "运营小童",
  nickname: "Yuki",
  group: "电商运营组",
  title: "高级运营",
  staffId: "OP-2048",
  email: "yuki.ops@hotspot.studio",
  registeredAt: "2024-03-18",
  lastLogin: "今天 09:12",
  status: "已登录",
}

export const WEIBO_ACCOUNT = {
  name: "好物研究所Lab",
  handle: "labgoods",
  fans: "86.2万",
  verified: "企业蓝V",
}

export const PAGE_INSET = "px-6"
export const ADAPTIVE_GRID = "grid w-full grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3"
export const ADAPTIVE_GRID_PRODUCT = "grid w-full grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-3"
export const CARD_SHADOW = "shadow-[0_1px_2px_rgba(28,31,42,0.04)]"
export const CARD_IDLE = "border-2 border-[#e6e8ee] bg-white"
export const CARD_SELECTED = "border-2 border-[#6d4aff] bg-[#f4f0ff] shadow-[0_0_0_3px_rgba(109,74,255,0.16)]"
export const CHROME_BUTTON = "border-[#d5d8e0] bg-white text-[#1c1f2a] shadow-none hover:bg-[#f7f8fa]"

export const GENERATE_DELAY_MS = 1500

export const TONE_LABEL = {
  seed: "种草安利",
  trend: "热点借势",
  urgent: "限时紧迫",
  interactive: "互动提问",
} as const

export const ENGINE_OPTIONS = [
  {
    id: "local-seed" as const,
    label: "演示引擎 · 微博种草",
    short: "微博种草",
    connected: true,
    detail: "本地模板引擎，口语种草腔。不发起外部请求。",
  },
  {
    id: "local-news" as const,
    label: "演示引擎 · 热搜口播",
    short: "热搜口播",
    connected: true,
    detail: "本地模板引擎，先报热搜再接到商品。不发起外部请求。",
  },
  {
    id: "reserved-deepseek" as const,
    label: "deepseek-chat · 未接入",
    short: "deepseek-chat",
    connected: false,
    detail: "接口已预留。未配置密钥时自动回退到本地演示引擎。",
  },
  {
    id: "reserved-coze" as const,
    label: "Coze 工作流 · 未接入",
    short: "Coze 工作流",
    connected: false,
    detail: "可替换为 Coze 工作流 webhook。当前回退到本地演示引擎。",
  },
]
