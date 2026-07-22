import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { Crown } from "lucide-react"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatCurrency } from "@/lib/utils"
import type { CustomerVip } from "../data/schema"

const CENTER_CELL = "overflow-hidden text-center align-middle whitespace-nowrap"
const RIGHT_CELL = "overflow-hidden text-right align-middle whitespace-nowrap"

function formatNumber(value: number | string | null | undefined) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}

function buildTextColumn<T>(opts: {
    accessorKey: keyof T & string
    title: string
    width: number
    fallback?: string
    align?: "left" | "center"
}): ColumnDef<T> {
    const isLeft = opts.align === "left"
    return {
        accessorKey: opts.accessorKey,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={opts.title} />,
        cell: ({ row }) => {
            const value = row.getValue(opts.accessorKey)
            const text = value == null || value === "" ? (opts.fallback ?? "-") : String(value)
            return (
                <span className={`block min-w-0 truncate text-sm ${isLeft ? "text-left" : "text-center"}`} title={text}>
                    {text}
                </span>
            )
        },
        size: opts.width,
        minSize: Math.min(opts.width, 120),
        meta: {
            thClassName: `w-[${opts.width}px] whitespace-nowrap ${isLeft ? "text-left" : "text-center"}`,
            tdClassName: `w-[${opts.width}px] ${isLeft ? "overflow-hidden text-left align-middle whitespace-nowrap" : CENTER_CELL}`,
        },
    }
}

function buildVipNumberColumn<T>(opts: {
    accessorKey: keyof T & string
    title: string
    width: number
    highlight?: "success" | "warning"
}): ColumnDef<T> {
    return {
        accessorKey: opts.accessorKey,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={opts.title} />,
        cell: ({ row }) => {
            const value = Number(row.getValue(opts.accessorKey) ?? 0)
            const tone = opts.highlight === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : opts.highlight === "warning" && value > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : ""

            return (
                <span className={`block min-w-0 truncate text-right text-sm font-semibold tabular-nums ${tone}`} title={formatNumber(value)}>
                    {formatNumber(value)}
                </span>
            )
        },
        size: opts.width,
        minSize: Math.min(opts.width, 120),
        meta: {
            className: "text-right",
            thClassName: `w-[${opts.width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${opts.width}px] ${RIGHT_CELL}`,
        },
    }
}

function buildCurrencyColumn<T>(opts: {
    accessorKey: keyof T & string
    title: string
    width: number
    highlight?: boolean
}): ColumnDef<T> {
    return {
        accessorKey: opts.accessorKey,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={opts.title} />,
        cell: ({ row }) => {
            const value = Number(row.getValue(opts.accessorKey) ?? 0)
            const text = formatCurrency(value)
            return (
                <span
                    className={`block min-w-0 truncate text-right text-sm tabular-nums ${opts.highlight ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}`}
                    title={text}
                >
                    {text}
                </span>
            )
        },
        size: opts.width,
        minSize: Math.min(opts.width, 120),
        meta: {
            className: "text-right",
            thClassName: `w-[${opts.width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${opts.width}px] ${RIGHT_CELL}`,
        },
    }
}

export const customerVipColumns: ColumnDef<CustomerVip>[] = [
    {
        ...buildIndexColumn<CustomerVip>(),
        size: 64,
        minSize: 56,
        meta: {
            thClassName: `w-16 whitespace-nowrap ${CENTER_CELL}`,
            tdClassName: `w-16 ${CENTER_CELL}`,
        },
    },
    {
        accessorKey: "customer_code",
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mã khách hàng" />,
        cell: ({ row }) => {
            const { id, customer_code } = row.original
            return (
                <Link
                    to="/vip/customer/$id"
                    params={{ id }}
                    search={(prev: { from_date?: string; to_date?: string; as_of_date?: string }) => ({
                        from_date: prev.from_date,
                        to_date: prev.to_date,
                        as_of_date: prev.as_of_date,
                    })}
                    className="text-primary hover:bg-primary/10 group mx-auto flex min-w-0 max-w-full items-center justify-center gap-1.5 rounded-md font-mono text-sm font-bold transition-colors"
                    title={customer_code}
                >
                    <span className="min-w-0 truncate group-hover:underline">{customer_code}</span>
                </Link>
            )
        },
        size: 170,
        minSize: 140,
        meta: {
            thClassName: `w-[170px] whitespace-nowrap text-center`,
            tdClassName: `w-[170px] ${CENTER_CELL}`,
        },
    },
    buildTextColumn<CustomerVip>({
        accessorKey: "customer_name",
        title: "Tên khách hàng",
        width: 280,
        align: "left",
    }),
    buildVipNumberColumn<CustomerVip>({
        accessorKey: "total_vip_point",
        title: "Tổng điểm VIP",
        width: 160,
    }),
    buildVipNumberColumn<CustomerVip>({
        accessorKey: "common_group_point",
        title: "Điểm nhóm chung",
        width: 170,
    }),
    buildVipNumberColumn<CustomerVip>({
        accessorKey: "ma_rieng_point",
        title: "Điểm mã riêng",
        width: 160,
    }),
    {
        accessorKey: "tier_name",
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hạng hiện tại" />,
        cell: ({ row }) => {
            const { tier_name } = row.original
            return (
                <div className="mx-auto min-w-0 space-y-1 text-center">
                    {tier_name ? (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            <Crown className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 truncate">{tier_name}</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                </div>
            )
        },
        size: 180,
        minSize: 150,
        meta: {
            thClassName: `w-[180px] whitespace-nowrap text-center`,
            tdClassName: `w-[180px] ${CENTER_CELL}`,
        },
    },
    {
        accessorKey: "missing_point_to_next",
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Điểm còn thiếu" />,
        cell: ({ row }) => {
            const { missing_point_to_next, next_tier_name } = row.original
            const value = Number(missing_point_to_next ?? 0)
            const text = formatNumber(value)
            const message = next_tier_name ? `Để lên hạng ${next_tier_name}` : ""
            return (
                <div className="min-w-0 text-right" title={message || text}>
                    <div className={`truncate text-sm font-semibold tabular-nums ${value > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {text}
                    </div>
                    {message && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            Để lên hạng <span className="font-semibold text-foreground">{next_tier_name}</span>
                        </div>
                    )}
                </div>
            )
        },
        size: 180,
        minSize: 150,
        meta: {
            className: "text-right",
            thClassName: `w-[180px] whitespace-nowrap text-right`,
            tdClassName: `w-[180px] ${RIGHT_CELL}`,
        },
    },
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "reward_amount",
        title: "Thưởng / điểm",
        width: 160,
    }),
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "total_reward_amount",
        title: "Tổng thưởng",
        width: 160,
    }),
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "private_bonus_amount",
        title: "Thưởng riêng",
        width: 160,
    }),
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "final_bonus_amount",
        title: "Thưởng cuối",
        width: 160,
        highlight: true,
    }),
]
