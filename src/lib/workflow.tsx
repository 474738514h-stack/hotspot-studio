"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { composeVariant, generateCopies, tweakCopy } from "@/lib/copy/engine"
import { engineMeta } from "@/lib/copy/llm-adapter"
import { DEFAULT_BANNED_WORDS } from "@/lib/compliance"
import { delay, formatShanghaiDateTime, formatShanghaiTime } from "@/lib/format"
import { matchProducts } from "@/lib/matching"
import { createNews } from "@/lib/news"
import { getProduct, PRODUCTS } from "@/lib/products"
import type {
  CopyLength,
  CopyVariant,
  EmojiLevel,
  EngineId,
  Engagement,
  NewsItem,
  Product,
  PublishState,
  ReviewState,
  StepId,
  Tone,
} from "@/lib/types"

const STORAGE_KEY = "hotspot-studio-v1"

interface WorkflowState {
  step: StepId
  mode: "manual" | "auto"
  engineId: EngineId
  newsList: NewsItem[]
  selectedNewsId: string | null
  selectedProductIds: string[]
  copies: CopyVariant[]
  activeCopyId: string | null
  review: ReviewState
  publish: PublishState
  publishedAt: string | null
  publishId: string | null
  engagement: Engagement
  lastFetchLabel: string
  fetching: boolean
  sources: { weibo: boolean; baidu: boolean }
  bannedWords: string[]
  generating: boolean
  regeneratingId: string | null
  autoPhase: number | null
  hydrated: boolean
  tone: Tone
  length: CopyLength
  emoji: EmojiLevel
  includePrice: boolean
  generatedAt: string | null
}

type Action =
  | { type: "boot"; payload: Partial<WorkflowState> | null }
  | { type: "patch"; patch: Partial<WorkflowState> }
  | { type: "selectNews"; id: string }
  | { type: "setProducts"; ids: string[]; clearCopies: boolean }

const initialState: WorkflowState = {
  step: 1,
  mode: "manual",
  engineId: "reserved-deepseek",
  newsList: createNews(),
  selectedNewsId: null,
  selectedProductIds: [],
  copies: [],
  activeCopyId: null,
  review: "idle",
  publish: "idle",
  publishedAt: null,
  publishId: null,
  engagement: { reposts: 0, comments: 0, likes: 0 },
  lastFetchLabel: "20:41:33",
  fetching: false,
  sources: { weibo: true, baidu: true },
  bannedWords: DEFAULT_BANNED_WORDS,
  generating: false,
  regeneratingId: null,
  autoPhase: null,
  hydrated: false,
  tone: "trend",
  length: "medium",
  emoji: "mid",
  includePrice: true,
  generatedAt: null,
}

function clearDownstream(): Pick<
  WorkflowState,
  "selectedProductIds" | "copies" | "activeCopyId" | "review" | "publish" | "publishedAt" | "publishId" | "engagement" | "generatedAt"
> {
  return {
    selectedProductIds: [],
    copies: [],
    activeCopyId: null,
    review: "idle",
    publish: "idle",
    publishedAt: null,
    publishId: null,
    engagement: { reposts: 0, comments: 0, likes: 0 },
    generatedAt: null,
  }
}

function reducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case "boot":
      return { ...state, ...action.payload, hydrated: true, fetching: false, generating: false, regeneratingId: null, autoPhase: null }
    case "patch":
      return { ...state, ...action.patch }
    case "selectNews":
      if (state.selectedNewsId === action.id) return { ...state, selectedNewsId: action.id }
      return { ...state, selectedNewsId: action.id, ...clearDownstream(), autoPhase: null }
    case "setProducts":
      return {
        ...state,
        selectedProductIds: action.ids,
        ...(action.clearCopies
          ? {
              copies: [],
              activeCopyId: null,
              review: "idle" as const,
              publish: state.publish === "sent" ? state.publish : ("idle" as const),
              generatedAt: null,
            }
          : {}),
      }
    default:
      return state
  }
}

