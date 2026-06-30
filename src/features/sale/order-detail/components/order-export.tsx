import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertTriangle,
    CalendarDays,
    Eye,
    PackageCheck,
    Warehouse,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AsyncSelect } from "@/components/rjsf/async-select"
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

import { ExportDetailDialog } from "../../export/components/export-detail-dialog"
import { getMyPermissions } from "@/api/auth/permission"
import { updateExportItemWarehouse, updateExportStatus } from "@/api/sale/export"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { warehouseOption } from "@/lib/option-mapper"
import { formatCurrency } from "@/lib/utils"

const EXPORT_STATUSES = [
    { value: "NEW", label: "Mới" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
]

const exportStatusMeta: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
    NEW: { label: "Mới", variant: "secondary" },
    DONE: { label: "Hoàn thành", variant: "outline" },
    CANCELLED: { label: "Hủy", variant: "destructive" },
}

export function OrderExports({ exports, order }: any) {
    const queryClient = useQueryClient()
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const totalExportAmount = (exports ?? []).reduce(
        (sum: number, exportDoc: any) =>
            sum + sumExportAmount(exportDoc.items ?? [], order?.items ?? []),
        0
    )
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateStatus = permissions.some(
        (p: any) =>
            p.module === "sales.exports" &&
            (p.action === "status.update" || p.action === "update")
    )

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status }: any) => updateExportStatus(id, status),

        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({
                queryKey: ["order-detail", order.id],
            })

            const prev = queryClient.getQueryData(["order-detail", order.id])

            queryClient.setQueryData(["order-detail", order.id], (old: any) => {
                if (!old) return old
                return {
                    ...old,
                    exports: old.exports.map((x: any) =>
                        x.id === id ? { ...x, status } : x
                    ),
                }
            })

            return { prev }
        },

        onError: (error: any, __, context) => {
            queryClient.setQueryData(["order-detail", order.id], context?.prev)
            toast.error(error?.message || "Cập nhật thất bại")
        },

        onSuccess: () => toast.success("Cập nhật trạng thái thành công"),

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
    })

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                        <Warehouse className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Phiếu xuất kho</h2>
                        <p className="text-xs text-muted-foreground">
                            Các chứng từ xuất kho phát sinh từ đơn hàng này
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge variant="outline" className="font-normal">
                        Tổng tiền: <span className="ml-1 font-semibold">{formatCurrency(totalExportAmount)}</span>
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                    {formatNumber(exports?.length || 0)} phiếu
                </Badge>
                </div>
            </div>

            {!exports?.length ? (
                <EmptyState
                    icon={Warehouse}
                    title="Chưa có phiếu xuất kho"
                    desc="Phiếu xuất sẽ được sinh ra khi giao hàng được xác nhận."
                />
            ) : (
                <div className="space-y-3 p-4">
                    {exports.map((exportDoc: any) => {
                        const meta = getExportStatusMeta(exportDoc.status)
                        const isRowLocked =
                            exportDoc.status === "DONE"
                        const allowedNextStatuses =
                            exportDoc.status === "NEW"
                                ? ["DONE", "CANCELLED"]
                                : exportDoc.status === "CANCELLED"
                                  ? ["NEW"]
                                  : []

                        const totalQty = sumBy(
                            exportDoc.items ?? [],
                            (item: any) => item.quantity
                        )
                        const totalAmount = sumExportAmount(exportDoc.items ?? [], order?.items ?? [])

                        const missingWarehouseRows = (exportDoc.items ?? []).filter(
                            (item: any) => exportDoc.status === "NEW" && !item?.warehouse_id
                        ).length
                        const stockShortageRows = (exportDoc.items ?? []).filter(
                            (item: any) =>
                                exportDoc.status === "NEW" &&
                                item?.warehouse_id &&
                                Number(item?.available_quantity || 0) < Number(item?.quantity || 0)
                        ).length

                        return (
                            <div
                                key={exportDoc.id}
                                className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                                    <div className="min-w-0">
                                        <button
                                            className="font-semibold text-primary hover:underline"
                                            onClick={() => setSelectedId(exportDoc.id)}
                                        >
                                            {exportDoc.export_no}
                                        </button>

                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {exportDoc.export_date}
                                            </span>

                                            {exportDoc.delivery?.delivery_no && (
                                                <span className="flex items-center gap-1">
                                                    <PackageCheck className="h-3.5 w-3.5" />
                                                    {exportDoc.delivery.delivery_no}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {missingWarehouseRows > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1 font-normal"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Chưa có kho xuất ({missingWarehouseRows} dòng)
                                            </Badge>
                                        )}

                                        <Badge variant="outline" className="font-normal">
                                            {formatNumber(exportDoc.items?.length || 0)} dòng
                                        </Badge>

                                        <Badge variant="secondary" className="font-normal">
                                            SL: {formatNumber(totalQty)}
                                        </Badge>

                                        <Badge variant="secondary" className="font-normal">
                                            Thành tiền: {formatCurrency(totalAmount)}
                                        </Badge>

                                        <Select
                                            value={exportDoc.status || "NEW"}
                                            onValueChange={(status) =>
                                                changeStatus({ id: exportDoc.id, status })
                                            }
                                            disabled={
                                                isPending ||
                                                isRowLocked ||
                                                missingWarehouseRows > 0 ||
                                                stockShortageRows > 0 ||
                                                !canUpdateStatus
                                            }
                                        >
                                            <SelectTrigger
                                                className="h-8 w-[150px]"
                                                title={
                                                    missingWarehouseRows > 0
                                                        ? "Chưa có kho xuất — không thể chuyển trạng thái"
                                                        : stockShortageRows > 0
                                                            ? "Có dòng không đủ tồn trong kho xuất — không thể chuyển trạng thái"
                                                        : !canUpdateStatus
                                                            ? "Bạn không có quyền đổi trạng thái phiếu xuất"
                                                            : undefined
                                                }
                                            >
                                                <SelectValue>
                                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                                </SelectValue>
                                            </SelectTrigger>

                                            <SelectContent>
                                                {EXPORT_STATUSES.map((s) => (
                                                    <SelectItem
                                                        key={s.value}
                                                        value={s.value}
                                                        disabled={
                                                            s.value !== exportDoc.status &&
                                                            !allowedNextStatuses.includes(s.value)
                                                        }
                                                    >
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => setSelectedId(exportDoc.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {missingWarehouseRows > 0 && (
                                    <div className="flex items-center gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Một số dòng chưa có kho xuất — không thể chuyển trạng thái cho tới khi chọn đủ kho.
                                    </div>
                                )}
                                {stockShortageRows > 0 && (
                                    <div className="flex items-center gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Có {formatNumber(stockShortageRows)} dòng không đủ tồn trong kho xuất. Kiểm tra cột Tồn kho trước khi hoàn thành phiếu.
                                    </div>
                                )}

                                <ItemsTable
                                    items={exportDoc.items ?? []}
                                    exportDoc={exportDoc}
                                    order={order}
                                    orderId={order.id}
                                />
                            </div>
                        )
                    })}
                </div>
            )}

            <ExportDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        </div>
    )
}

function ItemsTable({
    items,
    exportDoc,
    order,
    orderId,
}: {
    items: any[]
    exportDoc: any
    order: any
    orderId: number
}) {
    const queryClient = useQueryClient()
    const { mutate: changeWarehouse, isPending } = useMutation({
        mutationFn: ({ itemId, warehouseId }: { itemId: number; warehouseId: number }) =>
            updateExportItemWarehouse(exportDoc.id, itemId, warehouseId),
        onSuccess: () => {
            toast.success("Đã cập nhật kho xuất")
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
        },
        onError: () => toast.error("Cập nhật kho xuất thất bại"),
    })

    if (!items.length) {
        return (
            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Phiếu chưa có hàng xuất
            </div>
        )
    }

    const isNew = exportDoc?.status === "NEW"
    const orderItemById = new Map<number, any>()
    const orderItemByProductId = new Map<number, any>()
    for (const orderItem of order?.items ?? []) {
        if (orderItem?.id != null) orderItemById.set(Number(orderItem.id), orderItem)
        if (orderItem?.product_id != null) orderItemByProductId.set(Number(orderItem.product_id), orderItem)
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[56px] text-center text-xs font-semibold uppercase">#</TableHead>
                        <TableHead className="min-w-[240px] text-xs font-semibold uppercase">Sản phẩm</TableHead>
                        <TableHead className="w-[120px] text-center text-xs font-semibold uppercase">ĐVT</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Chiết khấu</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Số lượng</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Tồn kho</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Đơn giá</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Thành tiền</TableHead>
                        <TableHead className="min-w-[220px] text-xs font-semibold uppercase">Kho xuất</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Lô hàng</TableHead>
                        <TableHead className="min-w-[220px] text-xs font-semibold uppercase">Ghi chú</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item, idx) => {
                        const missingWarehouse = isNew && !item?.warehouse_id
                        const quantity = Number(item.quantity || 0)
                        const availableQuantity = Number(item.available_quantity || 0)
                        const stockShortage = isNew && item?.warehouse_id && availableQuantity < quantity
                        const orderItem = resolveOrderItem(item, orderItemById, orderItemByProductId)
                        const unitPrice = resolveUnitPrice(orderItem)
                        const discount = resolveProratedDiscount(orderItem, quantity)
                        const amount = resolveExportItemAmount(item, orderItem, quantity, unitPrice, discount)

                        return (
                            <TableRow
                                key={item.id}
                                className={
                                    missingWarehouse
                                        ? "bg-rose-50/70 dark:bg-rose-950/20"
                                        : stockShortage
                                          ? "bg-amber-50/70 dark:bg-amber-950/20"
                                        : undefined
                                }
                            >
                                <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                                    {idx + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium leading-tight">{item.product?.name || "-"}</span>
                                        <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            {item.product?.code || "—"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-sm font-medium text-muted-foreground">
                                    {item.product?.unit || "-"}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                    {formatCurrency(discount)}
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                    {formatNumber(quantity)}
                                </TableCell>
                                <TableCell
                                    className={
                                        stockShortage
                                            ? "text-right font-semibold tabular-nums text-rose-600"
                                            : "text-right font-medium tabular-nums text-muted-foreground"
                                    }
                                >
                                    {item.warehouse_id ? formatNumber(availableQuantity) : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                    {formatCurrency(unitPrice)}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium tabular-nums">
                                    {formatCurrency(amount)}
                                </TableCell>
                                <TableCell>
                                    {missingWarehouse ? (
                                        <div className="space-y-1">
                                            <AsyncSelect
                                                className="h-8 min-h-8 bg-white py-0"
                                                placeholder="Chọn kho xuất"
                                                value={item.warehouse_id}
                                                disabled={isPending}
                                                onChange={(v: any) => {
                                                    if (v) {
                                                        changeWarehouse({
                                                            itemId: item.id,
                                                            warehouseId: Number(v),
                                                        })
                                                    }
                                                }}
                                                dataSource={{
                                                    getList: listWarehouses,
                                                    getById: getWarehouse,
                                                    params: { page: 1, size: 20 },
                                                }}
                                                mapOption={warehouseOption}
                                            />
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Chưa có kho xuất
                                            </span>
                                        </div>
                                    ) : isNew ? (
                                        <AsyncSelect
                                            className="h-8 min-h-8 bg-white py-0"
                                            placeholder="Chọn kho xuất"
                                            value={item.warehouse_id}
                                            disabled={isPending}
                                            onChange={(v: any) => {
                                                if (v) {
                                                    changeWarehouse({
                                                        itemId: item.id,
                                                        warehouseId: Number(v),
                                                    })
                                                }
                                            }}
                                            dataSource={{
                                                getList: listWarehouses,
                                                getById: getWarehouse,
                                                params: { page: 1, size: 20 },
                                            }}
                                            mapOption={warehouseOption}
                                        />
                                    ) : (
                                        <span className="text-sm">
                                            {item.warehouse?.code
                                                ? `${item.warehouse.code} - ${item.warehouse.name}`
                                                : item.warehouse?.name || "—"}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {item.lot_no || item.lot_nos || "—"}
                                </TableCell>
                                <TableCell>
                                    {item.note || orderItem?.note ? (
                                        <span
                                            className="block max-w-[260px] truncate text-sm text-muted-foreground"
                                            title={item.note || orderItem?.note}
                                        >
                                            {item.note || orderItem?.note}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
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

function getExportStatusMeta(status?: string) {
    return exportStatusMeta[String(status ?? "").toUpperCase()] ?? {
        label: status || "-",
        variant: "outline" as const,
    }
}

function sumBy(items: any[], fn: (item: any) => unknown) {
    return items.reduce((sum, item) => sum + Number(fn(item) || 0), 0)
}

function sumExportAmount(items: any[], orderItems: any[]) {
    const orderItemById = new Map<number, any>()
    const orderItemByProductId = new Map<number, any>()
    for (const orderItem of orderItems) {
        if (orderItem?.id != null) orderItemById.set(Number(orderItem.id), orderItem)
        if (orderItem?.product_id != null) orderItemByProductId.set(Number(orderItem.product_id), orderItem)
    }

    return items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0)
        const orderItem = resolveOrderItem(item, orderItemById, orderItemByProductId)
        const unitPrice = resolveUnitPrice(orderItem)
        const discount = resolveProratedDiscount(orderItem, quantity)
        return sum + resolveExportItemAmount(item, orderItem, quantity, unitPrice, discount)
    }, 0)
}

function resolveOrderItem(
    item: any,
    orderItemById: Map<number, any>,
    orderItemByProductId: Map<number, any>
) {
    const orderItemId = item?.order_item_id ?? item?.orderItemId
    if (orderItemId != null) {
        const orderItem = orderItemById.get(Number(orderItemId))
        if (orderItem) return orderItem
    }
    const productId = item?.product_id ?? item?.productId
    return productId != null ? orderItemByProductId.get(Number(productId)) : undefined
}

function resolveUnitPrice(orderItem?: any) {
    return Number(orderItem?.unit_price ?? orderItem?.unitPrice ?? 0)
}

function resolveProratedDiscount(orderItem: any, quantity: number) {
    const discount = Number(orderItem?.discount ?? 0)
    const orderQty = Number(orderItem?.quantity ?? 0)
    if (!discount || !orderQty || orderQty <= 0) return 0
    return discount * Number(quantity || 0) / orderQty
}

function resolveExportItemAmount(item: any, orderItem: any, quantity: number, unitPrice: number, discount: number) {
    const lineType =
        item?.line_type ??
        item?.lineType ??
        item?.order_item?.line_type ??
        item?.order_item?.lineType ??
        item?.orderItem?.line_type ??
        item?.orderItem?.lineType ??
        orderItem?.line_type ??
        orderItem?.lineType
    if (lineType === "PROMOTION") return 0
    return Math.max(quantity * unitPrice - Number(discount || 0), 0)
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(value || 0))
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
