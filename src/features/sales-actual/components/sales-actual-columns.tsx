import { type ColumnDef } from "@tanstack/react-table"
import type { SalesActualItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ProductKey = "bon_goc" | "bon_la_bot" | "clcn" | "bon_la_long"

const productLabels: Record<ProductKey, string> = {
    bon_goc: "Bón gốc",
    bon_la_bot: "Bón lá bột",
    clcn: "CLCN",
    bon_la_long: "Bón lá lỏng",
}

const productUnitMultipliers: Record<ProductKey, number> = {
    bon_goc: 1,
    bon_la_bot: 1000,
    clcn: 1,
    bon_la_long: 1000,
}

function formatNumber(value?: number | null) {
    if (value == null) return "-"
    return value.toLocaleString("vi-VN")
}

function formatCoeff(value?: number | null) {
    if (value == null) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 })
}

function formatPercent(actual?: number, target?: number) {
    if (actual == null || target == null || target === 0) return "-"
    return `${((actual / target) * 100).toFixed(1)}%`
}

function formatRate(value?: number | null) {
    if (value == null) return "-"
    return `${(value * 100).toFixed(1)}%`
}

function formatPeriod(value?: number) {
    if (value == null) return "-"
    const period = String(value)
    if (/^\d{6}$/.test(period)) return `${period.slice(0, 4)}-${period.slice(4)}`
    return period
}

function targetTotal(row: SalesActualItem) {
    return row.target_gtqd_month
}

function actualTotal(row: SalesActualItem) {
    return row.actual_gtqd
}

function getTargetValue(row: SalesActualItem, key: ProductKey) {
    if (!row.target) return undefined
    return (row.target[key] ?? 0) / 12
}

function getActualValue(row: SalesActualItem, key: ProductKey) {
    return row.actual?.[key]
}

function getCoeff(row: SalesActualItem, key: ProductKey) {
    return row.conversion_coeff?.[key]
}

function personCell(row: SalesActualItem) {
    const employee = row.employee
    const region = row.region
    const province = row.province

    return (
        <div className="min-w-[260px] space-y-1">
            <div className="font-medium text-foreground">
                {employee ? [employee.code, employee.name].filter(Boolean).join(" - ") : "-"}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="h-5 px-1.5 font-mono">
                    {formatPeriod(row.actual?.period)}
                </Badge>
                <span>{region ? [region.code, region.name].filter(Boolean).join(" - ") : "Chưa có vùng"}</span>
                <span>·</span>
                <span>{province ? [province.code, province.name].filter(Boolean).join(" - ") : "Không tỉnh"}</span>
            </div>
        </div>
    )
}

function moneyCell(value?: number) {
    return <div className="text-right font-medium tabular-nums">{formatNumber(value)}</div>
}

function completionTone(actual?: number, target?: number) {
    if (actual == null || target == null || target === 0) {
        return {
            rate: undefined,
            label: "-",
            badge: "border-slate-200 bg-slate-50 text-slate-600",
            card: "border-slate-200 bg-slate-50/60",
            bar: "bg-slate-300",
        }
    }

    const rate = (actual / target) * 100

    if (rate >= 100) {
        return {
            rate,
            label: `${rate.toFixed(1)}%`,
            badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
            card: "border-emerald-200 bg-emerald-50/50",
            bar: "bg-emerald-500",
        }
    }

    if (rate >= 80) {
        return {
            rate,
            label: `${rate.toFixed(1)}%`,
            badge: "border-amber-200 bg-amber-50 text-amber-700",
            card: "border-amber-200 bg-amber-50/50",
            bar: "bg-amber-500",
        }
    }

    return {
        rate,
        label: `${rate.toFixed(1)}%`,
        badge: "border-red-200 bg-red-50 text-red-700",
        card: "border-red-200 bg-red-50/50",
        bar: "bg-red-500",
    }
}

function completionBadge(actual?: number, target?: number) {
    const tone = completionTone(actual, target)

    return (
        <Badge variant="outline" className={cn("justify-center font-semibold tabular-nums", tone.badge)}>
            {tone.label}
        </Badge>
    )
}

function productCell(row: SalesActualItem, key: ProductKey) {
    const target = getTargetValue(row, key)
    const actual = getActualValue(row, key)
    const coeff = getCoeff(row, key)
    const unitMultiplier = productUnitMultipliers[key]
    const targetQd = target == null || coeff == null ? undefined : target * unitMultiplier * coeff
    const actualQd = actual == null || coeff == null ? undefined : actual * unitMultiplier * coeff
    const tone = completionTone(actual, target)
    const progress = Math.min(tone.rate ?? 0, 140)

    return (
        <div className={cn("min-w-[178px] rounded-md border p-2.5 shadow-sm", tone.card)}>
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-current/10 pb-1.5">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                    {productLabels[key]}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
                    HS x{formatCoeff(coeff)}{unitMultiplier !== 1 ? " · x1000" : ""}
                </Badge>
            </div>
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div>CT tháng</div>
                    <div>QD CT tháng</div>
                    <div>Thực hiện</div>
                    <div>QD thực hiện</div>
                </div>
                <div className="space-y-1 text-right text-xs tabular-nums">
                    <div className="font-medium text-foreground">{formatNumber(target)}</div>
                    <div className="font-semibold text-foreground">{formatNumber(targetQd)}</div>
                    <div className="font-bold text-foreground">{formatNumber(actual)}</div>
                    <div className="font-semibold text-foreground">{formatNumber(actualQd)}</div>
                </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/80">
                    <div
                        className={cn("h-full rounded-full", tone.bar)}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <Badge variant="outline" className={cn("min-w-[62px] justify-center px-1.5 text-[11px] font-semibold tabular-nums", tone.badge)}>
                    {formatPercent(actual, target)}
                </Badge>
            </div>
        </div>
    )
}

