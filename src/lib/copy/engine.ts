import type { CopyInput, CopyVariant, EngineId, EmojiLevel, Tone } from "@/lib/types"
import { delay } from "@/lib/format"
import { ENGINE_OPTIONS, GENERATE_DELAY_MS, TONE_LABEL } from "@/lib/steps"

const OPENERS: Record<string, Record<Tone, string>> = {
  "signal-9": {
    seed: "素人官宣这一波，我真正记下的不是 CP，是大家准备熬夜追更。",
    trend: "《心动的信号》热搜还在往上走，评论区已经开始排追更时间了。",
    urgent: "热搜挂在第一的这几个小时，追剧党还在线。",
    interactive: "这一季你打算追更，还是等切片？",
  },
  oil: {
    seed: "油价窗口今晚开，我先不猜涨跌，先把车上那两件小事补齐。",
    trend: "新一轮油价调整挂上热搜了，通勤党的时间线全是算账。",
    urgent: "调价窗口在今晚 24 点，车上的小装备现在说还来得及。",
    interactive: "油价如果上调，你第一反应是少开车，还是先把车况查一遍？",
  },
  chinajoy: {
    seed: "ChinaJoy 的返图刷屏以后，我只想把桌上的外设换得能看。",
    trend: "ChinaJoy 热搜还在发酵，外设馆的照片比新游预告传得更快。",
    urgent: "展会热搜就这几天，外设种草的窗口很短。",
    interactive: "你去 ChinaJoy 会先拍手柄，还是先拍键盘？",
  },
  school: {
    seed: "开学三件套卖不动的新闻，我对着自家库存看了三遍。",
    trend: "杭州老板愁坏了的开学季，评论区都在问：那现在还该囤笔吗？",
    urgent: "热搜还挂着的这几个小时，是文具最后一波自然流量。",
    interactive: "如果开学三件套真的卖不动了，你会先砍掉哪一件？",
  },
  rules: {
    seed: "新规热搜我不多嘴，只说一件和生活有关、和法规无关的小事。",
    trend: "8 月新规上了热搜。这里不解读条款，只留一个日常消耗。",
    urgent: "热搜在讲新规，店里不跟这个口径，今天只说本来就要补的货。",
    interactive: "新规帖你转发了吗？转发完记得也给自己倒杯水。",
  },
  lan: {
    seed: "新剧热搜起来的时候，我只看评论区里反复出现的那句「皮肤好干」。",
    trend: "剧集热搜冲上去了。妆造可以讨论，商品不借演员的名字。",
    urgent: "热搜还在前排，护肤需求是观众自己说的，不是明星说的。",
    interactive: "追新剧的时候，你是边看边敷面膜，还是看完再补救？",
  },
  adidas: {
    seed: "运动品牌的财报热搜刷屏了。我家没有那个 logo，只有一双自己的跑鞋。",
    trend: "「中国达斯」上了热搜。借的是运动消费的情绪，不是别人的商标。",
    urgent: "热搜还在，想换跑鞋的人这会儿就在看时间线。",
    interactive: "看到运动品牌热搜，你会想买大牌，还是先把脚上那双换舒服？",
  },
  water: {
    seed: "旋转矿泉水火了以后，办公室的杯子突然都显得不够大。",
    trend: "1.55 升旋转水瓶上了热搜，单瓶 6 元的讨论比口味还热闹。",
    urgent: "喝水挑战还在发酵，这会儿正适合讲大容量杯。",
    interactive: "你会为了一只能转的瓶子买单，还是只要容量够大？",
  },
  xiaozhan: {
    seed: "路透刷屏那天，评论区在猜衣服版型。我只敢聊版型本身。",
    trend: "新剧路透上了热搜。穿搭可以聊，不能写成谁的同款。",
    urgent: "热搜还在往外溢，宽松卫衣是评论里最安全的那一种。",
    interactive: "看路透的时候，你先注意脸，还是先注意衣服版型？",
  },
}

const CTAS: Record<Tone, string> = {
  seed: "想要链接的，评论区扣「要」，我置顶。",
  trend: "还在刷这条热搜的，直接扣「跟上」。",
  urgent: "今晚 24 点前备注「热点」，客服按这个口径回复。",
  interactive: "你会因为一条热搜下单吗？会的扣 1，再看看扣 2。",
}

const MARKS: Record<EmojiLevel, string[]> = {
  low: ["·", "·", "·"],
  mid: ["✨", "✨", "✨"],
  high: ["🔥", "✨", "💡"],
}

const TONE_EMOJI: Record<Tone, string> = {
  seed: "😌",
  trend: "📈",
  urgent: "⏰",
  interactive: "💬",
}

function variantTones(): Tone[] {
  return ["trend", "urgent", "interactive"]
}

