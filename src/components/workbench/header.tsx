"use client"

import {
  BotIcon,
  ChevronDownIcon,
  ListChecksIcon,
  MenuIcon,
  ServerIcon,
  SettingsIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { engineMeta } from "@/lib/copy/llm-adapter"
import { OPERATOR, ENGINE_OPTIONS } from "@/lib/steps"
import { useWorkflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

export function Header() {
  const workflow = useWorkflow()
  const { state, setMode, setEngine, openList, openAdmin, resetCampaign } = workflow
  const engine = engineMeta(state.engineId)

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[#e6e8ee] bg-white px-3 lg:gap-3 lg:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-lg bg-[#6d4aff] text-white shadow-sm">
          <span className="text-sm font-semibold tracking-tight">H</span>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-[#1c1f2a]">热点营销工作台</div>
          <div className="hidden text-[11px] text-[#8b909c] sm:block">Hotspot Studio</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center rounded-lg bg-[#eef0f4] p-0.5 md:inline-flex">
          <button
            type="button"
            onClick={() => state.mode !== "manual" && setMode("manual")}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium transition",
              state.mode === "manual" ? "bg-white text-[#1c1f2a] shadow-sm" : "text-[#6b7080]",
            )}
          >
            手工模式
          </button>
          <button
            type="button"
            onClick={() => state.mode !== "auto" && setMode("auto")}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium transition",
              state.mode === "auto" ? "bg-white text-[#1c1f2a] shadow-sm" : "text-[#6b7080]",
            )}
          >
            自动模式
          </button>
        </div>

        <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={openList}>
          <ListChecksIcon />
          清单
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#e6e8ee] bg-white px-2.5 text-xs font-medium text-[#1c1f2a] lg:inline-flex">
            <BotIcon className="size-3.5 text-[#6d4aff]" />
            <span className="max-w-36 truncate">{engine.short}</span>
            <span className={cn("size-1.5 rounded-full", engine.connected ? "bg-emerald-500" : "bg-zinc-300")} />
            <ChevronDownIcon className="size-3.5 text-[#8b909c]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>文案引擎</DropdownMenuLabel>
            {ENGINE_OPTIONS.map((option) => (
              <DropdownMenuItem key={option.id} onClick={() => setEngine(option.id)}>
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    {option.label}
                    {state.engineId === option.id && <Badge variant="secondary">当前</Badge>}
                  </span>
                  <span className="text-[11px] text-[#8b909c]">{option.detail}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#e6e8ee] bg-white px-2.5 text-xs text-[#4b5160] xl:inline-flex">
            <ServerIcon className="size-3.5" />
            服务端代理
            <span className="size-1.5 rounded-full bg-emerald-500" />
          </TooltipTrigger>
          <TooltipContent>演示环境走本地文案引擎，请求不会离开这台浏览器。</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="sm" className="hidden text-[#4b5160] lg:inline-flex" onClick={openAdmin}>
          <SettingsIcon />
          后台管理
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e6e8ee] lg:hidden">
            <MenuIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setMode(state.mode === "manual" ? "auto" : "manual")}>
              切换为{state.mode === "manual" ? "自动模式" : "手工模式"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openList}>清单</DropdownMenuItem>
            <DropdownMenuItem onClick={openAdmin}>后台管理</DropdownMenuItem>
            <DropdownMenuSeparator />
            {ENGINE_OPTIONS.map((option) => (
              <DropdownMenuItem key={option.id} onClick={() => setEngine(option.id)}>
                {option.short}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1 text-left hover:bg-[#f6f7f9] sm:pr-2 sm:pl-2">
            <span className="grid size-8 place-items-center rounded-full bg-[#1c1f2a] text-[11px] font-semibold text-white">
              YU
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#1c1f2a]">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {OPERATOR.name} · {OPERATOR.nickname}
              </span>
              <span className="block text-[11px] text-[#8b909c]">
                {OPERATOR.status} · {OPERATOR.group}
              </span>
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-[#eef0f3] px-4 py-3">
              <div className="text-sm font-semibold">个人中心</div>
              <div className="mt-0.5 text-xs text-[#6b7080]">演示账号，注册信息仅在本地展示。</div>
            </div>
            <dl className="grid grid-cols-[88px_1fr] gap-y-2 px-4 py-3 text-xs">
              <dt className="text-[#8b909c]">姓名</dt>
              <dd>{OPERATOR.name} · {OPERATOR.nickname}</dd>
              <dt className="text-[#8b909c]">登录状态</dt>
              <dd className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {OPERATOR.status}
              </dd>
              <dt className="text-[#8b909c]">部门</dt>
              <dd>{OPERATOR.group}</dd>
              <dt className="text-[#8b909c]">岗位</dt>
              <dd>{OPERATOR.title}</dd>
              <dt className="text-[#8b909c]">工号</dt>
              <dd>{OPERATOR.staffId}</dd>
              <dt className="text-[#8b909c]">账号</dt>
              <dd className="truncate">{OPERATOR.email}</dd>
              <dt className="text-[#8b909c]">注册日期</dt>
              <dd>{OPERATOR.registeredAt}</dd>
              <dt className="text-[#8b909c]">最近登录</dt>
              <dd>{OPERATOR.lastLogin} · 上海</dd>
              <dt className="text-[#8b909c]">权限</dt>
              <dd>热点选用、商品绑定、文案生成、审核发布</dd>
            </dl>
            <div className="flex justify-end border-t border-[#eef0f3] px-3 py-2">
              <Button variant="outline" size="sm" onClick={resetCampaign}>
                开始新一轮
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
