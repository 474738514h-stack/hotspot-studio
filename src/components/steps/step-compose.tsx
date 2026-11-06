"use client"

import { useEffect, useState } from "react"
import { CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
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
    <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-gutter:stable]">
      <h1 className="text-xl font-semibold tracking-tight">Step 4 · 创作文案</h1>
      <p className="mt-1 text-sm text-[#6b7080]">基于“热点 + 商品”组合，由 LLM 生成微博风格营销文案（多版本可微调）</p>

      <div className="mt-4 grid w-full items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#e6e8ee] bg-white p-4 lg:sticky lg:top-4">
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
            {state.copies.length ? "重新生成 3 个版本" : "生成文案"}
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

        <section>
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
            <div className="space-y-3">
              {state.copies.map((copy) => (
                <CopyCard key={copy.id} id={copy.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function CopyCard({ id }: { id: string }) {
  const { state, updateCopy, tweak, setActiveCopy, regenerateOne, setStep } = useWorkflow()
  const copy = state.copies.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)
  if (!copy) return null
  const active = state.activeCopyId === copy.id
  const busy = state.regeneratingId === copy.id

  return (
    <article className={cn("rounded-xl border bg-white p-4", active ? "border-[#6d4aff] ring-2 ring-[#6d4aff]/15" : "border-[#e6e8ee]")}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{copy.label} · {toneLabel(copy.tone)}</h2>
        {active && <span className="rounded-full bg-[#f3f0ff] px-2 py-0.5 text-[11px] text-[#6d4aff]">采用版本</span>}
        <span className="text-[11px] text-[#8b909c]">{copy.engineLabel}</span>
        <span className="ml-auto text-[11px] text-[#8b909c] tabular-nums">{copy.text.length} 字</span>
      </div>
      {busy ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#6b7080]">
          <Loader2Icon className="size-4 animate-spin text-[#6d4aff]" />
          正在重写这一版…
        </div>
      ) : editing ? (
        <Textarea value={copy.text} onChange={(event) => updateCopy(copy.id, event.target.value)} className="mt-3 min-h-48 font-sans text-sm leading-relaxed" />
      ) : (
        <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-[#1c1f2a]">{copy.text}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant={active ? "secondary" : "default"} onClick={() => setActiveCopy(copy.id)}>采用</Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void copyText(copy.text).then((ok) => {
              if (ok) toast.success("已复制微博文案")
              else toast.error("复制失败，请手动选择文本")
            })
          }}
        >
          <CopyIcon />
          复制
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>{editing ? "完成编辑" : "编辑"}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 items-center rounded-lg border border-[#e6e8ee] px-2.5 text-xs">微调</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => tweak(copy.id, "shorter")}>再短一点</DropdownMenuItem>
            <DropdownMenuItem onClick={() => tweak(copy.id, "less-emoji")}>少一点表情</DropdownMenuItem>
            <DropdownMenuItem onClick={() => tweak(copy.id, "more-cta")}>加强互动</DropdownMenuItem>
            <DropdownMenuItem onClick={() => tweak(copy.id, "no-price")}>去掉价格</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void regenerateOne(copy.id)}>
          <RefreshCwIcon />
          重写这一版
        </Button>
        {active && (
          <Button size="sm" className="ml-auto" variant="outline" onClick={() => setStep(5)}>去审核</Button>
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
