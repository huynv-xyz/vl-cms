import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

export function currentSalaryPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function shiftSalaryPeriod(value: string, delta: number) {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  const base = match
    ? new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() + delta, 1)
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`
}

type Props = {
  value: string
  onChange: (value: string) => void
  onCommit?: (value: string) => void
  className?: string
  inputClassName?: string
  buttonClassName?: string
}

export function SalaryPeriodStepper({
  value,
  onChange,
  onCommit,
  className,
  inputClassName,
  buttonClassName,
}: Props) {
  const commit = (next: string) => onCommit?.(next)

  const move = (delta: number) => {
    const next = shiftSalaryPeriod(value, delta)
    onChange(next)
    commit(next)
  }

  return (
    <div
      className={cn(
        "flex h-14 w-80 overflow-hidden rounded-md border bg-background shadow-sm focus-within:ring-3 focus-within:ring-ring/40",
        className
      )}
    >
      <Input
        className={cn(
          "h-full rounded-none border-0 text-center text-2xl font-bold tracking-wide shadow-none focus-visible:ring-0",
          inputClassName
        )}
        placeholder="YYYY-MM"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => commit(value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit(value)
        }}
      />
      <div className="flex w-14 shrink-0 flex-col border-l">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-1/2 w-full rounded-none border-b", buttonClassName)}
          onClick={() => move(1)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-1/2 w-full rounded-none", buttonClassName)}
          onClick={() => move(-1)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
