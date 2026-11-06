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

export function Sidebar() {
  const { state, setStep, selectedNews, selectedProducts } = useWorkflow()
  const done = doneMap({
    news: Boolean(selectedNews),
    products: selectedProducts.length > 0,
    copies: state.copies.length > 0,
    review: state.review === "passed" || state.publish === "sent",
  })

  return (
    <aside className="hidden min-h-0 w-[232px] shrink-0 flex-col overflow-y-auto border-r border-[#e6e8ee] bg-[#fbfbfc] lg:flex">
      <div className="px-4 pt-4 pb-2 text-[11px] font-medium tracking-[0.14em] text-[#98a0ae]">新闻流程 PIPELINE</div>
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
                <span className={cn("mt-0.5 block text-[11px]", active ? "text-[#7c6ad6]" : "text-[#8b909c]")}>{step.desc}</span>
              </span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-[#eef0f3] p-4 text-xs text-[#6b7080]">
        <div className="font-medium text-[#1c1f2a]">本轮战役</div>
        <ul className="mt-2 space-y-1.5">
          <li className="flex justify-between gap-3">
            <span>热点</span>
            <span className="truncate text-right text-[#1c1f2a]">{selectedNews ? "已选定" : "未选"}</span>
          </li>
          <li className="flex justify-between">
            <span>商品</span>
            <span className="text-[#1c1f2a]">{selectedProducts.length} 件</span>
          </li>
          <li className="flex justify-between">
            <span>文案</span>
            <span className="text-[#1c1f2a]">{state.copies.length ? "已生成" : "未生成"}</span>
          </li>
          <li className="flex justify-between">
            <span>发布</span>
            <span className="text-[#1c1f2a]">{state.publish === "sent" ? "已模拟发布" : "未发送"}</span>
          </li>
        </ul>
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