function isStep(value: unknown): value is StepId {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function sanitize(raw: unknown): Partial<WorkflowState> | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as Partial<WorkflowState>
  const newsIds = new Set(createNews().map((item) => item.id))
  const productIds = new Set(PRODUCTS.map((item) => item.id))
  const newsList = Array.isArray(data.newsList)
    ? data.newsList.filter((item) => item && typeof item === "object" && newsIds.has((item as NewsItem).id))
    : []
  const next: Partial<WorkflowState> = {}
  if (isStep(data.step)) next.step = data.step
  if (data.mode === "manual" || data.mode === "auto") next.mode = data.mode
  if (data.engineId === "local-seed" || data.engineId === "local-news" || data.engineId === "reserved-deepseek" || data.engineId === "reserved-coze") {
    next.engineId = data.engineId
  }
  if (newsList.length === newsIds.size) next.newsList = newsList as NewsItem[]
  if (typeof data.selectedNewsId === "string" && newsIds.has(data.selectedNewsId)) next.selectedNewsId = data.selectedNewsId
  if (Array.isArray(data.selectedProductIds)) {
    next.selectedProductIds = data.selectedProductIds.filter((id): id is string => typeof id === "string" && productIds.has(id)).slice(0, 3)
  }
  if (Array.isArray(data.copies)) next.copies = data.copies.filter((item) => item && typeof item.text === "string").slice(0, 3) as CopyVariant[]
  if (typeof data.activeCopyId === "string") next.activeCopyId = data.activeCopyId
  if (data.review === "idle" || data.review === "passed" || data.review === "rejected") next.review = data.review
  if (data.publish === "idle" || data.publish === "sent") next.publish = data.publish
  if (typeof data.publishedAt === "string") next.publishedAt = data.publishedAt
  if (typeof data.publishId === "string") next.publishId = data.publishId
  if (data.engagement && typeof data.engagement === "object") next.engagement = data.engagement
  if (typeof data.lastFetchLabel === "string") next.lastFetchLabel = data.lastFetchLabel
  if (data.sources && typeof data.sources === "object") next.sources = data.sources
  if (Array.isArray(data.bannedWords)) next.bannedWords = data.bannedWords.filter((item) => typeof item === "string").slice(0, 40)
  if (data.tone === "seed" || data.tone === "trend" || data.tone === "urgent" || data.tone === "interactive") next.tone = data.tone
  if (data.length === "short" || data.length === "medium" || data.length === "long") next.length = data.length
  if (data.emoji === "low" || data.emoji === "mid" || data.emoji === "high") next.emoji = data.emoji
  if (typeof data.includePrice === "boolean") next.includePrice = data.includePrice
  if (typeof data.generatedAt === "string") next.generatedAt = data.generatedAt
  return next
}

interface WorkflowApi {
  state: WorkflowState
  visibleNews: NewsItem[]
  selectedNews: NewsItem | null
  selectedProducts: Product[]
  blockedCount: number
  setStep: (step: StepId) => void
  setMode: (mode: "manual" | "auto") => void
  setEngine: (engineId: EngineId) => void
  setTone: (tone: Tone) => void
  setLength: (length: CopyLength) => void
  setEmoji: (emoji: EmojiLevel) => void
  setIncludePrice: (value: boolean) => void
  selectNews: (id: string) => void
  toggleProduct: (id: string) => void
  moveProduct: (id: string, direction: -1 | 1) => void
  adoptTop: (count: number) => void
  refreshNews: () => Promise<void>
  generate: () => Promise<void>
  regenerateOne: (id: string) => Promise<void>
  updateCopy: (id: string, text: string) => void
  tweak: (id: string, kind: "shorter" | "less-emoji" | "more-cta" | "no-price") => void
  setActiveCopy: (id: string) => void
  passReview: (canPass: boolean) => void
  rejectReview: () => void
  publishPost: () => Promise<void>
  resetCampaign: () => void
  setSource: (source: "weibo" | "baidu", on: boolean) => void
  addBannedWord: (word: string) => void
  removeBannedWord: (word: string) => void
  openList: () => void
  openAdmin: () => void
  listOpen: boolean
  adminOpen: boolean
  setListOpen: (open: boolean) => void
  setAdminOpen: (open: boolean) => void
}

