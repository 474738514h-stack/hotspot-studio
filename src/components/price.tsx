import { cn } from "@/lib/utils"

export function Price({
  value,
  className,
  strike = false,
}: {
  value: number
  className?: string
  strike?: boolean
}) {
  const digits = Number.isInteger(value) ? 0 : 1
  return (
    <span className={cn("inline-flex items-baseline", strike && "line-through", className)}>
      <span className="text-[14px] font-normal">¥</span>
      <span className="font-bold">{value.toFixed(digits)}</span>
    </span>
  )
}
