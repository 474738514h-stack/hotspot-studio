"use client"

import { CheckIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatHeatIndex, formatReposts } from "@/lib/format"
import { sourceLabel } from "@/lib/news"
import { ADAPTIVE_GRID } from "@/lib/steps"
import type { NewsItem } from "@/lib/types"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

function metaLine(news: NewsItem) {
  const source = sourceLabel(news.source)
  if (news.reposts) return `${source} · ${formatReposts(news.reposts)} 转发`
  return `${source} · ${news.minutesAgo} 分钟前`
}

export function StepNews() {
  const { state, visibleNews, blockedCount, selectNews, setStep, refreshNews } = useWorkflow()
  const weiboCount = visibleNews.filter((item) => item.source === "weibo").length
  const baiduCount = visibleNews.filter((item) => item.source === "baidu").length
  const selected = visibleNews.find((item) => item.id === state.selectedNewsId)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1c1f2a]">Step 1 · 新闻抓取</h1>
          <p className="mt-1 text-sm text-[#6b7080]">实时监控全网热点新闻，点击卡片将其选为本轮营销的「爆款热点」。</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#e6e8ee] bg-white px-3 py-2.5 text-xs text-[#4b5160]">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          实时抓取
        </span>
        <span className={cn("inline-flex items-center gap-1", state.sources.weibo ? "text-[#1c1f2a]" : "text-[#c0c4cc] line-through")}>
          微博热搜 <span className="text-emerald-600">✓ {weiboCount}</span>
        </span>
        <span className={cn("inline-flex items-center gap-1", state.sources.baidu ? "text-[#1c1f2a]" : "text-[#c0c4cc] line-through")}>
          百度热搜 <span className="text-emerald-600">✓ {baiduCount}</span>
        </span>
        <span className="text-[#8b909c]">上次抓取 {state.lastFetchLabel}</span>
        <span className="text-[#8b909c]">入库 {visibleNews.length} 条</span>
        <span className="text-orange-600">{blockedCount} 条已标记禁止借势</span>
        <span className="rounded-full bg-[#f3f0ff] px-2 py-0.5 text-[11px] text-[#6d4aff]">样本数据</span>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => void refreshNews()} disabled={state.fetching}>
          <RefreshCwIcon className={cn(state.fetching && "animate-spin")} />
          {state.fetching ? "抓取中" : "立即抓取"}
        </Button>
      </div>

      <div className={cn("mt-4", ADAPTIVE_GRID, state.fetching && "opacity-70")}>
        {visibleNews.map((news) => {
          const selected = state.selectedNewsId === news.id
          return (
            <button
              key={news.id}
              type="button"
              onClick={() => selectNews(news.id)}
              className={cn(
                "relative flex h-full flex-col rounded-xl border bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(28,31,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md",
                selected ? "border-[#6d4aff] ring-2 ring-[#6d4aff]/15" : "border-[#e6e8ee]",
                news.risk === "blocked" && "border-l-[3px] border-l-orange-400",
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px]">
                {news.trend === "up" && <span className="font-semibold text-emerald-600">升</span>}
                {news.trend === "new" && <span className="rounded bg-emerald-50 px-1 font-semibold text-emerald-600">新</span>}
                <span className="font-medium text-sky-600">实时</span>
                <span className="truncate text-[#9aa1ad]">{metaLine(news)}</span>
                {selected && (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-medium text-[#6d4aff]">
                    <CheckIcon className="size-3" />
                    已选为爆款热点
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-[15px] leading-snug font-semibold text-[#1c1f2a]">{news.title}</h2>
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6b7080]">{news.summary}</p>
              {news.heatIndex ? (
                <p className="mt-1 text-[11px] text-[#9aa1ad]">实时热度 {formatHeatIndex(news.heatIndex)}</p>
              ) : null}
              {news.risk !== "clear" && news.riskNote && (
                <div className={cn("mt-2 rounded-md px-2 py-1.5 text-[11px] leading-relaxed", news.risk === "blocked" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700")}>
                  {news.risk === "blocked" ? "禁止借势" : "需人工判断"}：{news.riskNote}
                </div>
              )}
              <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#9aa1ad]">热度</span>
                  <span className="relative h-1 w-12 overflow-hidden rounded-full bg-[#e6e8ee]">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-orange-400" style={{ width: `${news.heatScore}%` }} />
                  </span>
                  <span className="text-lg leading-none font-semibold text-orange-500 tabular-nums">{news.heatScore}</span>
                </div>
                <span className="truncate text-[11px] text-[#6d4aff]">#{news.hashtag}#</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-0 z-10 mt-4 flex w-full items-center justify-between gap-3 bg-[#f4f5f7]/95 py-3">
        <span className="min-w-0 truncate text-sm text-[#6b7080]">
          {selected ? `已选：${selected.title}` : "选择一条热点后可进入下一步"}
        </span>
        <Button disabled={!selected} onClick={() => setStep(2)}>
          下一步：建议匹配商品
        </Button>
      </div>
    </div>
  )
}
