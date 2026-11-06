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
import { ENGINE_OPTIONS } from "@/lib/steps"
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
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <MobileSteps />
          <div className="flex min-h-0 w-full flex-1 flex-col px-6 pt-4">
            <CampaignLine
              title={selectedNews?.title}
              productNames={selectedProducts.map((item) => item.name)}
              copyCount={state.copies.length}
              engine={state.engineId}
              showGenerated={state.step === 5 && state.copies.length > 0}
              sent={state.publish === "sent"}
              onJump={() => setStep(1)}
              onReset={resetCampaign}
            />
            <div className="mt-3 flex min-h-0 flex-1 flex-col">
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
  productNames,
  copyCount,
  engine,
  showGenerated,
  sent,
  onJump,
  onReset,
}: {
  title?: string
  productNames: string[]
  copyCount: number
  engine: string
  showGenerated: boolean
  sent: boolean
  onJump: () => void
  onReset: () => void
}) {
  const engineName = ENGINE_OPTIONS.find((item) => item.id === engine)?.short ?? "deepseek-chat"
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
    <div className="grid grid-cols-1 items-center gap-2 rounded-xl bg-white px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-[#8b909c]">当前话题</span>
        <button type="button" className="max-w-[280px] truncate font-medium text-[#f97316]" onClick={onJump}>
          {title}
        </button>
        {productNames.length > 0 && (
          <>
            <span className="text-[#c5c8d0]">→</span>
            <span className="min-w-0 truncate text-[#6b7080]">
              {productNames.length} 件商品：{productNames.join("、")}
            </span>
          </>
        )}
        {sent && (
          <button type="button" className="font-medium text-[#6d4aff]" onClick={onReset}>
            开始新一轮
          </button>
        )}
      </p>
      {showGenerated ? (
        <span className="justify-self-start rounded-full bg-[#16a34a] px-3 py-1 text-xs font-medium text-white lg:justify-self-center">
          已生成 {copyCount}/3 个版本 · {engineName}
        </span>
      ) : (
        <span />
      )}
      <span />
    </div>
  )
}
