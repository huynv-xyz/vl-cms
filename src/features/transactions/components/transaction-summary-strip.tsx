import { Coins } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

type Props = {
    revenue: number
    isLoading?: boolean
}

export function TransactionSummaryStrip({ revenue, isLoading }: Props) {
    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={Coins}
                label="Tổng doanh số bán"
                value={isLoading ? "Đang tải..." : formatCurrency(revenue)}
                sub="Theo toàn bộ danh sách sau bộ lọc"
            />
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    sub?: string
}) {
    return (
        <div className="group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
                    "from-emerald-50/60",
                )}
            />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                    </div>
                    <div className="mt-2 truncate text-2xl font-bold tabular-nums leading-tight text-slate-950">
                        {value}
                    </div>
                    {sub ? (
                        <div className="mt-1 truncate text-xs font-medium text-slate-500">{sub}</div>
                    ) : null}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    )
}
