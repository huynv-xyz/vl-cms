import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"
import type { CustomerVip } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { Link } from "@tanstack/react-router"
import { formatCurrency } from "@/lib/utils"
import { Crown, CalendarDays, MapPin, ArrowRight, ShieldCheck } from "lucide-react"

function buildCurrencyColumn<T>(opts: {
    accessorKey: keyof T & string
    title: string
    width?: number
    highlight?: boolean
}): ColumnDef<T> {
    return {
        accessorKey: opts.accessorKey,
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={opts.title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(opts.accessorKey)
            return (
                <span className={`block text-right tabular-nums text-sm ${opts.highlight ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}`}>
                    {formatCurrency(Number(value ?? 0))}
                </span>
            )
        },
        size: opts.width ?? 140,
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    }
}

export const customerVipColumns: ColumnDef<CustomerVip>[] = [
    {
        ...buildIndexColumn<CustomerVip>(),
        size: 56,
        meta: {
            thClassName: "w-14 whitespace-nowrap",
            tdClassName: "w-14 ps-3 whitespace-nowrap",
        },
    },

    // ── Khách hàng (combined: link + name + type/region) ──────────────
    {
        accessorKey: "customer_code",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Khách hàng" />
        ),
        cell: ({ row }) => {
            const { id, customer_code, customer_name, customer_type, region, calc_year } = row.original
            return (
                <div className="min-w-[200px]">
                    <Link
                        to="/vip/customer/$id"
                        params={{ id }}
                        className="text-primary hover:bg-primary/10 group inline-flex items-center gap-1.5 rounded-md font-mono text-sm font-bold transition-colors"
                    >
                        <Crown className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                        <span className="group-hover:underline">{customer_code}</span>
                    </Link>
                    <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {customer_name || "—"}
                    </div>
                    <Link
                        to="/vip/customer/$id"
                        params={{ id }}
                        hash="vip-audit"
                        className="mt-1 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-blue-600 hover:underline"
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Audit điểm VIP
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {customer_type && <span>{customer_type}</span>}
                        {region && (
                            <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {region}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-0.5">
                            <CalendarDays className="h-3 w-3" />
                            {calc_year}
                        </span>
                    </div>
                </div>
            )
        },
        size: 220,
    },

    // ── Tổng điểm VIP ────────────────────────────────────────────────
    buildNumberColumn<CustomerVip>({
        accessorKey: "total_vip_point",
        title: "Tổng điểm VIP",
        width: 130,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "common_group_point",
        title: "Điểm nhóm chung",
        width: 140,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "ma_vthh_point",
        title: "Điểm MA VTHH",
        width: 130,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "ma_rieng_point",
        title: "Điểm mã riêng",
        width: 130,
    }),

    // ── Hạng VIP (tier + next tier arrow) ────────────────────────────
    {
        accessorKey: "tier_name",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Hạng VIP" />
        ),
        cell: ({ row }) => {
            const { tier_name, next_tier_name } = row.original
            return (
                <div className="space-y-1">
                    {tier_name ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            <Crown className="h-3 w-3" />
                            {tier_name}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                    )}
                    {next_tier_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            {next_tier_name}
                        </div>
                    )}
                </div>
            )
        },
        size: 160,
    },

    // ── Điểm còn thiếu + ghi chú ─────────────────────────────────────
    {
        accessorKey: "missing_point_to_next",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Điểm còn thiếu" />
        ),
        cell: ({ row }) => {
            const { missing_point_to_next, missing_point_message } = row.original
            const val = Number(missing_point_to_next ?? 0)
            return (
                <div className="min-w-[120px] text-right">
                    <div className={`tabular-nums text-sm font-semibold ${val > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {new Intl.NumberFormat("vi-VN").format(val)}
                    </div>
                    {missing_point_message && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {missing_point_message}
                        </div>
                    )}
                </div>
            )
        },
        size: 160,
        meta: { className: "text-right", tdClassName: "text-right" },
    },

    // ── Thưởng / điểm ────────────────────────────────────────────────
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "reward_amount",
        title: "Thưởng / điểm",
        width: 140,
    }),

    buildCurrencyColumn<CustomerVip>({
        accessorKey: "total_reward_amount",
        title: "Tổng thưởng",
        width: 140,
    }),

    buildCurrencyColumn<CustomerVip>({
        accessorKey: "private_bonus_amount",
        title: "Thưởng riêng",
        width: 130,
    }),

    // ── Thưởng cuối (highlighted) ─────────────────────────────────────
    buildCurrencyColumn<CustomerVip>({
        accessorKey: "final_bonus_amount",
        title: "Thưởng cuối",
        width: 150,
        highlight: true,
    }),
]
