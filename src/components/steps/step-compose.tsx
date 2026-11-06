"use client"

import { useEffect, useState } from "react"
import { ArrowRightIcon, CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ProductArt } from "@/components/product-art"
import { reviewCopy } from "@/lib/compliance"
import { copyText, formatPrice } from "@/lib/format"
import { toneLabel } from "@/lib/copy/engine"
import { ENGINE_OPTIONS } from "@/lib/steps"
import type { CopyLength, EmojiLevel } from "@/lib/types"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { EmptyBlock } from "@/components/steps/step-suggest"

const PHASES = ["读取热点语境", "对齐商品卖点", "起草微博语体", "合规预检"]

export function StepCompose() {
  const workflow = useWorkflow()
  const { state, selectedNews, selectedProducts, setStep } = workflow

  if (!selectedNews) {
    return <EmptyBlock title="还没有写作素材" body="选定一条热点，并至少绑定一件商品，才能生成微博文案。" action="去挑选热点" onAction={() => setStep(1)} />
  }
  if (selectedNews.risk === "blocked") {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <h1 className="text-lg font-semibold text-orange-800">这条热点不能生成营销文案</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-700">{selectedNews.riskNote}</p>
        <Button className="mt-4" variant="outline" onClick={() => setStep(1)}>换一条热点</Button>
      </div>
    )
  }
  if (selectedProducts.length === 0) {
    return <EmptyBlock title="还没有绑定商品" body="建议匹配或商品库里采纳至少一件商品。文案会同时用到热点和卖点。" action="去看建议商品" onAction={() => setStep(2)} />
  }

  return (
    <div className={cn("min-h-0 flex-1 [scrollbar-gutter:stable]", state.copies.length ? "flex flex-col overflow-hidden" : "overflow-y-auto pb-6")}>
      <h1 className="text-xl font-semibold tracking-tight">Step 4 · 创作文案</h1>
      <p className="mt-1 text-sm text-[#6b7080]">基于“热点 + 商品”组合，由 LLM 生成微博风格营销文案（多版本可微调）</p>

      <div className={cn("mt-4 grid w-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]", state.copies.length ? "min-h-0 flex-1 items-stretch" : "items-start")}>
        <aside className={cn("rounded-2xl border border-[#e6e8ee] bg-white p-4", state.copies.length ? "max-h-full overflow-y-auto" : "lg:sticky lg:top-4")}>
          <div className="text-[13px] font-medium text-[#1c1f2a]">
            创作素材 <span className="ml-1 text-[11px] font-semibold tracking-[0.08em] text-[#b0b5c0]">INGREDIENTS</span>
          </div>
          <div className="mt-3 rounded-xl bg-[#fbf4ee] px-3 py-3">
            <div className="text-[15px] font-semibold leading-snug text-[#1c1f2a]">{selectedNews.title}</div>
            <div className="mt-1 text-[13px] text-[#e11d48]">#{selectedNews.hashtag}#</div>
          </div>
          <ul className="mt-3 space-y-2">
            {selectedProducts.map((product) => (
              <li key={product.id} className="flex items-center gap-3 rounded-xl border border-[#e6e8ee] bg-white px-3 py-2.5">
                <ProductArt id={product.id} thumb />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#1c1f2a]">{product.name}</div>
                  <div className="mt-0.5 truncate text-[13px]">
                    <span className="font-medium text-[#e11d48]">{formatPrice(product.price)}</span>
                    <span className="text-[#8b909c]"> · {product.points[0]}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-[13px] font-medium text-[#1c1f2a]">
            主打语调 <span className="ml-1 text-[11px] font-semibold tracking-[0.08em] text-[#b0b5c0]">TONE</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["trend", "热点借势"],
                ["urgent", "促销导向"],
                ["interactive", "互动话题"],
              ] as const
            ).map(([value, label]) => {
              const active = (state.tone === "seed" ? "urgent" : state.tone) === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => workflow.setTone(value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm",
                    active ? "bg-[#6d4aff] font-medium text-white" : "border border-[#e6e8ee] bg-white text-[#1c1f2a]",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <Button className="mt-4 h-11 w-full rounded-xl text-base" disabled={state.generating} onClick={() => void workflow.generate()}>
            {state.generating ? <Loader2Icon className="animate-spin" /> : null}
            {state.copies.length ? "重新生成文案" : "生成文案"}
          </Button>
          <p className="mt-3 text-[12px] leading-relaxed text-[#6b7080]">
            当前模型:<span className="font-medium text-[#1c1f2a]">{ENGINE_OPTIONS.find((item) => item.id === state.engineId)?.short ?? "deepseek-chat"}</span>
            <span> · 服务端代理 </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-[#6d4aff]">切换</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {ENGINE_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.id} onClick={() => workflow.setEngine(option.id)}>
                    {option.short}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#9aa1ad]">
            提示词模板可在
            <button type="button" className="mx-0.5 text-[#6d4aff]" onClick={workflow.openAdmin}>后台管理</button>
            查看与修改。共 3 个版本风格并发生成。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#f0f1f4] pt-3">
            <span className="text-[11px] text-[#8b909c]">篇幅</span>
            <Segment value={state.length} options={[{ value: "short" as CopyLength, label: "短" }, { value: "medium" as CopyLength, label: "中" }, { value: "long" as CopyLength, label: "长" }]} onChange={workflow.setLength} />
            <span className="text-[11px] text-[#8b909c]">表情</span>
            <Segment value={state.emoji} options={[{ value: "low" as EmojiLevel, label: "克制" }, { value: "mid" as EmojiLevel, label: "标准" }, { value: "high" as EmojiLevel, label: "热闹" }]} onChange={workflow.setEmoji} />
            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-[#6b7080]">
              <input type="checkbox" checked={state.includePrice} onChange={(event) => workflow.setIncludePrice(event.target.checked)} className="size-3.5 accent-[#6d4aff]" />
              写入价格
            </label>
          </div>
        </aside>

        <section className={cn(state.copies.length && "flex min-h-0 flex-col")}>
          {state.generating ? (
            <GenerateLoader />
          ) : state.copies.length === 0 ? (
            <div className="grid min-h-[480px] place-items-center rounded-xl border border-dashed border-[#d9dce3] bg-white">
              <div className="max-w-sm text-center">
                <div className="text-sm font-medium">待生成</div>
                <p className="mt-2 text-sm leading-relaxed text-[#6b7080]">左侧确认「热点 + 商品」组合与文案语调，点击「生成文案」即可产出 3 个版本的微博营销文案。</p>
              </div>
            </div>
          ) : (
            <VersionBoard />
          )}
        </section>
      </div>
    </div>
  )
}

const TONE_TAB: Record<string, string> = {
  trend: "热点借势",
  urgent: "促销导向",
  interactive: "互动话题",
  seed: "种草安利",
}

const LENGTH_BAND: Record<CopyLength, [number, number]> = {
  short: [80, 140],
  medium: [140, 220],
  long: [200, 360],
}

function VersionBoard() {
  const { state, selectedNews, selectedProducts, updateCopy, tweak, setActiveCopy, regenerateOne, setStep } = useWorkflow()
  const [editing, setEditing] = useState(false)
  const copy = state.copies.find((item) => item.id === state.activeCopyId) ?? state.copies[0]
  if (!copy) return null
  const busy = state.regeneratingId === copy.id
  const plain = copy.text.replace(/\s/g, "")
  const [min, max] = LENGTH_BAND[state.length]
  const report = reviewCopy({
    news: selectedNews,
    products: selectedProducts,
    text: copy.text,
    bannedWords: state.bannedWords,
  })
  const issues = [
    ...(plain.length < min || plain.length > max
      ? [`字数 ${min}-${max} 实际 ${plain.length} 字（不含空白），要求 ${min}-${max}`]
      : []),
    ...report.checks.filter((item) => item.status !== "pass").map((item) => `${item.label}：${item.detail}`),
  ]
  const penalty = (plain.length < min || plain.length > max ? 7 : 0) + report.checks.filter((item) => item.status === "warn").length * 3.5 + report.checks.filter((item) => item.status === "fail").length * 12
  const score = Math.max(60, Math.round((100 - penalty) * 10) / 10)
  const engine = ENGINE_OPTIONS.find((item) => item.id === state.engineId)?.short ?? copy.engineLabel
  const outTokens = Math.max(1, Math.round(plain.length / 1.6))
  const inTokens = 480 + (selectedNews?.summary.length ?? 0) + selectedProducts.reduce((sum, product) => sum + product.name.length + product.points.join("").length, 0)
  const seconds = ((state.generateMs ?? 1500) / 1000).toFixed(1)

  function fix() {
    if (plain.length > max) tweak(copy.id, "shorter")
    else if (!/评论|扣|？|\?/.test(copy.text)) tweak(copy.id, "more-cta")
    else if (report.checks.some((item) => item.id === "price" && item.status !== "pass")) tweak(copy.id, "no-price")
    else tweak(copy.id, "less-emoji")
  }

  return (
    <article className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-[#e6e8ee] bg-white">
      <div className="flex gap-1 overflow-x-auto border-b border-[#eef0f3] px-3 pt-2">
        {state.copies.map((item) => {
          const active = item.id === copy.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveCopy(item.id)
                setEditing(false)
              }}
              className={cn(
                "shrink-0 rounded-t-lg px-3 py-2 text-sm",
                active ? "bg-[#f3f0ff] font-medium text-[#6d4aff]" : "text-[#8b909c] hover:text-[#1c1f2a]",
              )}
            >
              {item.label} · {TONE_TAB[item.tone] ?? toneLabel(item.tone)}
            </button>
          )
        })}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        {busy ? (
          <div className="flex min-h-48 flex-1 items-center gap-2 rounded-xl bg-[#f5f6fa] px-4 text-sm text-[#6b7080]">
            <Loader2Icon className="size-4 animate-spin text-[#6d4aff]" />
            正在重写这一版…
          </div>
        ) : editing ? (
          <Textarea value={copy.text} onChange={(event) => updateCopy(copy.id, event.target.value)} className="min-h-0 flex-1 font-sans text-sm leading-7" />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-[#f5f6fa] px-4 py-4">
            <p className="text-sm leading-8 whitespace-pre-wrap text-[#1c1f2a]">{copy.text}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-[#8eb4f5] bg-white text-[#3b6fd8]"
            onClick={() => {
              void copyText(copy.text).then((ok) => {
                if (ok) toast.success("已复制微博文案")
                else toast.error("复制失败，请手动选择文本")
              })
            }}
          >
            <CopyIcon />
            一键复制
          </Button>
          <Button size="sm" variant="outline" className="border-[#d5d8e0] bg-white text-[#1c1f2a]" disabled={busy} onClick={() => void regenerateOne(copy.id)}>
            <RefreshCwIcon />
            重新生成
          </Button>
          <Button size="sm" className="bg-[#22a35a] text-white hover:bg-[#1b8a4b]" onClick={() => { setActiveCopy(copy.id); setStep(5) }}>
            采用此版本，去审核
            <ArrowRightIcon />
          </Button>
          <span className="ml-auto text-[12px] text-[#8b909c] tabular-nums">
            共 {plain.length} 字 · {engine} · 服务端代理 · {seconds}s · ↑{inTokens} ↓{outTokens} tokens
          </span>
          <button type="button" className="text-xs text-[#6d4aff]" onClick={() => setEditing((value) => !value)}>
            {editing ? "完成" : "编辑"}
          </button>
        </div>
        {issues.length > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#fff6ee] px-3 py-2.5 text-[13px] text-[#c2410c]">
            <div className="min-w-0">
              <div className="font-medium">有 {issues.length} 项待优化 · 规则分 {score}</div>
              <div className="mt-0.5 truncate text-[12px] text-[#d97706]">
                {plain.length < min || plain.length > max
                  ? `字数 ${min}-${max}:实际 ${plain.length} 字(不含空白),要求 ${min}-${max}`
                  : issues[0]}
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 border-[#e6e8ee] bg-white text-[#1c1f2a]" onClick={fix}>
              一键修正
            </Button>
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-[#f3fbf6] px-3 py-2.5 text-[13px] text-[#15803d]">规则分 {score} · 篇幅和合规都在范围内</div>
        )}
      </div>
    </article>
  )
}

function GenerateLoader() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - started
      setPhase(elapsed < 380 ? 0 : elapsed < 760 ? 1 : elapsed < 1140 ? 2 : 3)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-xl border border-[#e6e8ee] bg-white p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2Icon className="size-4 animate-spin text-[#6d4aff]" />
        正在生成微博文案
      </div>
      <ol className="mt-4 space-y-2">
        {PHASES.map((item, index) => (
          <li key={item} className={cn("flex items-center gap-2 text-sm", index <= phase ? "text-[#1c1f2a]" : "text-[#c0c4cc]")}>
            <span className={cn("size-1.5 rounded-full", index < phase ? "bg-emerald-500" : index === phase ? "bg-[#6d4aff]" : "bg-[#e6e8ee]")} />
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Segment<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn("rounded-md px-2 py-1 text-xs", value === option.value ? "bg-[#6d4aff] text-white" : "bg-[#f4f5f7] text-[#4b5160]")}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
