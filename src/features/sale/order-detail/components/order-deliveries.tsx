import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    CalendarDays,
    Eye,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Truck,
    Warehouse,
} from "lucide-react"

import { deleteDelivery, updateDeliveryStatus } from "@/api/sale/delivery"
import { getMyPermissions } from "@/api/auth/permission"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CreateDeliveryDialog } from "../../delivery/components/create-delivery-dialog"
import { DeliveryDetailDialog } from "../../delivery/components/delivery-detail-dialog"
import { UpdateDeliveryDialog } from "../../delivery/components/update-delivery-dialog"
import {
    deliveryStatusMeta,
    DELIVERY_STATUSES,
    getNextDeliveryStatuses,
} from "../../delivery/components/delivery-status"

export function OrderDeliveries({ order, deliveries }: any) {
    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const isEditable = order?.status === "CONFIRMED"
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canCreateDelivery = hasPermission(permissions, "sales.deliveries", "create")
    const canUpdateDelivery = hasPermission(permissions, "sales.deliveries", "update")
    const canUpdateDeliveryStatus =
        hasPermission(permissions, "sales.deliveries", "status.update") || canUpdateDelivery

    const { mutate: removeDelivery, isPending } = useMutation({
        mutationFn: deleteDelivery,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            toast.success("Đã xoá phiếu giao hàng")
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    const { mutate: changeStatus, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, status }: any) => updateDeliveryStatus(id, status),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["order-detail", order.id] })
            const prev = queryClient.getQueryData(["order-detail", order.id])

            queryClient.setQueryData(["order-detail", order.id], (old: any) => {
                if (!old) return old
                return {
                    ...old,
                    deliveries: old.deliveries.map((x: any) =>
                        x.id === id ? { ...x, status } : x
                    ),
                }
            })

            return { prev }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(["order-detail", order.id], context?.prev)
            toast.error("Cập nhật thất bại")
        },
        onSuccess: () => toast.success("Cập nhật trạng thái thành công"),
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            void queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            void queryClient.invalidateQueries({ queryKey: ["exports"] })
            void queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
    })

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        <Truck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Phiếu giao hàng</h2>
                        <p className="text-xs text-muted-foreground">
                            Theo dõi lịch giao, kho giao và danh sách hàng trên từng phiếu
                        </p>
                    </div>
                </div>

                {isEditable && canCreateDelivery && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Tạo phiếu giao
                    </Button>
                )}
            </div>

            {!deliveries?.length ? (
                <EmptyState
                    icon={Truck}
                    title="Chưa có phiếu giao hàng"
                    desc="Khi tạo phiếu giao, các thông tin sẽ hiển thị tại đây."
                />
            ) : (
                <div className="space-y-3 p-4">
                    {deliveries.map((delivery: any) => {
                        const meta = getDeliveryStatusMeta(delivery.status)
                        const allowedNextStatuses = getNextDeliveryStatuses(delivery.status)
                        const isRowLocked = !isEditable || allowedNextStatuses.length === 0
                        const totalQty = sumBy(delivery.items ?? [], (item: any) => item.quantity)

                        return (
                            <div
                                key={delivery.id}
                                className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            className="text-left font-semibold text-primary hover:underline"
                                            onClick={() => setSelectedId(delivery.id)}
                                        >
                                            {delivery.delivery_no}
                                        </button>
                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {formatDate(delivery.delivery_date)}
                                            </span>
                                            {delivery.delivery_address && (
                                                <span className="inline-flex max-w-[280px] items-center gap-1 truncate">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    {delivery.delivery_address}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="font-normal">
                                            {formatNumber(delivery.items?.length || 0)} dòng
                                        </Badge>
                                        <Badge variant="secondary" className="font-normal">
                                            SL: {formatNumber(totalQty)}
                                        </Badge>
                                        <Select
                                            value={delivery.status || "NEW"}
                                            onValueChange={(status) =>
                                                changeStatus({ id: delivery.id, status })
                                            }
                                            disabled={isUpdating || isRowLocked || !canUpdateDeliveryStatus}
                                        >
                                            <SelectTrigger className="h-8 w-[150px]">
                                                <SelectValue>
                                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DELIVERY_STATUSES.map((status) => (
                                                    <SelectItem
                                                        key={status.value}
                                                        value={status.value}
                                                        disabled={
                                                            status.value !== delivery.status &&
                                                            !allowedNextStatuses.includes(status.value)
                                                        }
                                                    >
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => setSelectedId(delivery.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {!isRowLocked && canUpdateDelivery && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => setEditRow(delivery)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                                                    disabled={isPending}
                                                    onClick={() => {
                                                        if (confirm("Xoá phiếu giao hàng này?")) {
                                                            removeDelivery(delivery.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <ItemsTable items={delivery.items ?? []} />
                            </div>
                        )
                    })}
                </div>
            )}

            {isEditable && canCreateDelivery && (
                <CreateDeliveryDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {editRow && (
                <UpdateDeliveryDialog
                    order={order}
                    delivery={editRow}
                    open={!!editRow}
                    onOpenChange={(open: boolean) => {
                        if (!open) setEditRow(null)
                    }}
                />
            )}

            <DeliveryDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        </div>
    )
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((p: any) => p.module === module && p.action === action)
}

function ItemsTable({ items }: { items: any[] }) {
    if (!items.length) {
        return (
            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Phiếu chưa có hàng
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase">Sản phẩm</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Kho xuất</TableHead>
                        <TableHead className="w-[140px] text-right text-xs font-semibold uppercase">Số lượng</TableHead>
                        <TableHead className="w-[120px] text-right text-xs font-semibold uppercase">Đơn vị</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={`${item.product_id}-${item.id ?? ""}`}>
                            <TableCell>
                                <div className="font-medium">{item.product?.name || "-"}</div>
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {item.product?.code || "-"}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">
                                <span className="inline-flex items-center gap-1.5">
                                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                                    {item.warehouse?.name || "-"}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                                {formatNumber(item.quantity)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                                {item.product?.unit || "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function EmptyState({
    icon: Icon,
    title,
    desc,
}: {
    icon: any
    title: string
    desc: string
}) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{desc}</p>
        </div>
    )
}

function getDeliveryStatusMeta(status?: string) {
    return deliveryStatusMeta[String(status ?? "").toUpperCase()] ?? {
        label: status || "-",
        variant: "outline" as const,
    }
}

function sumBy(items: any[], fn: (item: any) => unknown) {
    return items.reduce((sum, item) => sum + Number(fn(item) || 0), 0)
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return date
}
