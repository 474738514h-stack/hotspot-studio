"use client"

import { CheckIcon } from "lucide-react"
import { STEPS } from "@/lib/steps"
import type { StepId } from "@/lib/types"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

function doneMap(input: {
  news: boolean
  products: boolean
  copies: boolean
  review: boolean
}): Record<StepId, boolean> {
  return {
    1: input.news,
    2: input.products,
    3: input.products,
    4: input.copies,
    5: input.review,
  }
}

function stepHint(id: StepId, title: string | undefined, products: number, copies: number, publish: string) {
  if (id === 1 && title) return `已选：${title}`
  if (id === 2 && products) return `已采纳 ${products} 件`
  if (id === 3 && products) return `已绑定 ${products} 件`
  if (id === 4 && copies) return `已生成 ${copies} 个版本`
  if (id === 5 && publish === "sent") return "已模拟发布"
  return STEPS.find((step) => step.id === id)?.desc ?? ""
}

export function Sidebar() {
  const { state, setStep, selectedNews, selectedProducts, openAdmin } = useWorkflow()
  const done = doneMap({
    news: Boolean(selectedNews),
    products: selectedProducts.length > 0,
    copies: state.copies.length > 0,
    review: state.review === "passed" || state.publish === "sent",
  })

  return (
    <aside className="hidden min-h-0 w-[232px] shrink-0 flex-col overflow-y-auto border-r border-[#e6e8ee] bg-[#fbfbfc] lg:flex">
      <div className="px-4 pt-4 pb-2 text-[11px] font-medium tracking-[0.14em] text-[#98a0ae]">营销流程 PIPELINE</div>
      <nav aria-label="营销流程" className="flex flex-col gap-1 px-2">
        {STEPS.map((step) => {
          const active = state.step === step.id
          const complete = done[step.id] && !active
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setStep(step.id)}
              className={cn(
                "flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition",
                active ? "bg-[#f3f0ff] text-[#4c3aa8]" : "text-[#3c4250] hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  active && "bg-[#6d4aff] text-white",
                  complete && "bg-emerald-500 text-white",
                  !active && !complete && "border border-[#e1e4ea] bg-white text-[#6b7080]",
                )}
              >
                {complete ? <CheckIcon className="size-3.5" /> : step.id}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium">
                  Step {step.id} · {step.title}
                </span>
                <span className={cn("mt-0.5 line-clamp-2 text-[11px]", active ? "text-[#7c6ad6]" : "text-[#8b909c]")}>
                  {stepHint(step.id, selectedNews?.title, selectedProducts.length, state.copies.length, state.publish)}
                </span>
              </span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-[#eef0f3] p-4">
        <div className="text-xs font-medium text-[#1c1f2a]">大模型已接入</div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#8b909c]">
          支持 DeepSeek 及任意 OpenAI 兼容接口。提示词可在
          <button type="button" className="mx-0.5 text-[#6d4aff]" onClick={openAdmin}>
            后台管理
          </button>
          中修改。
        </p>
      </div>
    </aside>
  )
}

export function MobileSteps() {
  const { state, setStep } = useWorkflow()
  return (
    <div className="sticky top-0 z-20 border-b border-[#e6e8ee] bg-[#fbfbfc]/95 backdrop-blur lg:hidden">
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        {STEPS.map((step) => {
          const active = state.step === step.id
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setStep(step.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                active ? "bg-[#6d4aff] text-white" : "bg-white text-[#4b5160] ring-1 ring-[#e6e8ee]",
              )}
            >
              {step.id}. {step.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
