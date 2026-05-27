import { useMemo } from "react"
import { Coins, Percent, ShoppingBag, Tag } from "lucide-react"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type { Transaction } from "../data/schema"

type Props = {
    data: Transaction[]
}

export function TransactionSummaryStrip({ data }: Props) {
    const totals = useMemo(() => {
        let saleQty = 0
        let returnQty = 0
        let revenue = 0
        let discount = 0
        let unitPriceSum = 0
        let unitPriceCount = 0

        for (const row of data) {
            saleQty += num(row.sale_qty)
            returnQty += num(row.return_qty)
            revenue += num(row.revenue)
            discount += num(row.discount)
            const price = num(row.unit_price)
            if (price > 0) {
                unitPriceSum += price
                unitPriceCount += 1
            }
        }

        return {
            saleQty,
            returnQty,
            revenue,
            discount,
            avgPrice: unitPriceCount > 0 ? unitPriceSum / unitPriceCount : 0,
            rows: data.length,
        }
    }, [data])

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={ShoppingBag}
                label="Tổng SL bán"
                value={formatNumber(totals.saleQty)}
                sub={`${formatNumber(totals.rows)} dòng • SL trả: ${formatNumber(totals.returnQty)}`}
                tone="sky"
            />
            <MetricCard
                icon={Coins}
                label="Tổng doanh số"
                value={formatCurrency(totals.revenue)}
                sub="VND (đã trừ chiết khấu)"
                tone="emerald"
            />
            <MetricCard
                icon={Percent}
                label="Tổng chiết khấu"
                value={formatCurrency(totals.discount)}
                sub="VND"
                tone="amber"
            />
            <MetricCard
                icon={Tag}
                label="Đơn giá trung bình"
                value={formatCurrency(Math.round(totals.avgPrice))}
                sub="VND / dòng có đơn giá"
                tone="slate"
            />
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    sub,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    sub?: string
    tone: "sky" | "emerald" | "amber" | "slate"
}) {
    const tones = {
        sky: { iconBg: "bg-sky-50 text-sky-600 ring-sky-100", accent: "from-sky-50/60" },
        emerald: { iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100", accent: "from-emerald-50/60" },
        amber: { iconBg: "bg-amber-50 text-amber-600 ring-amber-100", accent: "from-amber-50/60" },
        slate: { iconBg: "bg-slate-100 text-slate-600 ring-slate-200", accent: "from-slate-50/60" },
    }

    return (
        <div className="group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
                    tones[tone].accent,
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
                <div
                    className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
                        tones[tone].iconBg,
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    )
}

function num(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
}
