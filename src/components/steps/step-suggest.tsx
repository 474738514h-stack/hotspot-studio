"use client"

import { ProductArt } from "@/components/product-art"
import { ScoreRing } from "@/components/score-ring"
import { Button } from "@/components/ui/button"
import { formatPrice, formatSales } from "@/lib/format"
import { topMatches } from "@/lib/matching"
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

  const ranked = topMatches(selectedNews, 12)
  const strong = ranked.filter((item) => item.score >= 70)
  const matches = (strong.length > 0 ? strong : ranked).slice(0, 6)
  const locked = selectedNews.risk === "blocked"

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Step 2 · 建议匹配商品</h1>
      <p className="mt-1 text-sm text-[#6b7080]">系统按热点语义给出商品建议。采纳后进入商品库精修，或直接去写文案。</p>

      <div className={cn("mt-4 rounded-xl border bg-white p-4", locked ? "border-orange-200" : "border-[#e6e8ee]")}>
        <div className="text-[11px] text-[#8b909c]">当前热点</div>
        <div className="mt-1 text-base font-semibold">{selectedNews.title}</div>
        <p className="mt-1 text-sm leading-relaxed text-[#6b7080]">{selectedNews.summary}</p>
        {locked && <p className="mt-2 text-sm text-orange-700">{selectedNews.riskNote} 下面的商品只作对照，不能采纳。</p>}
        {selectedNews.risk === "caution" && <p className="mt-2 text-sm text-amber-700">{selectedNews.riskNote}</p>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">系统建议 · 按匹配度</h2>
        <Button variant="outline" size="sm" disabled={locked} onClick={() => adoptTop(2)}>
          采纳前两名
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {matches.map((match) => {
          const selected = state.selectedProductIds.includes(match.product.id)
          return (
            <article key={match.product.id} className={cn("flex gap-3 rounded-xl border bg-white p-3", selected ? "border-[#6d4aff] ring-2 ring-[#6d4aff]/15" : "border-[#e6e8ee]")}>
              <ProductArt id={match.product.id} className="size-28 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-[#8b909c]">{match.product.brand} · {match.product.shop}</div>
                    <h3 className="text-sm font-semibold">{match.product.name}</h3>
                  </div>
                  <ScoreRing score={match.score} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-base font-semibold text-[#1c1f2a]">{formatPrice(match.product.price)}</span>
                  <span className="text-xs text-[#b0b5c0] line-through">{formatPrice(match.product.originalPrice)}</span>
                  <span className="text-[11px] text-[#8b909c]">月销 {formatSales(match.product.sales)}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#4b5160]">{match.reasons[0]}</p>
                {match.risks[0] && <p className="mt-1 text-[11px] text-amber-700">{match.risks[0]}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {match.product.points.slice(0, 2).map((point) => (
                    <span key={point} className="rounded-full bg-[#f6f7f9] px-2 py-0.5 text-[11px] text-[#4b5160]">{point}</span>
                  ))}
                </div>
                <div className="mt-3">
                  <Button size="sm" variant={selected ? "secondary" : "default"} disabled={locked} onClick={() => toggleProduct(match.product.id)}>
                    {selected ? "已采纳" : "采纳"}
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="sticky bottom-3 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6e8ee] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="text-sm text-[#4b5160]">已采纳 {state.selectedProductIds.length} 件</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(3)}>去商品库精修</Button>
          <Button disabled={locked || state.selectedProductIds.length === 0} onClick={() => setStep(4)}>去写文案</Button>
        </div>
      </div>
    </div>
  )
}

export function EmptyBlock({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-[#d9dce3] bg-white px-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7080]">{body}</p>
        <Button className="mt-4" onClick={onAction}>{action}</Button>
      </div>
    </div>
  )
}