const WorkflowContext = createContext<WorkflowApi | null>(null)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  const runRef = useRef(0)
  const publishToken = useRef<string | null>(null)
  const busyRef = useRef({ fetch: false, generate: false })

  useEffect(() => {
    stateRef.current = state
  })
  const [listOpen, setListOpen] = useReducer((_: boolean, next: boolean) => next, false)
  const [adminOpen, setAdminOpen] = useReducer((_: boolean, next: boolean) => next, false)
  const ready = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const payload = raw ? sanitize(JSON.parse(raw)) : null
      dispatch({ type: "boot", payload })
    } catch {
      dispatch({ type: "boot", payload: null })
    }
    ready.current = true
  }, [])

  useEffect(() => {
    if (!ready.current || !state.hydrated) return
    const { fetching, generating, regeneratingId, autoPhase, hydrated, ...rest } = state
    void fetching
    void generating
    void regeneratingId
    void autoPhase
    void hydrated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  }, [state])

  const visibleNews = useMemo(
    () => state.newsList.filter((item) => state.sources[item.source]).sort((a, b) => b.heatScore - a.heatScore),
    [state.newsList, state.sources],
  )
  const selectedNews = state.newsList.find((item) => item.id === state.selectedNewsId) ?? null
  const selectedProducts = state.selectedProductIds.map((id) => getProduct(id)).filter((item) => item != null)

  function guardPublished() {
    if (stateRef.current.publish === "sent") {
      toast("本轮已经模拟发布", { description: "先点「开始新一轮」，再改热点或商品。" })
      return true
    }
    return false
  }

  function buildInput(snapshot: WorkflowState, productIds = snapshot.selectedProductIds) {
    const news = snapshot.newsList.find((item) => item.id === snapshot.selectedNewsId)
    const products = productIds.map((id) => getProduct(id)).filter((item) => item != null)
    if (!news || products.length === 0) return null
    const matches = matchProducts(news)
    const reasons = products.map((product) => matches.find((item) => item.product.id === product.id)?.reasons[0] ?? "")
    return {
      news,
      products,
      reasons,
      tone: snapshot.tone,
      length: snapshot.length,
      emoji: snapshot.emoji,
      includePrice: snapshot.includePrice,
      engineId: snapshot.engineId,
    }
  }

  async function runAuto(token: number, news: NewsItem) {
    const top = matchProducts(news).filter((item) => item.score >= 80).slice(0, 1)
    if (!top[0]) return
    dispatch({ type: "patch", patch: { autoPhase: 0, step: 2 } })
    await delay(420)
    if (runRef.current !== token) return
    dispatch({ type: "patch", patch: { autoPhase: 1 } })
    dispatch({ type: "setProducts", ids: [top[0].product.id], clearCopies: true })
    await delay(480)
    if (runRef.current !== token) return
    dispatch({ type: "patch", patch: { autoPhase: 2, step: 4, generating: true } })
    const snapshot = stateRef.current
    const input = buildInput({ ...snapshot, selectedNewsId: news.id, selectedProductIds: [top[0].product.id] })
    if (!input) {
      dispatch({ type: "patch", patch: { generating: false, autoPhase: null } })
      return
    }
    const copies = await generateCopies(input)
    if (runRef.current !== token) return
    dispatch({
      type: "patch",
      patch: {
        copies,
        activeCopyId: copies[0]?.id ?? null,
        generating: false,
        generatedAt: formatShanghaiDateTime(new Date()),
        autoPhase: 3,
        review: "idle",
      },
    })
    await delay(360)
    if (runRef.current !== token) return
    dispatch({ type: "patch", patch: { step: 5, autoPhase: null } })
    toast.success("自动模式已排好本轮", { description: "文案已生成。发布前仍需要人工审核。" })
  }

  const api = useMemo<WorkflowApi>(() => {
    return {
      state,
      visibleNews,
      selectedNews,
      selectedProducts,
      blockedCount: visibleNews.filter((item) => item.risk === "blocked").length,
      listOpen,
      adminOpen,
      setListOpen,
      setAdminOpen,
      openList: () => setListOpen(true),
      openAdmin: () => setAdminOpen(true),
      setStep: (step) => dispatch({ type: "patch", patch: { step } }),
      setMode: (mode) => {
        dispatch({ type: "patch", patch: { mode, autoPhase: null } })
        toast(mode === "auto" ? "已切换到自动模式" : "已切换到手工模式", {
          description: mode === "auto" ? "选定可借势热点后，会自动采纳商品并生成文案。" : "每一步由你确认。",
        })
      },
      setEngine: (engineId) => {
        dispatch({ type: "patch", patch: { engineId } })
        const meta = engineMeta(engineId)
        if (!meta.connected) {
          toast("该引擎尚未接入", { description: "生成时会回退到本地演示引擎，不会发起外部请求。" })
        }
      },
      setTone: (tone) => dispatch({ type: "patch", patch: { tone } }),
      setLength: (length) => dispatch({ type: "patch", patch: { length } }),
      setEmoji: (emoji) => dispatch({ type: "patch", patch: { emoji } }),
      setIncludePrice: (includePrice) => dispatch({ type: "patch", patch: { includePrice } }),
      selectNews: (id) => {
        if (guardPublished()) return
        const snapshot = stateRef.current
        const switching = snapshot.selectedNewsId && snapshot.selectedNewsId !== id
        const hadWork = snapshot.selectedProductIds.length > 0 || snapshot.copies.length > 0
        runRef.current += 1
        const token = runRef.current
        dispatch({ type: "selectNews", id })
        const news = snapshot.newsList.find((item) => item.id === id)
        if (switching && hadWork) {
          toast("已切换热点", { description: "商品绑定和文案已按新热点清空。" })
        }
        if (!news) return
        if (snapshot.mode === "auto" && news.risk === "blocked") {
          toast.warning("这条热点禁止借势", { description: news.riskNote })
          return
        }
        if (snapshot.mode === "auto") void runAuto(token, news)
      },
      toggleProduct: (id) => {
        if (guardPublished()) return
        const snapshot = stateRef.current
        const news = snapshot.newsList.find((item) => item.id === snapshot.selectedNewsId)
        if (!news) {
          toast("先在新闻抓取里选定热点")
          return
        }
        if (news.risk === "blocked") {
          toast.warning("当前热点禁止绑定商品")
          return
        }
        const exists = snapshot.selectedProductIds.includes(id)
        if (!exists && snapshot.selectedProductIds.length >= 3) {
          toast("一轮最多绑定 3 个商品", { description: "微博里一次讲太多，读不完。" })
          return
        }
        const ids = exists ? snapshot.selectedProductIds.filter((item) => item !== id) : [...snapshot.selectedProductIds, id]
        const clearCopies = snapshot.copies.length > 0
        dispatch({ type: "setProducts", ids, clearCopies })
        if (clearCopies) toast("商品变了", { description: "请重新生成文案，审核状态已重置。" })
      },
      moveProduct: (id, direction) => {
        if (guardPublished()) return
        const ids = [...stateRef.current.selectedProductIds]
        const index = ids.indexOf(id)
        const target = index + direction
        if (index < 0 || target < 0 || target >= ids.length) return
        const [item] = ids.splice(index, 1)
        ids.splice(target, 0, item)
        const clearCopies = stateRef.current.copies.length > 0
        dispatch({ type: "setProducts", ids, clearCopies })
        if (clearCopies) toast("主推商品已调整", { description: "请重新生成文案。" })
      },
      adoptTop: (count) => {
        if (guardPublished()) return
        const news = stateRef.current.newsList.find((item) => item.id === stateRef.current.selectedNewsId)
        if (!news || news.risk === "blocked") return
        const ids = matchProducts(news).slice(0, count).map((item) => item.product.id)
        const clearCopies = stateRef.current.copies.length > 0
        dispatch({ type: "setProducts", ids, clearCopies })
        if (clearCopies) toast("已重新采纳建议商品", { description: "请重新生成文案。" })
      },
      refreshNews: async () => {
        if (busyRef.current.fetch) return
        busyRef.current.fetch = true
        dispatch({ type: "patch", patch: { fetching: true } })
        await delay(1100)
        const sources = stateRef.current.sources
        const next = createNews()
          .filter((item) => sources[item.source])
          .map((item) => ({
            ...item,
            heatScore: Math.max(60, Math.min(99, item.heatScore + Math.floor(Math.random() * 3) - 1)),
            minutesAgo: 0,
          }))
        const hidden = createNews().filter((item) => !sources[item.source])
        const newsList = [...next, ...hidden].sort((a, b) => b.heatScore - a.heatScore)
        dispatch({
          type: "patch",
          patch: { newsList, fetching: false, lastFetchLabel: formatShanghaiTime(new Date()) },
        })
        toast.success("热点已刷新", { description: "已同步微博热搜与百度热榜的样本热度。数据仍是演示样本。" })
        busyRef.current.fetch = false
      },
      generate: async () => {
        if (busyRef.current.generate) return
        const snapshot = stateRef.current
        const input = buildInput(snapshot)
        if (!input || snapshot.generating) return
        if (input.news.risk === "blocked") {
          toast.warning("这条热点不能生成营销文案")
          return
        }
        busyRef.current.generate = true
        dispatch({ type: "patch", patch: { generating: true, step: 4 } })
        try {
          const copies = await generateCopies(input)
          dispatch({
            type: "patch",
            patch: {
              generating: false,
              copies,
              activeCopyId: copies[0]?.id ?? null,
              review: "idle",
              publish: "idle",
              publishedAt: null,
              publishId: null,
              generatedAt: formatShanghaiDateTime(new Date()),
            },
          })
        } finally {
          busyRef.current.generate = false
        }
      },
      regenerateOne: async (id) => {
        const snapshot = stateRef.current
        const current = snapshot.copies.find((item) => item.id === id)
        const input = buildInput(snapshot)
        if (!current || !input) return
        const index = snapshot.copies.findIndex((item) => item.id === id)
        dispatch({ type: "patch", patch: { regeneratingId: id } })
        await delay(1500)
        const fresh = composeVariant(input, current.tone, index)
        fresh.id = `${fresh.id}-r${Date.now()}`
        const copies = stateRef.current.copies.map((item) => (item.id === id ? fresh : item))
        dispatch({
          type: "patch",
          patch: {
            regeneratingId: null,
            copies,
            activeCopyId: snapshot.activeCopyId === id ? fresh.id : snapshot.activeCopyId,
            review: "idle",
            publish: "idle",
          },
        })
      },
      updateCopy: (id, text) => {
        const copies = stateRef.current.copies.map((item) => (item.id === id ? { ...item, text } : item))
        dispatch({ type: "patch", patch: { copies, review: "idle", publish: stateRef.current.publish === "sent" ? "sent" : "idle" } })
      },
      tweak: (id, kind) => {
        const copies = stateRef.current.copies.map((item) => (item.id === id ? { ...item, text: tweakCopy(item.text, kind) } : item))
        dispatch({ type: "patch", patch: { copies, review: "idle" } })
        toast.success("已微调当前版本")
      },
      setActiveCopy: (id) => dispatch({ type: "patch", patch: { activeCopyId: id, review: "idle" } }),
      passReview: (canPass) => {
        if (!canPass) {
          toast.error("还有未通过的审核项", { description: "先处理标红的问题，再标记通过。" })
          return
        }
        dispatch({ type: "patch", patch: { review: "passed" } })
        toast.success("文案已通过审核")
      },
      rejectReview: () => {
        dispatch({ type: "patch", patch: { review: "rejected", step: 4 } })
        toast("已退回修改", { description: "回到创作文案调整后再送审。" })
      },
      publishPost: async () => {
        const snapshot = stateRef.current
        if (snapshot.review !== "passed" || snapshot.publish === "sending" || snapshot.publish === "sent") return
        dispatch({ type: "patch", patch: { publish: "sending" } })
        await delay(900)
        const id = `sim_${Date.now().toString().slice(-8)}`
        publishToken.current = id
        dispatch({
          type: "patch",
          patch: {
            publish: "sent",
            publishedAt: formatShanghaiDateTime(new Date()),
            publishId: id,
            engagement: { reposts: 0, comments: 0, likes: 0 },
          },
        })
        toast.success("已模拟发布", { description: "没有调用微博接口。互动数只在本机演示。" })
        const frames: Engagement[] = [
          { reposts: 8, comments: 3, likes: 21 },
          { reposts: 26, comments: 11, likes: 84 },
          { reposts: 57, comments: 23, likes: 186 },
        ]
        for (const frame of frames) {
          await delay(420)
          if (publishToken.current !== id) return
          dispatch({ type: "patch", patch: { engagement: frame } })
        }
      },
      resetCampaign: () => {
        runRef.current += 1
        publishToken.current = null
        dispatch({
          type: "patch",
          patch: {
            step: 1,
            selectedNewsId: null,
            ...clearDownstream(),
            autoPhase: null,
          },
        })
        toast("已开始新一轮", { description: "热点、商品和文案都已清空。" })
      },
      setSource: (source, on) => {
        const sources = { ...stateRef.current.sources, [source]: on }
        if (!sources.weibo && !sources.baidu) {
          toast("至少保留一个热点源")
          return
        }
        dispatch({ type: "patch", patch: { sources } })
      },
      addBannedWord: (word) => {
        const next = word.trim()
        if (!next) return
        if (stateRef.current.bannedWords.includes(next)) return
        dispatch({ type: "patch", patch: { bannedWords: [...stateRef.current.bannedWords, next] } })
      },
      removeBannedWord: (word) => {
        dispatch({ type: "patch", patch: { bannedWords: stateRef.current.bannedWords.filter((item) => item !== word) } })
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, visibleNews, selectedNews, selectedProducts, listOpen, adminOpen])

  return <WorkflowContext.Provider value={api}>{children}</WorkflowContext.Provider>
}

export function useWorkflow() {
  const value = useContext(WorkflowContext)
  if (!value) throw new Error("useWorkflow must be used within WorkflowProvider")
  return value
}
