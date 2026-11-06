import type { NewsItem, Product } from "@/lib/types"

export interface ComplianceCheck {
  id: string
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
}

const ENDORSEMENT = /同款|代言|明星推荐|本人在用|亲测推荐|肖战推荐|蓝盈盈推荐/

export function reviewCopy(input: {
  news: NewsItem | null
  products: Product[]
  text: string
  bannedWords: string[]
}): { checks: ComplianceCheck[]; canPass: boolean } {
  const text = input.text.trim()
  const checks: ComplianceCheck[] = []

  if (!input.news) {
    checks.push({
      id: "news",
      label: "已选择热点",
      status: "fail",
      detail: "还没有选定本轮热点。",
    })
  } else if (input.news.risk === "blocked") {
    checks.push({
      id: "news",
      label: "热点可以借势",
      status: "fail",
      detail: input.news.riskNote ?? "该热点已禁止借势营销。",
    })
  } else if (input.news.risk === "caution") {
    checks.push({
      id: "news",
      label: "热点可以借势",
      status: "warn",
      detail: input.news.riskNote ?? "该热点需要人工判断。",
    })
  } else {
    checks.push({
      id: "news",
      label: "热点可以借势",
      status: "pass",
      detail: "未命中时政、军事或公共安全拦截。",
    })
  }

  if (!text) {
    checks.push({
      id: "empty",
      label: "正文不为空",
      status: "fail",
      detail: "还没有可发布的文案。",
    })
  } else {
    checks.push({
      id: "empty",
      label: "正文不为空",
      status: "pass",
      detail: `当前 ${text.length} 字。`,
    })
  }

  const hitBan = input.bannedWords.filter((word) => word && text.includes(word))
  checks.push({
    id: "ads",
    label: "广告法极限词",
    status: hitBan.length ? "fail" : "pass",
    detail: hitBan.length ? `命中禁用词：${hitBan.join("、")}` : "未命中当前禁用词表。",
  })

  const endorsement = ENDORSEMENT.test(text)
  checks.push({
    id: "endorse",
    label: "未授权代言",
    status: endorsement ? "fail" : "pass",
    detail: endorsement
      ? "出现代言、同款或明星推荐表述。请改成只讲商品。"
      : "没有把明星或达人写成代言。",
  })

  const mentionsAdidas = /阿迪达斯|Adidas|adidas/i.test(text)
  const ownsAdidas = input.products.some((item) => item.brand.includes("阿迪达斯"))
  checks.push({
    id: "trademark",
    label: "商标借用",
    status: mentionsAdidas && !ownsAdidas ? "warn" : "pass",
    detail:
      mentionsAdidas && !ownsAdidas
        ? "文案出现「阿迪达斯」，当前商品不是该品牌。确认只是引用热搜，而不是自称官方或联名。"
        : "未发现冒用第三方商标的明显表述。",
  })

  if (input.news?.id === "rules" && /解读|红利|补贴|官方确认|必须买/.test(text)) {
    checks.push({
      id: "policy",
      label: "政策表述",
      status: "fail",
      detail: "文案在解读政策或暗示红利，需要删掉后再审。",
    })
  } else if (input.news?.risk === "caution" && input.news.tags.includes("政策")) {
    checks.push({
      id: "policy",
      label: "政策表述",
      status: "pass",
      detail: "没有把新规写成购买理由。",
    })
  }

  checks.push({
    id: "hash",
    label: "话题标签",
    status: /#[^#\s]+#|#\S+/.test(text) ? "pass" : "warn",
    detail: /#/.test(text) ? "已包含话题标签。" : "建议补上 #话题#，方便热搜承接。",
  })

  checks.push({
    id: "cta",
    label: "互动引导",
    status: /评论|扣|转发|？|\?/.test(text) ? "pass" : "warn",
    detail: /评论|扣|转发|？|\?/.test(text) ? "有互动引导。" : "结尾可以加一句评论区引导。",
  })

  const prices = [...text.matchAll(/¥\s*(\d+(?:\.\d+)?)/g)].map((item) => Number(item[1]))
  const allowedPrices = new Set(input.products.flatMap((item) => [item.price, item.originalPrice]))
  const mismatched = prices.filter((price) => !allowedPrices.has(price))
  checks.push({
    id: "price",
    label: "价格与商品一致",
    status: mismatched.length ? "warn" : "pass",
    detail: mismatched.length
      ? `文案里的价格 ¥${mismatched.join("、¥")} 不在已绑定商品中。`
      : prices.length
        ? "文案价格能对上已绑定商品。"
        : "文案未写价格。",
  })

  checks.push({
    id: "length",
    label: "篇幅",
    status: text.length > 800 ? "warn" : "pass",
    detail: text.length > 800 ? "超过 800 字，信息流里容易被折断。" : "篇幅适合微博阅读。",
  })

  return {
    checks,
    canPass: checks.every((item) => item.status !== "fail"),
  }
}

export const DEFAULT_BANNED_WORDS = ["全网第一", "国家级", "永久有效", "最好", "绝对", "100%", "万能", "史上最低", "第一品牌"]
