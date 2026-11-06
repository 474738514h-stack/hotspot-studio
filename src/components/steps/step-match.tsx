"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { ProductArt } from "@/components/product-art"
import { ScoreRing } from "@/components/score-ring"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ADAPTIVE_GRID_PRODUCT } from "@/lib/steps"
import { formatPrice, formatSales } from "@/lib/format"
import { matchProducts } from "@/lib/matching"
import { PRODUCTS } from "@/lib/products"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { EmptyBlock } from "@/components/steps/step-suggest"

type SortKey = "match" | "sales" | "price-asc" | "price-desc"

export function StepMatch() {
  const { selectedNews, state, setStep, toggleProduct, moveProduct, selectedProducts } = useWorkflow()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("全部")
  const [band, setBand] = useState("全部")
  const [sort, setSort] = useState<SortKey>("match")

  const categories = useMemo(() => ["全部", ...Array.from(new Set(PRODUCTS.map((item) => item.category)))], [])
  const scoreMap = useMemo(() => {
    if (!selectedNews) return new Map<string, { score: number; reason: string; risk?: string }>()
    return new Map(matchProducts(selectedNews).map((item) => [item.product.id, { score: item.score, reason: item.reasons[0], risk: item.risks[0] }]))
  }, [selectedNews])

  if (!selectedNews) {
    return <EmptyBlock title="还没有可匹配的热点" body="商品库可以浏览，但匹配度要等你选定新闻之后才会出现。" action="返回新闻抓取" onAction={() => setStep(1)} />
  }

  const locked = selectedNews.risk === "blocked"
  const filtered = PRODUCTS.filter((product) => {
    if (category !== "全部" && product.category !== category) return false
    if (band === "50 以下" && product.price >= 50) return false
    if (band === "50-200" && (product.price < 50 || product.price > 200)) return false
    if (band === "200 以上" && product.price <= 200) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [product.name, product.brand, product.shop, product.category, ...product.tags, ...product.points].join(" ").toLowerCase().includes(q)
  }).sort((a, b) => {
    if (sort === "sales") return b.sales - a.sales
    if (sort === "price-asc") return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    return (scoreMap.get(b.id)?.score ?? 0) - (scoreMap.get(a.id)?.score ?? 0)
  })

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Step 3 · 匹配商品</h1>
      <p className="mt-1 text-sm text-[#6b7080]">在商品库里搜索、筛选，手动绑定最多 3 件。排在第一位的是主推。</p>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#e6e8ee] bg-white p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#9aa1ad]" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品、品牌、卖点" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => (
            <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {["全部", "50 以下", "50-200", "200 以上"].map((item) => (
            <FilterChip key={item} active={band === item} onClick={() => setBand(item)}>{item}</FilterChip>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-[#e6e8ee] sm:block" />
          {(
            [
              ["match", "匹配度"],
              ["sales", "月销"],
              ["price-asc", "价格从低到高"],
              ["price-desc", "价格从高到低"],
            ] as const
          ).map(([key, label]) => (
            <FilterChip key={key} active={sort === key} onClick={() => setSort(key)}>{label}</FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-[#8b909c]">{filtered.length} 件商品 · 样本商品库</div>
      <div className={cn("mt-3", ADAPTIVE_GRID_PRODUCT)}>
        {filtered.map((product) => {
          const selected = state.selectedProductIds.includes(product.id)
          const meta = scoreMap.get(product.id)
          return (
            <article key={product.id} className={cn("flex flex-col overflow-hidden rounded-xl border bg-white", selected ? "border-[#6d4aff] ring-2 ring-[#6d4aff]/15" : "border-[#e6e8ee]")}>
              <ProductArt id={product.id} className="h-36" />
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-[#8b909c]">{product.category} · {product.brand}</div>
                    <h3 className="text-sm font-semibold leading-snug">{product.name}</h3>
                  </div>
                  {meta && <ScoreRing score={meta.score} size={40} />}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-semibold">{formatPrice(product.price)}</span>
                  <span className="text-xs text-[#b0b5c0] line-through">{formatPrice(product.originalPrice)}</span>
                </div>
                <div className="mt-1 text-[11px] text-[#8b909c]">月销 {formatSales(product.sales)} · {product.rating} 分</div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#4b5160]">{meta?.reason}</p>
                {meta?.risk && <p className="mt-1 text-[11px] text-amber-700">{meta.risk}</p>}
                <Button className="mt-3" size="sm" variant={selected ? "secondary" : "outline"} disabled={locked} onClick={() => toggleProduct(product.id)}>
                  {selected ? "已绑定" : "绑定到本轮"}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="sticky bottom-0 z-10 mt-4 w-full rounded-none bg-[#f4f5f7]/95 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {selectedProducts.length === 0 && <span className="text-sm text-[#6b7080]">还没有绑定商品</span>}
          {selectedProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-1 rounded-full bg-[#f6f3ff] py-1 pr-1 pl-2 text-xs text-[#4c3aa8]">
              <span>{index === 0 ? "主推" : `搭配${index}`} · {product.name}</span>
              <button type="button" className="rounded-full px-1 hover:bg-white" onClick={() => moveProduct(product.id, -1)} aria-label="上移">↑</button>
              <button type="button" className="rounded-full px-1 hover:bg-white" onClick={() => moveProduct(product.id, 1)} aria-label="下移">↓</button>
              <button type="button" className="rounded-full px-1 hover:bg-white" onClick={() => toggleProduct(product.id)} aria-label="移除">×</button>
            </div>
          ))}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>返回建议</Button>
            <Button disabled={locked || selectedProducts.length === 0} onClick={() => setStep(4)}>去写文案</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full px-2.5 py-1 text-xs", active ? "bg-[#6d4aff] text-white" : "bg-[#f4f5f7] text-[#4b5160]")}
    >
      {children}
    </button>
  )
}
