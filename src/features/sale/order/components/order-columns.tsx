import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Order } from "../data/schema"
import { OrderRowActions } from "./order-row-actions"
import { Link } from "@tanstack/react-router"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getOrderStatusMeta, ORDER_STATUSES } from "./order-status"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { useInlineStatus } from "@/hooks/use-inline-status"
import { updateOrderStatus } from "@/api/sale/order"

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
            header: "Đơn hàng",
            cell: ({ row }) => (
                <div className="min-w-[180px]">
                    <Link
                        to="/sales/orders/$id"
                        params={{ id: String(row.original.id) }}
                        className="font-semibold text-primary hover:underline"
                    >
                        {row.original.order_no}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Ngày đặt {formatDate(row.original.order_date)}
                    </div>
                </div>
            ),
        },

        {
            accessorKey: "customer_id",
            header: "Khách hàng",
            cell: ({ row }) => (
                <div className="min-w-[180px]">
                    <div className="font-medium">{row.original.customer?.name ?? "-"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Sale: {row.original.employee?.name ?? "-"}
                    </div>
                </div>
            ),
        },

        {
            id: "items",
            header: "Hàng bán",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const preview = items.slice(0, 2)

                if (!items.length) {
                    return <span className="text-sm text-muted-foreground">Chưa có hàng</span>
                }

                return (
                    <div className="min-w-[240px] space-y-1">
                        {preview.map((item: any) => (
                            <div key={`${item.product_id}-${item.product?.code ?? ""}`} className="text-sm">
                                <span className="font-medium">{item.product?.code || item.product_name || `#${item.product_id}`}</span>
                                <span className="ml-2 text-muted-foreground">
                                    {formatNumber(Number(item.quantity || 0))} {item.product?.unit || ""}
                                </span>
                            </div>
                        ))}
                        {items.length > preview.length && (
                            <div className="text-xs text-muted-foreground">
                                +{items.length - preview.length} dòng khác
                            </div>
                        )}
                    </div>
                )
            },
        },

        {
            id: "progress",
            header: "Tiến độ hàng",
            cell: ({ row }) => {
                const items = row.original.items ?? []
                const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
                const exportedQty = items.reduce((sum: number, item: any) => sum + Number(item.exported_quantity || 0), 0)
                const remainQty = items.reduce((sum: number, item: any) => sum + Number(item.remain_quantity || 0), 0)

                return (
                    <div className="min-w-[160px] text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Dòng hàng</span>
                            <span className="font-medium">{items.length}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Đã xuất</span>
                            <span className="font-medium">{formatNumber(exportedQty)}/{formatNumber(totalQty)}</span>
                        </div>
                        {remainQty > 0 && (
                            <div className="mt-1 text-xs font-medium text-amber-600">
                                Còn {formatNumber(remainQty)} chưa xuất
                            </div>
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
                            <SelectTrigger className="h-9 w-[150px]">
                                <SelectValue>
                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                {ORDER_STATUSES.map((s) => (
                                    <SelectItem
                                        key={s.value}
                                        value={s.value}
                                        disabled={isLocked}
                                    >
                                        {s.label}
                                    </SelectItem>
                                ))}
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
                <div className="whitespace-nowrap text-right text-base font-bold">
                    {formatCurrency(row.original.total_amount ?? 0)}
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
