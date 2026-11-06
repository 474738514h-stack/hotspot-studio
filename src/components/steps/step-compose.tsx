"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CopyIcon, Loader2Icon, RefreshCwIcon, WandSparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { copyText } from "@/lib/format"
import { toneLabel } from "@/lib/copy/engine"
import type { CopyLength, EmojiLevel, Tone } from "@/lib/types"
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
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Step 4 · 创作文案</h1>
      <p className="mt-1 text-sm text-[#6b7080]">按热点和商品生成 3 个微博版本。生成大约 1.5 秒，结果是可编辑的纯文本。</p>

      <div className="mt-4 grid w-full items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-xl border border-[#e6e8ee] bg-white p-4 lg:sticky lg:top-4">
          <div>
            <div className="text-[11px] text-[#8b909c]">热点</div>
            <div className="mt-1 text-sm font-medium">{selectedNews.title}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#8b909c]">商品</div>
            <ul className="mt-1 space-y-1 text-sm">
              {selectedProducts.map((product, index) => (
                <li key={product.id}>{index === 0 ? "主推" : "搭配"} · {product.name}</li>
              ))}
            </ul>
          </div>
          <Field label="主打语调 TONE">
            <Segment
              value={state.tone === "seed" ? "urgent" : state.tone}
              options={[
                { value: "trend" as Tone, label: "热点借势" },
                { value: "urgent" as Tone, label: "促销导向" },
                { value: "interactive" as Tone, label: "互动话题" },
              ]}
              onChange={workflow.setTone}
            />
          </Field>
          <Field label="篇幅">
            <Segment
              value={state.length}
              options={[
                { value: "short" as CopyLength, label: "短" },
                { value: "medium" as CopyLength, label: "中" },
                { value: "long" as CopyLength, label: "长" },
              ]}
              onChange={workflow.setLength}
            />
          </Field>
          <Field label="表情">
            <Segment
              value={state.emoji}
              options={[
                { value: "low" as EmojiLevel, label: "克制" },
                { value: "mid" as EmojiLevel, label: "标准" },
                { value: "high" as EmojiLevel, label: "热闹" },
              ]}
              onChange={workflow.setEmoji}
            />
          </Field>
          <label className="flex items-center justify-between text-sm">
            <span>写入价格</span>
            <input
              type="checkbox"
              checked={state.includePrice}
              onChange={(event) => workflow.setIncludePrice(event.target.checked)}
              className="size-4 accent-[#6d4aff]"
            />
          </label>
          <Button className="w-full" disabled={state.generating} onClick={() => void workflow.generate()}>
            {state.generating ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
            {state.copies.length ? "重新生成 3 个版本" : "生成文案"}
          </Button>
          <p className="text-[11px] leading-relaxed text-[#8b909c]">当前为样本生成，不会调用外部大模型。语气、篇幅和商品会写进预留的模型请求。</p>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] text-[#8b909c]">{label}</div>
      {children}
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
