import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarDays, Eye, MapPin, Pencil, Plus, Trash2, Warehouse } from "lucide-react"

import { deleteDelivery, updateDeliveryStatus } from "@/api/sale/delivery"
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
import { deliveryStatusMeta, DELIVERY_STATUSES } from "../../delivery/components/delivery-status"

export function OrderDeliveries({ order, deliveries }: any) {
    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const isEditable = order?.status === "CONFIRMED"

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
        },
    })

    return (
        <div className="rounded-md border bg-background">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h2 className="font-semibold">Phiếu giao hàng</h2>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi lịch giao, kho giao và danh sách hàng trên từng phiếu.
                    </p>
                </div>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo phiếu giao
                    </Button>
                )}
            </div>

            {!deliveries?.length ? (
                <EmptyState text="Chưa có phiếu giao hàng cho đơn này." />
            ) : (
                <div className="space-y-3 p-4">
                    {deliveries.map((delivery: any) => {
                        const meta = getDeliveryStatusMeta(delivery.status)
                        const isRowLocked = !isEditable || delivery.status === "DONE"
                        const totalQty = sumBy(delivery.items ?? [], (item: any) => item.quantity)

                        return (
                            <div key={delivery.id} className="rounded-md border">
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            className="text-left font-semibold text-primary hover:underline"
                                            onClick={() => setSelectedId(delivery.id)}
                                        >
                                            {delivery.delivery_no}
                                        </button>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4" />
                                                {formatDate(delivery.delivery_date)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Warehouse className="h-4 w-4" />
                                                {delivery.warehouse?.name || "-"}
                                            </span>
                                            {delivery.delivery_address && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {delivery.delivery_address}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline">
                                            {formatNumber(delivery.items?.length || 0)} dòng
                                        </Badge>
                                        <Badge variant="secondary">
                                            {formatNumber(totalQty)} SL
                                        </Badge>
                                        <Select
                                            value={delivery.status || "NEW"}
                                            onValueChange={(status) =>
                                                changeStatus({ id: delivery.id, status })
                                            }
                                            disabled={isUpdating || isRowLocked}
                                        >
                                            <SelectTrigger className="h-9 w-[150px]">
                                                <SelectValue>
                                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DELIVERY_STATUSES.map((status) => (
                                                    <SelectItem
                                                        key={status.value}
                                                        value={status.value}
                                                        disabled={isRowLocked}
                                                    >
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setSelectedId(delivery.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {!isRowLocked && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setEditRow(delivery)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive"
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

            {isEditable && (
                <CreateDeliveryDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {editRow && (
                <UpdateDeliveryDialog
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

function ItemsTable({ items }: { items: any[] }) {
    if (!items.length) {
        return <div className="px-4 py-6 text-sm text-muted-foreground">Phiếu chưa có hàng.</div>
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="w-[140px] text-right">Số lượng</TableHead>
                        <TableHead className="w-[120px] text-right">Đơn vị</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={`${item.product_id}-${item.id ?? ""}`}>
                            <TableCell>
                                <div className="font-medium">{item.product?.code || "-"}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {item.product?.name || "-"}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatNumber(item.quantity)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {item.product?.unit || "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {text}
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
    return value.split("T")[0]
}
