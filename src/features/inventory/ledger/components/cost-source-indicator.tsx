import { Calculator, Clock, FileInput, Link, Pencil, Scale, TriangleAlert } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatNumber } from "@/lib/utils"
import { getCostSourcePresentation } from "../data/cost-source"
import type { InventoryLedgerReportRow } from "../data/schema"

const icons = { calculated: Calculator, import: FileInput, manual: Pencil, linked: Link,
    adjusted: Scale, pending: Clock, warning: TriangleAlert }
const colors = { calculated: "text-emerald-600", import: "text-blue-600", manual: "text-blue-600",
    linked: "text-emerald-600", adjusted: "text-amber-600", pending: "text-slate-400", warning: "text-red-600" }

export function CostSourceIndicator({ row, unitPrice }: { row: InventoryLedgerReportRow; unitPrice: number }) {
    const info = getCostSourcePresentation(row)
    const Icon = icons[info.kind]
    return (
        <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={`${info.title}: ${formatNumber(unitPrice)}`}
                    className="flex min-h-6 items-center justify-between gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Icon aria-hidden="true" className={cn("size-4 shrink-0", colors[info.kind])} />
                    <span className="min-w-0 text-right">{formatNumber(unitPrice)}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} collisionPadding={16}
                className="w-72 max-w-[calc(100vw-2rem)] border border-slate-200 bg-white p-3 text-left text-xs leading-5 text-slate-700 shadow-md [&_svg]:bg-white [&_svg]:fill-white">
                <div className={cn("mb-2 text-sm font-semibold", colors[info.kind])}>{info.title}</div>
                {info.details.length ? <dl className="space-y-1">
                    {info.details.map((detail) => <div key={detail.label} className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
                        <dt className="text-slate-500">{detail.label}</dt>
                        <dd className="min-w-0 break-words font-medium">{typeof detail.value === "number"
                            ? `${formatNumber(detail.value)} đ` : detail.value}</dd>
                    </div>)}
                </dl> : null}
                {info.note ? <p className={cn("text-slate-500", info.details.length && "mt-2 border-t border-slate-100 pt-2")}>{info.note}</p> : null}
            </TooltipContent>
        </Tooltip>
    )
}