function engineLabel(engineId: EngineId) {
  const option = ENGINE_OPTIONS.find((item) => item.id === engineId)
  if (!option) return "deepseek-chat"
  return option.short
}

function opener(input: CopyInput, tone: Tone) {
  const line = OPENERS[input.news.id]?.[tone] ?? `${input.news.title}还在热搜上。先把能说清楚的商品说清楚。`
  if (input.emoji === "low") return line
  return `${line}${TONE_EMOJI[tone]}`
}

function pointsBlock(input: CopyInput) {
  const product = input.products[0]
  const marks = MARKS[input.emoji]
  return product.points.slice(0, 3).map((point, index) => `${marks[index]} ${point}`).join("\n")
}

function bridge(input: CopyInput, tone: Tone) {
  const product = input.products[0]
  const reason = input.reasons[0] ?? "商品和这条热点落在同一个使用场景里"
  const names =
    input.products.length > 1
      ? `这次一起看的是${input.products.map((item) => item.name).join("、")}，主推「${product.name}」。`
      : `对上的商品是「${product.name}」。`
  if (tone === "urgent") return `${names}${reason}`
  if (input.engineId === "local-news") return `刚刚在刷热搜：${names}${reason}`
  return `${names}${reason}`
}

function priceLine(input: CopyInput) {
  if (!input.includePrice) return ""
  return input.products
    .map((item) => `${item.name}参考价 ¥${item.price}，日常 ¥${item.originalPrice}。`)
    .join("\n")
}

function hashtags(input: CopyInput) {
  const tags = [`#${input.news.hashtag}#`, ...input.products.slice(0, 2).map((item) => `#${item.shortTag}#`), "#热点好物官#"]
  return tags.join(" ")
}

export function composeVariant(input: CopyInput, tone: Tone, index: number): CopyVariant {
  const product = input.products[0]
  const blocks: string[] = [opener(input, tone)]

  if (input.length !== "short") {
    blocks.push(bridge(input, tone))
  }

  blocks.push(pointsBlock(input))

  if (input.length === "long") {
    blocks.push(product.scene)
    if (input.products.length > 1) {
      blocks.push(`另外 ${input.products.slice(1).map((item) => item.name).join("、")} 可以当搭配，不必一次讲完。`)
    }
  }

  const price = priceLine(input)
  if (price && input.length !== "short") blocks.push(price)
  if (price && input.length === "short") blocks.push(price)

  let cta = CTAS[tone]
  if (input.engineId === "local-seed" && tone === "seed") {
    cta = "买过的朋友也可以直接说手感，我置顶真实反馈。"
  }
  blocks.push(cta)
  blocks.push(hashtags(input))

  const text = blocks.filter(Boolean).join("\n\n")
  return {
    id: `${input.news.id}-${input.products.map((item) => item.id).join("+")}-${tone}-${index}`,
    label: `版本 ${String.fromCharCode(65 + index)}`,
    tone,
    text,
    engineLabel: engineLabel(input.engineId),
  }
}

export function composeAll(input: CopyInput): CopyVariant[] {
  return variantTones().map((tone, index) => composeVariant(input, tone, index))
}

export async function generateCopies(input: CopyInput): Promise<CopyVariant[]> {
  await delay(GENERATE_DELAY_MS)
  return composeAll(input)
}

export function tweakCopy(text: string, kind: "shorter" | "less-emoji" | "more-cta" | "no-price") {
  if (kind === "less-emoji") {
    return text.replace(/\p{Extended_Pictographic}/gu, "").replace(/[ ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  }
  if (kind === "no-price") {
    return text
      .split("\n")
      .filter((line) => !line.includes("¥") && !/参考价/.test(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  }
  if (kind === "more-cta") {
    if (/评论|扣|？|\?/.test(text)) return text
    const hashIndex = text.lastIndexOf("\n#")
    const line = "你会把这条留给自己，还是转给正在纠结的朋友？"
    if (hashIndex === -1) return `${text}\n\n${line}`
    return `${text.slice(0, hashIndex).trim()}\n\n${line}\n\n${text.slice(hashIndex).trim()}`
  }
  const parts = text.split(/\n{2,}/)
  const hash = parts.filter((part) => part.trim().startsWith("#"))
  const points = parts.filter((part) => /^[·✨🔥💡]/.test(part.trim()) || part.includes("\n·") || part.includes("✨"))
  const openerLine = parts[0]
  const cta = [...parts].reverse().find((part) => /评论|扣|？|\?/.test(part) && !part.trim().startsWith("#"))
  return [openerLine, points[0], cta, hash[0]].filter(Boolean).join("\n\n").trim()
}

export function toneLabel(tone: Tone) {
  return TONE_LABEL[tone]
}
