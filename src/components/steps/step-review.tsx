"use client"

import { useState } from "react"
import { BadgeCheckIcon, SendIcon } from "lucide-react"
import { Price } from "@/components/price"
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
import { CARD_SHADOW, OPERATOR, WEIBO_ACCOUNT } from "@/lib/steps"
import { useWorkflow } from "@/lib/workflow"
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
  const toneName = { trend: "热点借势", urgent: "促销导向", interactive: "互动话题", seed: "种草安利" }[active.tone]
  const plainLength = active.text.replace(/\s/g, "").length
  const byId = (id: string) => report.checks.find((item) => item.id === id)
  const selfChecks = [
    { ok: byId("ads")?.status !== "fail", label: "无绝对化用语(最/第一/国家级)" },
    { ok: byId("price")?.status === "pass", label: "价格信息与商品库一致" },
    { ok: byId("hash")?.status === "pass" && byId("cta")?.status === "pass", label: "含话题标签与互动引导" },
    { ok: plainLength > 0 && plainLength <= 2000, label: `字数 ${plainLength} / 2000，符合微博限制` },
  ]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-gutter:stable]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Step 5 · 审核并发送</h1>
          <p className="mt-1 text-sm text-[#6b7080]">最终微博效果预览 → 合规审核 → 一键发送(模拟)</p>
        </div>
        <span className={cn("shrink-0 text-sm font-medium", state.publish === "sent" ? "text-emerald-600" : effectiveReview === "passed" ? "text-[#6d4aff]" : "text-orange-500")}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid w-full items-start gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className={cn("mx-auto w-full max-w-[390px] overflow-hidden rounded-xl border border-[#d9dce3] bg-white", CARD_SHADOW)}>
          <div className="flex gap-3 px-4 pt-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ff8140] text-sm font-semibold text-white">热</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[15px] font-semibold">
                {WEIBO_ACCOUNT.name}
                <BadgeCheckIcon className="size-4 text-sky-500" />
              </div>
              <div className="text-[12px] text-[#8b909c]">{state.publish === "sent" ? "已发布" : "预览 · 尚未发布"}</div>
            </div>
          </div>
          <p className="px-4 pt-3 text-[15px] leading-7 whitespace-pre-wrap text-[#1c1f2a]">{active.text}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto px-4">
            {selectedProducts.map((product) => (
              <div key={product.id} className="w-[104px] shrink-0 overflow-hidden rounded-lg border border-[#eef0f3]">
                <ProductArt id={product.id} className="h-16 w-full" />
                <div className="px-1.5 py-1">
                  <div className="truncate text-[11px]">{product.name}</div>
                  {state.includePrice && <Price value={product.price} className="text-[11px] text-[#f97316]" />}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 border-t border-[#eef0f3] text-center text-[13px] text-[#6b7080]">
            <span className="py-3">转发 {state.engagement.reposts}</span>
            <span className="border-x border-[#eef0f3] py-3">评论 {state.engagement.comments}</span>
            <span className="py-3">赞 {state.engagement.likes}</span>
          </div>
          {state.publish === "sent" && (
            <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] text-emerald-800">
              已模拟发布 · {state.publishedAt} · {OPERATOR.name} · 回执 {state.publishId}。未调用微博开放平台。
            </div>
          )}
        </div>

        <section className={cn("rounded-xl border border-[#e6e8ee] bg-white p-5", CARD_SHADOW)}>
          <h2 className="text-sm font-semibold">发布信息</h2>
          <dl className="mt-3 divide-y divide-[#f0f1f4] text-sm">
            <InfoRow label="关联热点" value={selectedNews.title} />
            <InfoRow label="关联商品" value={selectedProducts.map((item) => item.name).join("、")} />
            <InfoRow label="采用版本" value={`${active.label} · ${toneName}`} />
            <InfoRow label="发布账号" value={`@${WEIBO_ACCOUNT.name}`} />
          </dl>
          <h2 className="mt-5 text-sm font-semibold">合规自检</h2>
          <ul className="mt-3 space-y-2">
            {selfChecks.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-0.5", item.ok ? "text-emerald-600" : "text-rose-500")}>{item.ok ? "✓" : "!"}</span>
                <span className={item.ok ? "text-[#1c1f2a]" : "text-rose-600"}>{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-[#22a35a] text-white hover:bg-[#1b8a4b]" disabled={state.publish === "sent"} onClick={() => workflow.passReview(report.canPass)}>
              通过审核
            </Button>
            <Button
              variant="outline"
              className="border-[#d5d8e0] bg-white text-[#1c1f2a]"
              onClick={() => {
                workflow.rejectReview()
                setStep(4)
              }}
            >
              ← 退回修改文案
            </Button>
            {(effectiveReview === "passed" || state.publish !== "idle") && (
              <Button className="ml-auto" disabled={effectiveReview !== "passed" || state.publish !== "idle"} onClick={() => setConfirmOpen(true)}>
                <SendIcon />
                {state.publish === "sending" ? "发送中" : state.publish === "sent" ? "已发送" : "一键发送"}
              </Button>
            )}
          </div>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-4 py-2.5">
      <dt className="text-[#8b909c]">{label}</dt>
      <dd className="text-left text-[#1c1f2a]">{value}</dd>
    </div>
  )
}
