"use client"

import { useState } from "react"
import { BadgeCheckIcon, HeartIcon, MessageCircleIcon, Repeat2Icon, SendIcon } from "lucide-react"
import { ProductArt } from "@/components/product-art"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reviewCopy } from "@/lib/compliance"
import { copyText } from "@/lib/format"
import { OPERATOR, WEIBO_ACCOUNT } from "@/lib/steps"
import { useWorkflow } from "@/lib/workflow"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { EmptyBlock } from "@/components/steps/step-suggest"

export function StepReview() {
  const workflow = useWorkflow()
  const { state, selectedNews, selectedProducts, setStep } = workflow
  const [confirmOpen, setConfirmOpen] = useState(false)
  const active = state.copies.find((item) => item.id === state.activeCopyId) ?? state.copies[0]
  const report = reviewCopy({
    news: selectedNews,
    products: selectedProducts,
    text: active?.text ?? "",
    bannedWords: state.bannedWords,
  })
  const effectiveReview = state.review === "passed" && report.canPass ? "passed" : state.review === "rejected" ? "rejected" : "idle"

  if (!selectedNews || !active) {
    return (
      <EmptyBlock
        title="还没有待审文案"
        body="完成热点、商品和文案生成后，在这里看微博卡片、做合规审核，再模拟发布。"
        action={selectedNews ? "去创作文案" : "去挑选热点"}
        onAction={() => setStep(selectedNews ? 4 : 1)}
      />
    )
  }

  const statusLabel = state.publish === "sent" ? "已模拟发布" : effectiveReview === "passed" ? "已通过" : effectiveReview === "rejected" ? "已退回" : "未审核"

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-gutter:stable]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Step 5 · 审核并发送</h1>
          <p className="mt-1 text-sm text-[#6b7080]">最终微博效果预览，合规审核通过后可以一键发送。发送只改变本机演示状态。</p>
        </div>
        <span className={cn("shrink-0 text-sm font-medium", state.publish === "sent" ? "text-emerald-600" : effectiveReview === "passed" ? "text-[#6d4aff]" : "text-orange-500")}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-2xl border border-[#e6e8ee] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-[#8b909c]">微博卡片预览</div>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", state.publish === "sent" ? "bg-emerald-50 text-emerald-700" : effectiveReview === "passed" ? "bg-[#f3f0ff] text-[#6d4aff]" : "bg-[#f4f5f7] text-[#6b7080]")}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#ff8140] text-sm font-semibold text-white">热</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-semibold">
                {WEIBO_ACCOUNT.name}
                <BadgeCheckIcon className="size-4 text-sky-500" />
              </div>
              <div className="text-[11px] text-[#8b909c]">
                {state.publish === "sent" ? state.publishedAt : "刚刚"} · {WEIBO_ACCOUNT.verified} · 粉丝 {WEIBO_ACCOUNT.fans}
              </div>
              <p className="mt-2 text-sm leading-7 whitespace-pre-wrap">{active.text}</p>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex w-36 shrink-0 items-center gap-2 rounded-lg border border-[#eef0f3] p-1.5">
                    <ProductArt id={product.id} className="size-10 rounded-md" />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium">{product.name}</div>
                      <div className="text-[11px] text-[#f97316]">¥{product.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-5 text-xs text-[#6b7080]">
                <span className="inline-flex items-center gap-1"><Repeat2Icon className="size-3.5" /> {state.engagement.reposts}</span>
                <span className="inline-flex items-center gap-1"><MessageCircleIcon className="size-3.5" /> {state.engagement.comments}</span>
                <span className="inline-flex items-center gap-1"><HeartIcon className="size-3.5" /> {state.engagement.likes}</span>
              </div>
            </div>
          </div>
          {state.publish === "sent" && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              已模拟发布 · {state.publishedAt} · {OPERATOR.name} · 回执 {state.publishId}。未调用微博开放平台。
            </div>
          )}
        </article>

        <section className="rounded-2xl border border-[#e6e8ee] bg-white p-4">
          <h2 className="text-sm font-semibold">合规审核</h2>
          <p className="mt-1 text-xs text-[#8b909c]">标红项会拦住通过。标黄项可以带着人工判断通过。</p>
          <ul className="mt-3 space-y-2">
            {report.checks.map((check) => (
              <li key={check.id} className="rounded-xl border border-[#eef0f3] px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn("size-1.5 rounded-full", check.status === "pass" ? "bg-emerald-500" : check.status === "warn" ? "bg-amber-500" : "bg-rose-500")} />
                  <span className="font-medium">{check.label}</span>
                  <span className={cn("ml-auto text-[11px]", check.status === "pass" ? "text-emerald-600" : check.status === "warn" ? "text-amber-700" : "text-rose-600")}>
                    {check.status === "pass" ? "通过" : check.status === "warn" ? "留意" : "拦截"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6b7080]">{check.detail}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(4)}>返回修改</Button>
            <Button
              variant="outline"
              onClick={() => {
                void copyText(active.text).then((ok) => (ok ? toast.success("已复制微博文案") : toast.error("复制失败")))
              }}
            >
              复制文案
            </Button>
            <Button variant="secondary" disabled={state.publish === "sent"} onClick={() => workflow.passReview(report.canPass)}>
              标记通过
            </Button>
            <Button variant="ghost" disabled={state.publish === "sent"} onClick={workflow.rejectReview}>退回修改</Button>
            <Button className="ml-auto" disabled={effectiveReview !== "passed" || state.publish !== "idle"} onClick={() => setConfirmOpen(true)}>
              <SendIcon />
              {state.publish === "sending" ? "发送中" : state.publish === "sent" ? "已发送" : "一键发送"}
            </Button>
          </div>
          {state.generatedAt && <p className="mt-3 text-[11px] text-[#8b909c]">文案生成于 {state.generatedAt}（上海时间）· 审核人 {OPERATOR.name}</p>}
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认模拟发布</DialogTitle>
            <DialogDescription>
              将以「{WEIBO_ACCOUNT.name}」的名义把当前文案标记为已发布。这不会调用微博接口，只更新本机演示状态。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                void workflow.publishPost()
              }}
            >
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
