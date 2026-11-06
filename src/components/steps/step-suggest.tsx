"use client"

import { CheckIcon } from "lucide-react"
import { ProductArt } from "@/components/product-art"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/price"
import { matchProducts } from "@/lib/matching"
import { ADAPTIVE_GRID_PRODUCT, CARD_IDLE, CARD_SELECTED, CARD_SHADOW, CHROME_BUTTON } from "@/lib/steps"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

export function StepSuggest() {
  const { selectedNews, state, setStep, toggleProduct, adoptTop } = useWorkflow()

  if (!selectedNews) {
    return (
      <EmptyBlock
        title="还没有爆款热点"
        body="先在新闻抓取里点一条新闻。系统会按标签和场景给出商品建议。"
        action="去挑选热点"
        onAction={() => setStep(1)}
      />
    )
  }

  const ranked = matchProducts(selectedNews)
  const strong = ranked.filter((item) => item.score >= 68)
  const matches = strong.length >= 4 ? strong : ranked.slice(0, 8)
  const locked = selectedNews.risk === "blocked"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 [scrollbar-gutter:stable]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Step 2 · 建议匹配商品</h1>
          <p className="mt-1 text-sm text-[#6b7080]">系统基于热点语义与商品卖点自动推荐，点击卡片采纳或取消，可多选。</p>
        </div>
        <Button variant="outline" size="sm" className={CHROME_BUTTON} disabled={locked} onClick={() => adoptTop(3)}>
          一键采纳全部
        </Button>
      </div>
      {locked && <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">{selectedNews.riskNote} 下面的商品只作对照，不能采纳。</p>}
      {selectedNews.risk === "caution" && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{selectedNews.riskNote}</p>}

      <div className={cn("mt-4", ADAPTIVE_GRID_PRODUCT)}>
        {matches.map((match) => {
          const selected = state.selectedProductIds.includes(match.product.id)
          const tone = match.score >= 90 ? "bg-emerald-50 text-emerald-700" : match.score >= 75 ? "bg-amber-50 text-amber-700" : "bg-[#f4f5f7] text-[#6b7080]"
          return (
            <button
              key={match.product.id}
              type="button"
              disabled={locked}
              onClick={() => toggleProduct(match.product.id)}
              className={cn(
                "relative flex h-full flex-col rounded-xl p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed",
                selected ? CARD_SELECTED : cn(CARD_IDLE, CARD_SHADOW, "hover:shadow-md"),
              )}
            >
              {selected && (
                <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-[#6d4aff] text-white">
                  <CheckIcon className="size-3" />
                </span>
              )}
              <span className={cn("w-fit rounded-md px-1.5 py-0.5 text-[11px] font-medium", tone)}>匹配度 {match.score}%</span>
              <ProductArt id={match.product.id} className="mt-2 h-28 rounded-lg" />
              <h3 className="mt-3 text-sm font-semibold">{match.product.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {match.product.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-[#f4f5f7] px-1.5 py-0.5 text-[11px] text-[#6b7080]">{tag}</span>
                ))}
              </div>
              <div className="mt-auto pt-3">
                <p className="line-clamp-2 text-[12px] leading-relaxed text-[#6d4aff]">{match.reasons[0]}</p>
                <div className="mt-2 flex items-end justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <Price value={match.product.price} className="text-base" />
                    <Price value={match.product.originalPrice} strike className="text-xs text-[#c0c4cc]" />
                  </div>
                  <span className="text-[11px] text-[#9aa1ad]">{match.product.category}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e6e8ee] bg-[#f4f5f7] py-3">
        <div className="text-sm text-[#6b7080]">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#d5d8e0] bg-white px-2 py-1 text-[#1c1f2a]">
            已采纳 <span className="font-semibold text-[#6d4aff]">{state.selectedProductIds.length}</span> 件
          </span>
          <span> · 可到 Step 3 从完整商品库补充</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className={CHROME_BUTTON} onClick={() => setStep(3)}>去商品库深度筛选</Button>
          <Button disabled={locked || state.selectedProductIds.length === 0} onClick={() => setStep(4)}>下一步：创作文案</Button>
        </div>
      </div>
    </div>
  )
}

export function EmptyBlock({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className={cn("grid min-h-0 flex-1 place-items-center rounded-xl border border-dashed border-[#d9dce3] bg-white px-6", CARD_SHADOW)}>
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7080]">{body}</p>
        <Button className="mt-4" onClick={onAction}>{action}</Button>
      </div>
    </div>
  )
}