function header(title: string, align: "left" | "right" | "center" = "left") {
    return (
        <div
            className={cn(
                "text-xs font-semibold uppercase tracking-normal text-muted-foreground",
                align === "right" && "text-right",
                align === "center" && "text-center",
            )}
        >
            {title}
        </div>
    )
}

const stickyLeft = "sticky left-0 z-10 bg-background shadow-[1px_0_0_0_hsl(var(--border))]"

export const salesActualColumns: ColumnDef<SalesActualItem>[] = [
    {
        ...buildIndexColumn<SalesActualItem>(),
        meta: {
            className: cn("w-12 bg-muted/40", stickyLeft),
            tdClassName: cn("w-12 ps-3", stickyLeft),
        },
    },
    {
        id: "employee",
        accessorFn: (row) => row.employee?.name || row.employee?.code || "",
        header: () => header("Nhân viên / Phạm vi"),
        cell: ({ row }) => personCell(row.original),
        size: 320,
        meta: {
            className: "min-w-[320px] bg-muted/40",
            tdClassName: "min-w-[320px]",
        },
    },
    {
        id: "target_status",
        accessorFn: (row) => Boolean(row.target),
        header: () => header("Khớp CT", "center"),
        cell: ({ row }) => (
            <div className="text-center">
                {row.original.target ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Đã khớp
                    </Badge>
                ) : (
                    <Badge variant="destructive">Thiếu</Badge>
                )}
            </div>
        ),
        size: 100,
        meta: {
            className: "w-[100px] bg-muted/40",
            tdClassName: "w-[100px]",
        },
    },
    {
        id: "debt_rate",
        accessorFn: (row) => row.actual?.debt_rate,
        header: () => header("Thu nợ", "right"),
        cell: ({ row }) => <div className="text-right tabular-nums">{formatRate(row.original.actual?.debt_rate)}</div>,
        size: 90,
        meta: {
            className: "w-[90px] bg-muted/40",
            tdClassName: "w-[90px]",
        },
    },
    {
        id: "target_total",
        accessorFn: targetTotal,
        header: () => header("GTQD CT tháng", "right"),
        cell: ({ row }) => moneyCell(targetTotal(row.original)),
        size: 130,
        meta: {
            className: "w-[130px] bg-muted/40",
            tdClassName: "w-[130px]",
        },
    },
    {
        id: "actual_total",
        accessorFn: actualTotal,
        header: () => header("GTQD TH", "right"),
        cell: ({ row }) => moneyCell(actualTotal(row.original)),
        size: 120,
        meta: {
            className: "w-[120px] bg-muted/40",
            tdClassName: "w-[120px]",
        },
    },
    {
        id: "completion_total",
        header: () => header("% HT", "center"),
        cell: ({ row }) => (
            <div className="flex justify-center">
                {row.original.completion_rate == null
                    ? completionBadge(actualTotal(row.original), targetTotal(row.original))
                    : completionBadge(row.original.completion_rate, 1)}
            </div>
        ),
        size: 100,
        meta: {
            className: "w-[100px] border-r bg-muted/40",
            tdClassName: "w-[100px] border-r",
        },
    },
    {
        id: "bon_goc",
        header: () => header("Bón gốc", "center"),
        cell: ({ row }) => productCell(row.original, "bon_goc"),
        size: 170,
        meta: {
            className: "w-[170px]",
            tdClassName: "w-[170px]",
        },
    },
    {
        id: "bon_la_bot",
        header: () => header("Bón lá bột", "center"),
        cell: ({ row }) => productCell(row.original, "bon_la_bot"),
        size: 170,
        meta: {
            className: "w-[170px]",
            tdClassName: "w-[170px]",
        },
    },
    {
        id: "clcn",
        header: () => header("CLCN", "center"),
        cell: ({ row }) => productCell(row.original, "clcn"),
        size: 170,
        meta: {
            className: "w-[170px]",
            tdClassName: "w-[170px]",
        },
    },
    {
        id: "bon_la_long",
        header: () => header("Bón lá lỏng", "center"),
        cell: ({ row }) => productCell(row.original, "bon_la_long"),
        size: 170,
        meta: {
            className: "w-[170px]",
            tdClassName: "w-[170px]",
        },
    },
]
