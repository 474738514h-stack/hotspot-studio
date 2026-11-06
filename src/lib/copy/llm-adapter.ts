import type { CopyInput, EngineId } from "@/lib/types"
import { ENGINE_OPTIONS, TONE_LABEL } from "@/lib/steps"

/**
 * 文案引擎的替换点。
 * 界面只依赖 CopyEngine。演示环境使用本地引擎；
 * 接入真实模型时，在服务端读取 LLM_API_BASE / LLM_API_KEY / LLM_MODEL，
 * 把 buildLlmRequest 的结果发给兼容 OpenAI 的 chat completions，
 * 或把同一份 input 交给 Coze 工作流。
 * 这里不发起网络请求，也不读取密钥。
 */
export const LLM_ENV = {
  base: "LLM_API_BASE",
  key: "LLM_API_KEY",
  model: "LLM_MODEL",
} as const

export const SYSTEM_PROMPT = `你是电商媒体的微博运营。根据给定热点和商品写一条纯文本微博。
要求：
- 口语，像亲手发出去的，不要公关稿腔
- 带话题标签，格式 #话题#
- 适量 emoji，并有一句互动引导
- 禁止极限词：全网第一、国家级、绝对、100%、最好、万能
- 禁止把明星写成代言、同款或本人推荐
- 禁止冒用第三方商标自称官方或联名
- 热点若涉及时政、军事、人员安全，直接拒绝
- 只输出正文，不要标题、解释或 Markdown`

export interface LlmMessage {
  role: "system" | "user"
  content: string
}

export interface LlmCopyRequest {
  model: string
  messages: LlmMessage[]
}

export function buildLlmRequest(input: CopyInput, model = "deepseek-chat"): LlmCopyRequest {
  const products = input.products
    .map(
      (item, index) =>
        `${index + 1}. ${item.brand} ${item.name}，价格 ${item.price} 元（日常 ${item.originalPrice} 元）。卖点：${item.points.join("；")}`,
    )
    .join("\n")
  const user = [
    `热点：${input.news.title}`,
    `摘要：${input.news.summary}`,
    `风险：${input.news.risk}${input.news.riskNote ? `，${input.news.riskNote}` : ""}`,
    `语气：${TONE_LABEL[input.tone]}`,
    `篇幅：${input.length}`,
    `表情：${input.emoji}`,
    `是否写价格：${input.includePrice ? "写" : "不写"}`,
    `商品：`,
    products,
    input.reasons.length ? `匹配理由：${input.reasons.join("；")}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  return {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
  }
}

export function engineMeta(id: EngineId) {
  return ENGINE_OPTIONS.find((item) => item.id === id) ?? ENGINE_OPTIONS[0]
}
