import { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Order } from "../data/schema"
import { OrderRowActions } from "./order-row-actions"
import { Badge } from "@/components/ui/badge"
import { getOrderStatusMeta, ORDER_STATUSES } from "./order-status"
import { cn, formatCurrency } from "@/lib/utils"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { useInlineStatus } from "@/hooks/use-inline-status"
import { getMyPermissions } from "@/api/auth/permission"
import { updateOrderStatus } from "@/api/sale/order"
import { CalendarDays, Package, User } from "lucide-react"

export function useOrderColumns() {
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateOrder =
        hasPermission(permissions, "sales.orders", "update") ||
        hasPermission(permissions, "sales.orders", "status.update")

    const mutation = useInlineStatus<Order>({
        queryKey: ["orders"],
        invalidateQueryKeys: [["deliveries"], ["exports"], ["order-detail"]],
        mutationFn: updateOrderStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Order>[] = [
        buildIndexColumn(),

        // ── Mã đơn hàng ──────────────────────────────────────────────
        {
            accessorKey: "order_no",
            header: "Mã đơn hàng",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="min-w-[160px]">
                        <Link
                            to="/sales/orders/$id"
                            params={{ id: String(order.id) }}
                            className="text-primary inline-flex items-center gap-1.5 rounded-md font-mono text-sm font-bold hover:underline"
                        >
                            <Package className="h-3.5 w-3.5 opacity-60" />
                            {order.order_no}
                        </Link>
                        <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(order.order_date)}
                        </div>
                    </div>
                )
            },
        },

        // ── Khách hàng ───────────────────────────────────────────────
        {
            accessorKey: "customer_id",
            header: "Khách hàng",
            cell: ({ row }) => {
                const customer = row.original.customer
                const employee = row.original.employee
                const initials = getInitials(customer?.name)
                return (
                    <div className="flex min-w-[180px] items-center gap-2.5">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold leading-snug">
                                {customer?.name ?? "—"}
                            </div>
                            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{employee?.name ?? "Chưa gán"}</span>
                            </div>
                        </div>
                    </div>
                )
            },
        },

        // ── Hàng hoá ─────────────────────────────────────────────────
        {
            id: "items",
            header: "Hàng hoá",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const normalItems = items.filter((i: any) => i.line_type !== "PROMOTION")
                const promoCount = items.length - normalItems.length
                const totalQty = normalItems.reduce(
                    (s: number, i: any) => s + Number(i.quantity || 0),
                    0
                )

                if (!items.length) {
                    return (
                        <span className="text-muted-foreground text-xs italic">
                            Chưa có hàng
                        </span>
                    )
                }

                return (
                    <div className="min-w-[140px] space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Badge
                                variant="secondary"
                                className="px-2 py-0 text-[11px] font-semibold"
                            >
                                {normalItems.length} sản phẩm
                            </Badge>
                            {promoCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-100 px-2 py-0 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                    +{promoCount} KM
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted-foreground text-xs tabular-nums">
                            {formatNumber(totalQty)} đặt
                        </div>
                    </div>
                )
            },
        },

        // ── Tiến độ xuất ─────────────────────────────────────────────
        {
            id: "progress",
            header: "Tiến độ xuất",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const totalQty = items.reduce(
                    (s: number, i: any) => s + Number(i.quantity || 0),
                    0
                )
                const exportedQty = items.reduce(
                    (s: number, i: any) => s + Number(i.exported_quantity || 0),
                    0
                )
                const remainQty = items.reduce(
                    (s: number, i: any) => s + Number(i.remain_quantity || 0),
                    0
                )
                const percent =
                    totalQty > 0 ? Math.min(100, Math.round((exportedQty / totalQty) * 100)) : 0
                const isDone = remainQty <= 0 && totalQty > 0

                if (!totalQty) {
                    return (
                        <span className="text-muted-foreground text-xs italic">—</span>
                    )
                }

                return (
                    <div className="min-w-[150px] space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground tabular-nums">
                                {formatNumber(exportedQty)}/{formatNumber(totalQty)}
                            </span>
                            <span
                                className={cn(
                                    "font-bold tabular-nums",
                                    isDone
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-foreground"
                                )}
                            >
                                {percent}%
                            </span>
                        </div>
                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    isDone
                                        ? "bg-emerald-500"
                                        : remainQty > 0
                                          ? "bg-amber-400"
                                          : "bg-muted-foreground/30"
                                )}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )
            },
        },

        // ── Trạng thái ───────────────────────────────────────────────
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status || "NEW"
                const isLocked = status === "DONE" || status === "CANCELLED"
                const meta = getOrderStatusMeta(status)
                const Icon = meta.icon

                return (
                    <div className="min-w-[145px]">
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                mutation.mutate({ row: row.original, value: v })
                            }
                            disabled={mutation.isPending || isLocked || !canUpdateOrder}
                        >
                            <SelectTrigger
                                className={cn(
                                    "h-8 w-[145px] gap-2 border text-xs font-semibold",
                                    meta.badgeClass
                                )}
                            >
                                <SelectValue>
                                    <span className="flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5" />
                                        {meta.label}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUSES.map((s) => {
                                    const sm = getOrderStatusMeta(s.value)
                                    const SIcon = sm.icon
                                    return (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                            disabled={isLocked || !canUpdateOrder}
                                        >
                                            <span className="flex items-center gap-2">
                                                <SIcon className={cn("h-3.5 w-3.5", sm.tone)} />
                                                {s.label}
                                            </span>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                )
            },
        },

        // ── Tổng tiền ────────────────────────────────────────────────
        {
            accessorKey: "total_amount",
            header: () => <div className="text-right">Tổng tiền</div>,
            cell: ({ row }) => (
                <div className="min-w-[120px] text-right">
                    <div className="text-sm font-bold tabular-nums">
                        {formatCurrency(row.original.total_amount ?? 0)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[10px] font-medium">VND</div>
                </div>
            ),
        },

        buildActionsColumn({
            renderActions: (_, row) => {
                if (
                    row.original.status === "DONE" ||
                    row.original.status === "CANCELLED" ||
                    !canUpdateOrder
                )
                    return null
                return <OrderRowActions row={row} />
            },
        }),
    ]

    return columns
}

// ── Helpers ───────────────────────────────────────────────────────────

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((p: any) => p.module === module && p.action === action)
}

function formatDate(value?: string) {
    if (!value) return "—"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3) {
        return parts[0].length === 4
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return date || value
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US").format(value || 0)
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
