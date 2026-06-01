import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Building2,
    CalendarDays,
    MapPin,
    Package,
    User,
} from "lucide-react"

import { Delivery } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { DeliveryDetailDialog } from "../components/delivery-detail-dialog"
import { DeliveryRowActions } from "../components/delivery-row-actions"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { updateDeliveryStatus } from "@/api/sale/delivery"
import {
    DELIVERY_STATUSES,
    getDeliveryStatusMeta,
    getNextDeliveryStatuses,
} from "../components/delivery-status"

export function useDeliveryColumns() {
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const columns: ColumnDef<Delivery>[] = [
        buildIndexColumn(),

        {
            accessorKey: "delivery_no",
            header: "Mã giao / Đơn hàng",
            cell: ({ row }) => {
                const r = row.original
                return (
                    <button
                        type="button"
                        className="group flex flex-col items-start text-left"
                        onClick={() => setSelectedId(r.id)}
                    >
                        <span className="font-mono text-sm font-semibold text-primary group-hover:underline">
                            {r.delivery_no}
                        </span>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Package className="h-3 w-3" />
                            {r.order?.order_no || "Chưa có đơn"}
                        </span>
                    </button>
                )
            },
        },

        {
            accessorKey: "customer_id",
            header: "Khách hàng",
            cell: ({ row }) => {
                const customer = row.original.order?.customer
                if (!customer) return <span className="text-muted-foreground">—</span>
                return (
                    <div className="inline-flex min-w-[180px] items-start gap-1.5 text-sm">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <div className="truncate font-medium">{customer.name}</div>
                            {customer.code ? (
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {customer.code}
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            },
        },

        {
            accessorKey: "company_id",
            header: "Công ty",
            cell: ({ row }) => {
                const name = row.original.company?.name
                if (!name) return <span className="text-muted-foreground">—</span>
                return (
                    <div className="inline-flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{name}</span>
                    </div>
                )
            },
        },

        {
            accessorKey: "delivery_date",
            header: "Ngày giao",
            cell: ({ row }) => (
                <div className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatDate(row.original.delivery_date)}</span>
                </div>
            ),
        },

        {
            accessorKey: "delivery_address",
            header: "Địa chỉ giao",
            cell: ({ row }) => {
                const addr = row.original.delivery_address
                if (!addr) return <span className="text-muted-foreground">—</span>
                return (
                    <div className="flex max-w-[320px] items-start gap-1.5 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-2 text-muted-foreground" title={addr}>
                            {addr}
                        </span>
                    </div>
                )
            },
        },

        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => <DeliveryStatusSelect delivery={row.original} />,
        },

        buildActionsColumn({
            renderActions: (_, row) => {
                const status = row.original.status
                if (["DELIVERING", "DONE"].includes(status)) {
                    return null
                }
                return <DeliveryRowActions row={row} />
            },
        }),
    ]

    return {
        columns,
        dialog: (
            <DeliveryDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        ),
    }
}

function DeliveryStatusSelect({ delivery }: { delivery: Delivery }) {
    const queryClient = useQueryClient()
    const allowedNextStatuses = getNextDeliveryStatuses(delivery.status)
    const isLocked = allowedNextStatuses.length === 0
    const meta = getDeliveryStatusMeta(delivery.status)
    const StatusIcon = meta.icon

    const mutation = useMutation({
        mutationFn: (value: string) => updateDeliveryStatus(delivery.id, value),
        onError: () => {
            toast.error("Cập nhật trạng thái thất bại")
        },
        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            queryClient.invalidateQueries({ queryKey: ["order-detail", delivery.order_id] })
        },
    })

    if (isLocked) {
        // Read-only pill khi đã chốt
        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
            >
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
            </span>
        )
    }

    return (
        <Select
            value={delivery.status}
            onValueChange={(value) => mutation.mutate(value)}
            disabled={mutation.isPending}
        >
            <SelectTrigger className="h-8 w-[150px] gap-1.5 border-dashed">
                <SelectValue>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.tone}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {DELIVERY_STATUSES.map((status) => {
                    const m = getDeliveryStatusMeta(status.value)
                    return (
                        <SelectItem
                            key={status.value}
                            value={status.value}
                            disabled={
                                status.value !== delivery.status &&
                                !allowedNextStatuses.includes(status.value)
                            }
                        >
                            <span className="inline-flex items-center gap-2">
                                <span className={`inline-block h-1.5 w-1.5 rounded-full ${m.dotClass}`} />
                                {status.label}
                            </span>
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}

function formatDate(value?: string) {
    if (!value) return "—"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return date
}
