import { ArrowDownLeft, ArrowUpRight, Boxes, Calculator, RotateCcw, Scale, type LucideIcon } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

type Props = {
    revenue: number
    returnRevenue: number
    actualRevenue: number
    saleQty: number
    returnQty: number
    actualQty: number
    isLoading?: boolean
}

const loadingText = "Đang tải..."

export function TransactionSummaryStrip({
    revenue,
    returnRevenue,
    actualRevenue,
    saleQty,
    returnQty,
    actualQty,
    isLoading,
}: Props) {
    return (
        <div className="grid gap-2 md:grid-cols-3 2xl:grid-cols-6">
            <MetricCard
                icon={ArrowUpRight}
                label="Doanh số bán"
                value={isLoading ? loadingText : formatCurrency(revenue)}
                tone="credit"
            />
            <MetricCard
                icon={ArrowDownLeft}
                label="Doanh số trả lại"
                value={isLoading ? loadingText : formatCurrency(returnRevenue)}
                tone="debit"
            />
            <MetricCard
                icon={Calculator}
                label="Doanh số bán thực tế"
                value={isLoading ? loadingText : formatCurrency(actualRevenue)}
                tone="closing"
            />
            <MetricCard
                icon={Boxes}
                label="Tổng SL bán"
                value={isLoading ? loadingText : formatNumber(saleQty)}
                tone="opening"
            />
            <MetricCard
                icon={RotateCcw}
                label="Tổng SL trả lại"
                value={isLoading ? loadingText : formatNumber(returnQty)}
                tone="neutral"
            />
            <MetricCard
                icon={Scale}
                label="SL bán thực tế"
                value={isLoading ? loadingText : formatNumber(actualQty)}
                tone="violet"
            />
        </div>
    )
}

function formatNumber(value: number) {
    return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 6 })
}

function MetricCard({
    icon: Icon,
    label,
    value,
    strong,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    strong?: boolean
    tone: "opening" | "debit" | "credit" | "closing" | "neutral" | "violet"
}) {
    const toneClass = {
        opening: {
            card: "border-sky-200 bg-sky-50 text-sky-800",
            icon: "bg-white/75 text-sky-700",
            value: "text-sky-950",
        },
        debit: {
            card: "border-rose-200 bg-rose-50 text-rose-800",
            icon: "bg-white/75 text-rose-700",
            value: "text-rose-700",
        },
        credit: {
            card: "border-emerald-200 bg-emerald-50 text-emerald-800",
            icon: "bg-white/75 text-emerald-700",
            value: "text-emerald-700",
        },
        closing: {
            card: "border-blue-200 bg-blue-50 text-blue-800",
            icon: "bg-white/75 text-blue-700",
            value: "text-blue-950",
        },
        neutral: {
            card: "border-amber-200 bg-amber-50 text-amber-800",
            icon: "bg-white/75 text-amber-700",
            value: "text-amber-700",
        },
        violet: {
            card: "border-violet-200 bg-violet-50 text-violet-800",
            icon: "bg-white/75 text-violet-700",
            value: "text-violet-700",
        },
    }[tone]

    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div
                        className={cn(
                            "mt-1 truncate text-right text-lg tabular-nums",
                            strong ? "font-bold" : "font-semibold",
                            toneClass.value,
                        )}
                    >
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}
