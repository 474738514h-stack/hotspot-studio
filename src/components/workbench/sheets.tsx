"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { buildLlmRequest, LLM_ENV, SYSTEM_PROMPT } from "@/lib/copy/llm-adapter"
import { STEPS, WEIBO_ACCOUNT } from "@/lib/steps"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

export function WorkbenchSheets() {
  const workflow = useWorkflow()
  const { state, selectedNews, selectedProducts } = workflow
  const [word, setWord] = useState("")

  const checks = [
    { label: "选定爆款热点", done: Boolean(selectedNews) },
    { label: "绑定至少 1 个商品", done: selectedProducts.length > 0 },
    { label: "生成微博文案", done: state.copies.length > 0 },
    { label: "合规审核通过", done: state.review === "passed" || state.publish === "sent" },
    { label: "模拟发布", done: state.publish === "sent" },
  ]

  const promptPreview = selectedNews && selectedProducts.length
    ? buildLlmRequest({
        news: selectedNews,
        products: selectedProducts,
        reasons: [],
        tone: state.tone,
        length: state.length,
        emoji: state.emoji,
        includePrice: state.includePrice,
        engineId: state.engineId,
      })
    : null

  return (
    <>
      <Sheet open={workflow.listOpen} onOpenChange={workflow.setListOpen}>
        <SheetContent className="w-full sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>本轮清单</SheetTitle>
            <SheetDescription>五步都走完，才算一轮热点战役。</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            {checks.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#eef0f3] px-3 py-2.5">
                <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", item.done ? "bg-emerald-500 text-white" : "bg-[#f3f4f6] text-[#6b7080]")}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm">{item.label}</div>
                  <div className="text-[11px] text-[#8b909c]">{STEPS[index]?.desc}</div>
                </div>
                <span className={cn("ml-auto text-xs", item.done ? "text-emerald-600" : "text-[#8b909c]")}>{item.done ? "完成" : "待办"}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto px-4 pb-4">
            <Button className="w-full" variant="outline" onClick={workflow.resetCampaign}>
              开始新一轮
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={workflow.adminOpen} onOpenChange={workflow.setAdminOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>后台管理</SheetTitle>
            <SheetDescription>热点源、禁用词和模型接入位。演示数据不会离开浏览器。</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <section>
              <h3 className="text-sm font-medium">热点源</h3>
              <div className="mt-2 space-y-2">
                <label className="flex items-center justify-between rounded-xl border border-[#eef0f3] px-3 py-2.5 text-sm">
                  <span>微博热搜</span>
                  <Switch checked={state.sources.weibo} onCheckedChange={(checked) => workflow.setSource("weibo", checked)} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[#eef0f3] px-3 py-2.5 text-sm">
                  <span>百度热搜</span>
                  <Switch checked={state.sources.baidu} onCheckedChange={(checked) => workflow.setSource("baidu", checked)} />
                </label>
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="text-sm font-medium">发布账号</h3>
              <p className="mt-1 text-xs text-[#6b7080]">
                {WEIBO_ACCOUNT.name} · @{WEIBO_ACCOUNT.handle} · {WEIBO_ACCOUNT.verified} · 粉丝 {WEIBO_ACCOUNT.fans}
              </p>
            </section>
            <Separator />
            <section>
              <h3 className="text-sm font-medium">禁用词</h3>
              <p className="mt-1 text-xs text-[#6b7080]">审核时会拦截包含这些词的文案。试着在正文里写「全网第一」。</p>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  workflow.addBannedWord(word)
                  setWord("")
                  toast.success("已加入禁用词")
                }}
              >
                <Input value={word} onChange={(event) => setWord(event.target.value)} placeholder="添加禁用词" />
                <Button type="submit" variant="outline">
                  添加
                </Button>
              </form>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {state.bannedWords.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => workflow.removeBannedWord(item)}
                    className="rounded-full bg-[#f6f3ff] px-2 py-1 text-[11px] text-[#4c3aa8]"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="text-sm font-medium">模型接入位</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6b7080]">
                服务端读取环境变量 {LLM_ENV.base}、{LLM_ENV.key}、{LLM_ENV.model} 后，把下面的请求交给兼容接口，或交给 Coze 工作流。当前未配置，生成全部走本地演示引擎。
              </p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-[#1c1f2a] p-3 text-[11px] leading-relaxed text-[#efeaff]">
                {promptPreview ? JSON.stringify(promptPreview, null, 2) : SYSTEM_PROMPT}
              </pre>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
