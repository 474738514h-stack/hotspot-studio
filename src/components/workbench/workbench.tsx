"use client"

import { Loader2Icon } from "lucide-react"
import { Header } from "@/components/workbench/header"
import { MobileSteps, Sidebar } from "@/components/workbench/sidebar"
import { WorkbenchSheets } from "@/components/workbench/sheets"
import { StepCompose } from "@/components/steps/step-compose"
import { StepMatch } from "@/components/steps/step-match"
import { StepNews } from "@/components/steps/step-news"
import { StepReview } from "@/components/steps/step-review"
import { StepSuggest } from "@/components/steps/step-suggest"
import { WorkflowProvider, useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const AUTO_PHASES = ["锁定爆款热点", "采纳匹配商品", "生成微博文案", "送入审核台"]

export function Workbench() {
  return (
    <WorkflowProvider>
      <Shell />
    </WorkflowProvider>
  )
}

function Shell() {
  const { state, selectedNews, selectedProducts, setStep, resetCampaign } = useWorkflow()

  return (
    <div className="flex h-dvh flex-col bg-[#f4f5f7] text-[#1c1f2a]">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <MobileSteps />
          <div className="mx-auto w-full max-w-[1440px] px-4 py-4 lg:px-6 lg:py-5">
            <CampaignLine
              title={selectedNews?.title}
              products={selectedProducts.length}
              hasCopy={state.copies.length > 0}
              sent={state.publish === "sent"}
              onJump={() => setStep(selectedNews ? 1 : 1)}
              onReset={resetCampaign}
            />
            <div className="mt-3">
              {state.step === 1 && <StepNews />}
              {state.step === 2 && <StepSuggest />}
              {state.step === 3 && <StepMatch />}
              {state.step === 4 && <StepCompose />}
              {state.step === 5 && <StepReview />}
            </div>
          </div>
        </main>
      </div>
      <WorkbenchSheets />
      {state.autoPhase !== null && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#1c1f2a]/25 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2Icon className="size-4 animate-spin text-[#6d4aff]" />
              自动模式正在编排本轮
            </div>
            <ol className="mt-4 space-y-2">
              {AUTO_PHASES.map((item, index) => (
                <li key={item} className={cn("text-sm", index <= (state.autoPhase ?? 0) ? "text-[#1c1f2a]" : "text-[#c0c4cc]")}>
                  {index < (state.autoPhase ?? 0) ? "完成" : index === state.autoPhase ? "进行中" : "等待"} · {item}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignLine({
  title,
  products,
  hasCopy,
  sent,
  onJump,
  onReset,
}: {
  title?: string
  products: number
  hasCopy: boolean
  sent: boolean
  onJump: () => void
  onReset: () => void
}) {
  if (!title) {
    return (
      <p className="text-xs text-[#8b909c]">
        尚未选择热点 — 从{" "}
        <button type="button" className="font-medium text-[#6d4aff]" onClick={onJump}>
          Step 1 新闻抓取
        </button>{" "}
        开始你的爆款之旅
      </p>
    )
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8b909c]">
      <button type="button" className="max-w-full truncate font-medium text-[#6d4aff]" onClick={onJump}>
        本轮爆款 · {title}
      </button>
      <span>已绑定 {products} 件商品</span>
      <span>{hasCopy ? "文案已生成" : "文案未生成"}</span>
      {sent && (
        <button type="button" className="font-medium text-[#6d4aff]" onClick={onReset}>
          开始新一轮
        </button>
      )}
    </p>
  )
}
