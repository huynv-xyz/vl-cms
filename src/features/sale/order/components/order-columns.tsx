import { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
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
import { updateOrderStatus } from "@/api/sale/order"
import { CalendarDays, Package, User } from "lucide-react"

export function useOrderColumns() {
    const mutation = useInlineStatus<Order>({
        queryKey: ["orders"],
        mutationFn: updateOrderStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Order>[] = [
        buildIndexColumn(),

        {
            accessorKey: "order_no",
            header: "Mã đơn hàng",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="min-w-[180px]">
                        <Link
                            to="/sales/orders/$id"
                            params={{ id: String(order.id) }}
                            className="text-primary hover:bg-primary/10 group inline-flex items-center gap-1.5 rounded-md font-mono text-sm font-bold transition-colors"
                        >
                            <Package className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                            <span className="group-hover:underline">{order.order_no}</span>
                        </Link>
                        <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <CalendarDays className="h-3 w-3" />
                            <span className="tabular-nums">{formatDate(order.order_date)}</span>
                        </div>
                    </div>
                )
            },
        },

        {
            accessorKey: "customer_id",
            header: "Khách hàng",
            cell: ({ row }) => {
                const customer = row.original.customer
                const employee = row.original.employee
                const initials = getInitials(customer?.name)
                return (
                    <div className="flex min-w-[200px] items-start gap-2.5">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{customer?.name ?? "-"}</div>
                            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{employee?.name ?? "Chưa gán"}</span>
                            </div>
                        </div>
                    </div>
                )
            },
        },

        {
            id: "items",
            header: "Hàng bán",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const preview = items.slice(0, 2)

                if (!items.length) {
                    return <span className="text-muted-foreground text-xs italic">Chưa có hàng</span>
                }

                return (
                    <div className="min-w-[220px] space-y-1">
                        {preview.map((item: any, idx: number) => (
                            <div
                                key={`${item.product_id}-${idx}`}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span className="bg-muted/60 text-foreground rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                                    {item.product?.code || `#${item.product_id}`}
                                </span>
                                <span className="text-muted-foreground tabular-nums text-xs">
                                    {formatNumber(Number(item.quantity || 0))} {item.product?.unit || ""}
                                </span>
                                {item.line_type === "PROMOTION" && (
                                    <Badge className="bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-100" variant="secondary">
                                        KM
                                    </Badge>
                                )}
                            </div>
                        ))}
                        {items.length > preview.length && (
                            <div className="text-muted-foreground text-xs">
                                +{items.length - preview.length} dòng khác
                            </div>
                        )}
                    </div>
                )
            },
        },

        {
            id: "progress",
            header: "Tiến độ xuất",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
                const exportedQty = items.reduce((sum: number, item: any) => sum + Number(item.exported_quantity || 0), 0)
                const remainQty = items.reduce((sum: number, item: any) => sum + Number(item.remain_quantity || 0), 0)
                const percent = totalQty > 0 ? Math.min(100, Math.round((exportedQty / totalQty) * 100)) : 0
                const isDone = remainQty <= 0 && totalQty > 0

                return (
                    <div className="min-w-[180px] space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="text-muted-foreground tabular-nums">
                                {formatNumber(exportedQty)} / {formatNumber(totalQty)}
                            </span>
                            <span
                                className={cn(
                                    "font-bold tabular-nums",
                                    isDone ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                                )}
                            >
                                {percent}%
                            </span>
                        </div>
                        <div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    isDone ? "bg-emerald-500" : remainQty > 0 ? "bg-amber-500" : "bg-muted-foreground/30"
                                )}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        {remainQty > 0 ? (
                            <div className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                                Còn {formatNumber(remainQty)} chưa xuất
                            </div>
                        ) : isDone ? (
                            <div className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                Đã xuất đủ
                            </div>
                        ) : (
                            <div className="text-muted-foreground text-xs italic">Chưa xuất</div>
                        )}
                    </div>
                )
            },
        },

        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status || "NEW"
                const isLocked = status === "DONE"
                const meta = getOrderStatusMeta(status)
                const Icon = meta.icon

                return (
                    <div className="min-w-[150px]">
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                mutation.mutate({
                                    row: row.original,
                                    value: v,
                                })
                            }
                            disabled={mutation.isPending || isLocked}
                        >
                            <SelectTrigger
                                className={cn(
                                    "h-9 w-[150px] gap-2 border font-medium",
                                    meta.badgeClass
                                )}
                            >
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5" />
                                        <span className="text-xs font-semibold">{meta.label}</span>
                                    </div>
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
                                            disabled={isLocked}
                                        >
                                            <div className="flex items-center gap-2">
                                                <SIcon className={cn("h-3.5 w-3.5", sm.tone)} />
                                                {s.label}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                )
            },
        },

        {
            accessorKey: "total_amount",
            header: () => <div className="text-right">Tổng tiền</div>,
            cell: ({ row }) => (
                <div className="min-w-[130px] text-right">
                    <div className="whitespace-nowrap text-base font-bold tabular-nums">
                        {formatCurrency(row.original.total_amount ?? 0)}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px] font-medium">
                        VND
                    </Badge>
                </div>
            ),
        },

        buildActionsColumn({
            renderActions: (_, row) => {
                if (row.original.status === "DONE") return null
                return <OrderRowActions row={row} />
            },
        }),
    ]

    return columns
}

function formatDate(value?: string) {
    if (!value) return "-"
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
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
