import { CircleCheck, Clock, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import { getSummaryCostStatus } from "../data/cost-status"
import type { InventorySummary } from "../data/schema"

const icons = { complete: CircleCheck, pending: Clock, empty: Minus }
const colors = { complete: "text-emerald-600", pending: "text-amber-600", empty: "text-slate-400" }

export function SummaryAverageCost({ row, fromDate, toDate }: { row: InventorySummary; fromDate?: string; toDate?: string }) {
    const status = getSummaryCostStatus(row)
    const Icon = icons[status.kind]
    const price = status.kind === "empty" || row.avg_issue_unit_cost == null ? "—" : formatCurrency(Number(row.avg_issue_unit_cost))
    return (
        <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={`Giá xuất bình quân: ${price}. ${status.title}`}
                    className="flex min-h-6 items-center justify-between gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Icon aria-hidden="true" className={cn("size-4 shrink-0", colors[status.kind])} />
                    <span className="min-w-0 text-right">{price}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8} collisionPadding={16}
                className="w-72 max-w-[calc(100vw-2rem)] border border-slate-200 bg-white p-3 text-left text-xs leading-5 text-slate-700 shadow-md [&_svg]:bg-white [&_svg]:fill-white">
                <div className={cn("mb-2 text-sm font-semibold", colors[status.kind])}>{status.title}</div>
                <dl className="space-y-1">
                    {status.kind !== "empty" ? <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Đã tính giá</dt>
                        <dd className="text-right font-medium">{status.total == null ? "Chưa có thông tin" : `${formatNumber(status.calculated)}/${formatNumber(status.total)} giao dịch xuất`}</dd>
                    </div> : null}
                    {status.kind === "pending" && status.pending != null ? <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Chưa tính/cần tính lại</dt>
                        <dd className="shrink-0 font-medium">{formatNumber(status.pending)} giao dịch</dd>
                    </div> : null}
                    <div className="grid grid-cols-[60px_minmax(0,1fr)] gap-2">
                        <dt className="text-slate-500">Thời gian</dt>
                        <dd className="min-w-0 break-words font-medium">{formatDate(fromDate, "Đầu dữ liệu")} – {formatDate(toDate, "Hôm nay")}</dd>
                    </div>
                </dl>
                {status.kind === "pending" ? <p className="mt-2 border-t border-slate-100 pt-2 text-slate-500">Bình quân theo giá trị đang ghi nhận, chưa phải giá cuối cùng.</p> : null}
            </TooltipContent>
        </Tooltip>
    )
}

function formatDate(value: string | undefined, fallback: string) {
    if (!value) return fallback
    const [year, month, day] = value.split("T")[0].split("-")
    return year && month && day ? `${day}/${month}/${year}` : value
}
