import type { MatchResult, NewsItem, Product } from "@/lib/types"
import { PRODUCTS } from "@/lib/products"

interface Curated {
  score: number
  reason: string
  risks?: string[]
}

const CURATED: Record<string, Record<string, Curated>> = {
  "econ-h2": {
    lamp: { score: 70, reason: "若不是时政禁区，台灯只算日常办公消费，仍然不能借这条热点。" },
    coffee: { score: 64, reason: "咖啡是办公室消耗品，和宏观经济新闻没有可安全连接的卖点。" },
  },
  "signal-9": {
    mask: { score: 96, reason: "追剧间隙敷得完，美妆讨论和这波热搜同期升高。" },
    coffee: { score: 84, reason: "夜谈局的饮料位，适合挂在追剧话题下面，不抢剧情。" },
    hoodie: { score: 76, reason: "观众在猜造型，卫衣是评论区里比较安全的日常穿搭。" },
    headset: { score: 70, reason: "连看更新用得上，耳机只服务观看，不蹭素人 CP。" },
  },
  oil: {
    charger: { score: 95, reason: "油价窗口打开时，车里充电是通勤帖最自然的延伸。" },
    gauge: { score: 91, reason: "少跑一趟补胎店，比空谈油价更具体。" },
    bottle: { score: 68, reason: "通勤车上常备水，可以轻轻挂在出行场景里。" },
  },
  chinajoy: {
    gamepad: { score: 97, reason: "展会返图里出镜最多的就是手柄。" },
    keyboard: { score: 94, reason: "外设馆的键盘声，热搜听得见。" },
    headset: { score: 92, reason: "排队和连坐都用得上，现场和回酒店都能戴。" },
    speaker: { score: 86, reason: "闭馆以后的外放需求，比在现场硬放更合适。" },
  },
  school: {
    "pen-set": { score: 98, reason: "新闻直接在说文具卖不动，笔套装就在同一货架上。" },
    backpack: { score: 93, reason: "三件套里的包，家长仍在比能不能背一学期。" },
    lamp: { score: 86, reason: "宿舍和书桌场景还在，灯比横幅好讲清楚。" },
  },
  military: {},
  rules: {
    coffee: { score: 74, reason: "只承接日常生活，咖啡不是政策，也不解释新规。", risks: ["文案不得解读新规或暗示政策红利。"] },
    lamp: { score: 70, reason: "居家场景可以出现，但不能写成「新规推荐」。", risks: ["文案不得解读新规或暗示政策红利。"] },
    bottle: { score: 68, reason: "喝水是生活习惯，和法规本身拉开距离。", risks: ["文案不得解读新规或暗示政策红利。"] },
  },
  lan: {
    mask: { score: 90, reason: "剧集热搜带起护肤检索。只讲面膜，不讲演员本人。", risks: ["禁止写成代言、同款或明星推荐。"] },
    hoodie: { score: 84, reason: "造型讨论高，卫衣只谈版型，不谈谁穿过。", risks: ["禁止写成代言、同款或明星推荐。"] },
    coffee: { score: 66, reason: "追剧饮料，离明星本人更远，风险更低。" },
  },
  adidas: {
    shoes: {
      score: 94,
      reason: "运动消费热度在。商品是劲步自有跑鞋，不是阿迪达斯。",
      risks: ["不得冒用阿迪达斯商标，不得写成官方、专柜或联名。"],
    },
    socks: {
      score: 86,
      reason: "运动讨论可以落到袜子这种小件，仍然不能借品牌名义。",
      risks: ["不得冒用阿迪达斯商标，不得写成官方、专柜或联名。"],
    },
  },
  spain: {
    cubes: { score: 58, reason: "收纳包和出行有关，但这条热点涉及人员安危，不能用。" },
  },
  water: {
    bottle: { score: 98, reason: "热搜就是大容量旋转瓶，这只旋盖杯是同类杯壶，不是那瓶水本身。" },
    coffee: { score: 64, reason: "饮料货架上的邻近选择，适合作为第二件。" },
  },
  "no-nap": {
    coffee: { score: 97, reason: "热点命中「午休、下班」场景，冷萃液正好填上下午那一截。" },
    lamp: { score: 86, reason: "提前下班后的书桌时间，灯比空谈工时更具体。" },
    bottle: { score: 82, reason: "连轴转的下午需要随时补水。" },
    mask: { score: 76, reason: "下班提前了，护肤可以挪到四点以后。" },
  },
  typhoon: {
    lamp: { score: 84, reason: "只讲在家照明，不消费台风本身。", risks: ["不得消费灾情或制造恐慌。"] },
    bottle: { score: 78, reason: "日常备水，不写成救灾物资。", risks: ["不得消费灾情或制造恐慌。"] },
    coffee: { score: 74, reason: "宅家的一杯咖啡，和路径预报无关。", risks: ["不得消费灾情或制造恐慌。"] },
  },
  hotpot: {
    coffee: { score: 80, reason: "不排队的时候，在家也能有一杯热饮。" },
    bottle: { score: 70, reason: "吃饭前后的补水，不硬蹭火锅。" },
  },
  major: {
    "pen-set": { score: 90, reason: "专业讨论一热，文具检索会跟着动。" },
    backpack: { score: 84, reason: "升学场景里，书包仍是家长会比较的一件。" },
    lamp: { score: 78, reason: "宿舍和书桌还在，灯可以接着说。" },
  },
  plog: {
    coffee: { score: 92, reason: "月度记录里出镜最多的是杯子和早餐。" },
    lamp: { score: 80, reason: "桌面光源决定 plog 好不好看。" },
    bottle: { score: 76, reason: "大容量杯是桌面照的固定道具。" },
  },
  charm: {
    hoodie: { score: 82, reason: "城市体验热搜可以落到日常穿搭，不讲宏大叙事。" },
    shoes: { score: 76, reason: "出门走一走的装备，只讲脚感。" },
  },
  xiaozhan: {
    hoodie: { score: 92, reason: "路透穿搭讨论高。卫衣只谈版型，不谈明星。", risks: ["禁止「肖战同款」「代言」等未授权表述。"] },
    mask: { score: 83, reason: "妆造话题可以落到护肤，不能落到本人。", risks: ["禁止「肖战同款」「代言」等未授权表述。"] },
    headset: { score: 68, reason: "追剧耳机和人物无关，借势更干净。" },
  },
}

export function matchProducts(news: NewsItem, products: Product[] = PRODUCTS): MatchResult[] {
  const table = CURATED[news.id] ?? {}
  return products
    .map((product) => {
      const curated = table[product.id]
      const shared = product.tags.filter((tag) => news.preferredTags.includes(tag))
      if (curated) {
        const reasons = [curated.reason]
        if (shared.length > 0) {
          reasons.push(`标签命中 ${shared.map((tag) => `「${tag}」`).join("")}`)
        }
        return {
          product,
          score: curated.score,
          reasons,
          risks: curated.risks ?? [],
        }
      }
      const score = Math.min(72, 28 + shared.length * 12 + (product.rating > 4.8 ? 4 : 0))
      const reasons =
        shared.length > 0
          ? [`标签命中 ${shared.map((tag) => `「${tag}」`).join("")}，相关但不是首选。`]
          : ["和当前热点没有直接标签重合，仅供手动对比。"]
      return { product, score, reasons, risks: [] }
    })
    .sort((a, b) => b.score - a.score || b.product.sales - a.product.sales)
}

export function topMatches(news: NewsItem, limit = 6) {
  return matchProducts(news).slice(0, limit)
}
