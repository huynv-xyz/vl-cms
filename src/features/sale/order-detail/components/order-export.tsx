import { useEffect, useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Eye,
    Pencil,
    PackageCheck,
    SlidersHorizontal,
    Warehouse,
} from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import { getAvailableLotsAt } from "@/api/inventory/lot"
import { updateExportItemLot, updateExportItemWarehouse, updateExportStatus, updateExportTime } from "@/api/sale/export"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
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
import { formatCurrency } from "@/lib/utils"
import { ExportDetailDialog } from "../../export/components/export-detail-dialog"

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
    const [exportTimes, setExportTimes] = useState<Record<number, string>>({})
    const [draftExportTimes, setDraftExportTimes] = useState<Record<number, string>>({})
    const [editingExportTimeId, setEditingExportTimeId] = useState<number | null>(null)
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
        (permission: any) =>
            permission.module === "sales.exports" &&
            (permission.action === "status.update" || permission.action === "update")
    )
    useEffect(() => {
        setExportTimes((prev) => {
            const next = { ...prev }
            let changed = false
            for (const exportDoc of exports ?? []) {
                if (!exportDoc?.id || next[exportDoc.id]) continue
                next[exportDoc.id] = normalizeTimeForInput(exportDoc.export_time) ?? currentTimeForInput()
                changed = true
            }
            return changed ? next : prev
        })
    }, [exports])

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status, exportTime }: any) => updateExportStatus(id, status, exportTime),
        onMutate: async ({ id, status, exportTime }) => {
            await queryClient.cancelQueries({ queryKey: ["order-detail", order.id] })
            const prev = queryClient.getQueryData(["order-detail", order.id])

            queryClient.setQueryData(["order-detail", order.id], (old: any) => {
                if (!old) return old
                return {
                    ...old,
                    exports: old.exports.map((item: any) =>
                        item.id === id ? { ...item, status, export_time: exportTime ?? item.export_time } : item
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

    const { mutate: saveExportTime, isPending: isSavingExportTime } = useMutation({
        mutationFn: ({ id, exportTime }: { id: number; exportTime: string }) =>
            updateExportTime(id, exportTime),
        onSuccess: (_data, variables) => {
            setExportTimes((prev) => ({ ...prev, [variables.id]: variables.exportTime }))
            setDraftExportTimes((prev) => ({ ...prev, [variables.id]: variables.exportTime }))
            setEditingExportTimeId(null)
            toast.success("Đã áp dụng giờ xuất")
        },
        onError: (error: any) => toast.error(error?.message || "Cập nhật giờ xuất thất bại"),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["export-item-lots"] })
            queryClient.invalidateQueries({ queryKey: ["export-item-availability"] })
        },
    })

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
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
                        const isRowLocked = exportDoc.status === "DONE"
                        const allowedNextStatuses =
                            exportDoc.status === "NEW"
                                ? ["DONE", "CANCELLED"]
                                : exportDoc.status === "CANCELLED"
                                    ? ["NEW"]
                                    : []
                        const totalQty = sumBy(exportDoc.items ?? [], (item: any) => item.quantity)
                        const totalAmount = sumExportAmount(exportDoc.items ?? [], order?.items ?? [])
                        const physicalWarehouseLabel = resolvePhysicalWarehouseLabel(exportDoc.items ?? [])
                        const physicalWarehouseId = resolveSinglePhysicalWarehouseId(exportDoc.items ?? [])
                        const exportTime = exportTimes[exportDoc.id] ?? normalizeTimeForInput(exportDoc.export_time) ?? currentTimeForInput()
                        const draftExportTime = draftExportTimes[exportDoc.id] ?? exportTime
                        const isEditingExportTime = editingExportTimeId === exportDoc.id
                        const missingWarehouseRows = (exportDoc.items ?? []).filter(
                            (item: any) => exportDoc.status === "NEW" && !item?.warehouse_id
                        ).length
                        const stockShortageRows = (exportDoc.items ?? []).filter((item: any) => {
                            if (exportDoc.status !== "NEW" || !item?.warehouse_id) return false
                            const quantity = Number(item?.quantity || 0)
                            return getPayloadAvailableQuantity(item) < quantity
                        }).length
                        const statusDisabledReason =
                            missingWarehouseRows > 0
                                ? "Chưa có kho xuất, không thể chuyển trạng thái"
                                : stockShortageRows > 0
                                    ? "Không đủ tồn kho, không thể chuyển Hoàn thành"
                                    : !canUpdateStatus
                                        ? "Bạn không có quyền đổi trạng thái phiếu xuất"
                                        : undefined

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
                                                 {formatDate(exportDoc.export_date)}
                                             </span>
                                             <span className="flex items-center gap-1">
                                                 <Clock className="h-3.5 w-3.5" />
                                                  {exportDoc.status === "NEW" ? (
                                                      <span className="flex items-center gap-1.5">
                                                          {isEditingExportTime ? (
                                                              <>
                                                                  <input
                                                                      type="time"
                                                                      step="1"
                                                                      value={draftExportTime}
                                                                      disabled={isSavingExportTime || !canUpdateStatus}
                                                                      className="h-7 rounded-md border bg-background px-2 text-xs text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                                                      onChange={(event) =>
                                                                          setDraftExportTimes((prev) => ({
                                                                              ...prev,
                                                                              [exportDoc.id]: event.target.value,
                                                                          }))
                                                                      }
                                                                  />
                                                                  <Button
                                                                      type="button"
                                                                      size="sm"
                                                                      variant="outline"
                                                                      className="h-7 px-2 text-xs"
                                                                      disabled={isSavingExportTime || !canUpdateStatus || !draftExportTime}
                                                                      onClick={() => saveExportTime({ id: exportDoc.id, exportTime: draftExportTime })}
                                                                  >
                                                                      Áp dụng
                                                                  </Button>
                                                              </>
                                                          ) : (
                                                              <>
                                                                  <span className="font-medium text-foreground">{exportTime}</span>
                                                                  <Button
                                                                      type="button"
                                                                      size="icon"
                                                                      variant="ghost"
                                                                      className="h-6 w-6"
                                                                      disabled={!canUpdateStatus}
                                                                      title="Đổi giờ xuất"
                                                                      onClick={() => {
                                                                          setDraftExportTimes((prev) => ({ ...prev, [exportDoc.id]: exportTime }))
                                                                          setEditingExportTimeId(exportDoc.id)
                                                                      }}
                                                                  >
                                                                      <Pencil className="h-3.5 w-3.5" />
                                                                  </Button>
                                                              </>
                                                          )}
                                                      </span>
                                                  ) : (
                                                      <span>{normalizeTimeForInput(exportDoc.export_time) || "-"}</span>
                                                  )}
                                             </span>
                                            {exportDoc.delivery?.delivery_no && (
                                                <span className="flex items-center gap-1">
                                                    <PackageCheck className="h-3.5 w-3.5" />
                                                    {exportDoc.delivery.delivery_no}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Warehouse className="h-3.5 w-3.5" />
                                                Xuất tại: {physicalWarehouseLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {missingWarehouseRows > 0 && (
                                            <Badge variant="destructive" className="gap-1 font-normal">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Chưa có kho xuất ({missingWarehouseRows} dòng)
                                            </Badge>
                                        )}
                                        {stockShortageRows > 0 && (
                                            <Badge variant="destructive" className="gap-1 font-normal">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Thiếu tồn ({stockShortageRows} dòng)
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
                                             onValueChange={(status) => changeStatus({ id: exportDoc.id, status, exportTime })}
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
                                                title={statusDisabledReason}
                                            >
                                                <SelectValue>
                                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPORT_STATUSES.map((status) => (
                                                    <SelectItem
                                                        key={status.value}
                                                        value={status.value}
                                                        disabled={
                                                            status.value !== exportDoc.status &&
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
                                            onClick={() => setSelectedId(exportDoc.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {missingWarehouseRows > 0 && (
                                    <div className="flex items-center gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Một số dòng chưa có kho xuất, không thể chuyển trạng thái cho tới khi chọn đủ kho.
                                    </div>
                                )}
                                     <ItemsTable
                                         items={exportDoc.items ?? []}
                                         exportDoc={exportDoc}
                                         exportTime={exportTime}
                                         order={order}
                                    orderId={order.id}
                                    physicalWarehouseId={physicalWarehouseId}
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
    exportTime,
    order,
    orderId,
    physicalWarehouseId,
}: {
    items: any[]
    exportDoc: any
    exportTime?: string
    order: any
    orderId: number
    physicalWarehouseId?: number
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
    const { mutate: changeLot, isPending: isChangingLot } = useMutation({
        mutationFn: ({ itemId, lotCode }: { itemId: number; lotCode?: string }) =>
            updateExportItemLot(exportDoc.id, itemId, lotCode),
        onSuccess: () => {
            toast.success("Đã cập nhật lô xuất")
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
        },
        onError: () => toast.error("Cập nhật lô xuất thất bại"),
    })

    const isNew = exportDoc?.status === "NEW"
    const postingDate = normalizeDateParam(exportDoc?.export_date) ?? new Date().toISOString().slice(0, 10)
    const postingTime = normalizeTimeForInput(exportTime)
    const payloadExportTime = normalizeTimeForInput(exportDoc?.export_time)
    const canUsePayloadAvailability = !payloadExportTime || payloadExportTime === postingTime
    const availabilityQueries = useQueries({
        queries: items.map((item) => {
            const productId = resolveItemProductId(item)
            const warehouseId = resolveItemWarehouseId(item)
            return ({
            queryKey: [
                "export-item-availability",
                exportDoc.id,
                item.id,
                productId,
                warehouseId,
                postingDate,
                postingTime,
            ],
            enabled: Boolean(isNew && productId && warehouseId && postingTime),
            queryFn: () =>
                getAvailableLotsAt({
                    product_id: Number(productId),
                    warehouse_id: Number(warehouseId),
                    posting_date: postingDate,
                    posting_time: postingTime,
                }),
            staleTime: 15_000,
            })
        }),
    })
    const orderItemById = new Map<number, any>()
    const orderItemByProductId = new Map<number, any>()
    for (const orderItem of order?.items ?? []) {
        if (orderItem?.id != null) orderItemById.set(Number(orderItem.id), orderItem)
        if (orderItem?.product_id != null) orderItemByProductId.set(Number(orderItem.product_id), orderItem)
    }
    const getLiveAvailableQuantity = (item: any, index: number) => {
        const productId = resolveItemProductId(item)
        const warehouseId = resolveItemWarehouseId(item)
        if (!isNew || !warehouseId || !productId) {
            return Number(item?.available_quantity || 0)
        }
        if (canUsePayloadAvailability && Array.isArray(item?.available_lots)) {
            return sumBy(item.available_lots, resolveLotRemaining)
        }
        const query = availabilityQueries[index]
        if (!query || query.isError || (query.isLoading && !query.data)) {
            return Number(item?.available_quantity || 0)
        }
        return sumBy(getPagedItems(query.data), resolveLotRemaining)
    }
    const stockShortageRows = items.filter((item, index) => {
        const quantity = Number(item?.quantity || 0)
        const availableQuantity = getLiveAvailableQuantity(item, index)
        return isNew && resolveItemWarehouseId(item) && availableQuantity < quantity
    }).length

    if (!items.length) {
        return (
            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Phiếu chưa có hàng xuất
            </div>
        )
    }

    return (
        <div>
            {stockShortageRows > 0 && (
                <div className="flex items-center gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Có {formatNumber(stockShortageRows)} dòng không đủ tồn trong kho xuất theo giờ xuất đang áp dụng.
                </div>
            )}
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[56px] text-center text-xs font-semibold uppercase">#</TableHead>
                        <TableHead className="min-w-[260px] text-xs font-semibold uppercase">Sản phẩm</TableHead>
                        <TableHead className="w-[120px] text-center text-xs font-semibold uppercase">ĐVT</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Chiết khấu</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Số lượng</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Tồn kho</TableHead>
                        <TableHead className="w-[130px] text-center text-xs font-semibold uppercase">Cảnh báo</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Đơn giá</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Thành tiền</TableHead>
                        <TableHead className="min-w-[240px] text-xs font-semibold uppercase">Kho xuất</TableHead>
                        <TableHead className="min-w-[180px] text-xs font-semibold uppercase">Lô hàng</TableHead>
                        <TableHead className="min-w-[220px] text-xs font-semibold uppercase">Ghi chú</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item, idx) => {
                        const productId = resolveItemProductId(item)
                        const warehouseId = resolveItemWarehouseId(item)
                        const lotCode = resolveItemLotCode(item)
                        const missingWarehouse = isNew && !warehouseId
                        const quantity = Number(item.quantity || 0)
                        const availableQuantity = getLiveAvailableQuantity(item, idx)
                        const availabilityData = availabilityQueries[idx]?.data
                        const availableLots = canUsePayloadAvailability && Array.isArray(item?.available_lots)
                            ? item.available_lots
                            : availabilityData
                                ? getPagedItems(availabilityData)
                                : undefined
                        const lotsLoading = Boolean(availabilityQueries[idx]?.isLoading && !availabilityData)
                        const stockShortage = isNew && warehouseId && availableQuantity < quantity
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
                                            {item.product?.code || "-"}
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
                                <TableCell className={stockShortage ? "text-right font-semibold tabular-nums text-rose-600" : "text-right font-medium tabular-nums text-muted-foreground"}>
                                    {warehouseId ? formatNumber(availableQuantity) : "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                    {warehouseId ? (
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${stockShortage ? "text-rose-600" : "text-emerald-600"}`}>
                                            {stockShortage ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {stockShortage ? "Vượt tồn" : "Đạt tồn"}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                    {formatCurrency(unitPrice)}
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium tabular-nums">
                                    {formatCurrency(amount)}
                                </TableCell>
                                <TableCell>
                                    {isNew ? (
                                        <div className="space-y-1">
                                            <AsyncSelect
                                                className="h-9 min-h-9 items-center bg-white px-3 py-0 [&>span]:truncate"
                                                placeholder="Chọn kho xuất"
                                                searchPlaceholder="Tìm kho"
                                                value={warehouseId}
                                                disabled={isPending}
                                                onChange={(value: any) => {
                                                    if (value) {
                                                        changeWarehouse({
                                                            itemId: item.id,
                                                            warehouseId: Number(value),
                                                        })
                                                    }
                                                }}
                                                dataSource={{
                                                    getList: listWarehouses,
                                                    getById: getWarehouse,
                                                    params: {
                                                        page: 1,
                                                        size: 20,
                                                        ...(physicalWarehouseId ? { physical_warehouse_id: physicalWarehouseId } : {}),
                                                    },
                                                }}
                                                mapOption={warehouseNameOption}
                                                popoverContentClassName="w-[360px]"
                                            />
                                            {missingWarehouse && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    Chưa có kho xuất
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm">
                                            {item.warehouse?.name || item.warehouse?.code || "-"}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ExportLotSelector
                                        item={item}
                                        productId={productId}
                                        warehouseId={warehouseId}
                                        lotCode={lotCode}
                                        exportDate={exportDoc.export_date}
                                        exportTime={exportTime}
                                        availableLots={availableLots}
                                        lotsLoading={lotsLoading}
                                        isNew={isNew}
                                        disabled={isChangingLot || !warehouseId || !productId}
                                        onChange={(lotCode) => changeLot({ itemId: item.id, lotCode })}
                                    />
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
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            </div>
        </div>
    )
}

function ExportLotSelector({
    item,
    productId,
    warehouseId,
    lotCode,
    exportDate,
    exportTime,
    availableLots,
    lotsLoading,
    isNew,
    disabled,
    onChange,
}: {
    item: any
    productId?: number
    warehouseId?: number
    lotCode?: string
    exportDate?: string
    exportTime?: string
    availableLots?: any[]
    lotsLoading?: boolean
    isNew: boolean
    disabled?: boolean
    onChange: (lotCode?: string) => void
}) {
    const hasParentLots = availableLots !== undefined
    const { data, isLoading } = useQuery({
        queryKey: ["export-item-lots", productId, warehouseId, normalizeDateParam(exportDate), normalizeTimeForInput(exportTime), lotCode],
        enabled: Boolean(isNew && productId && warehouseId && !hasParentLots),
        queryFn: () =>
            getAvailableLotsAt({
                product_id: Number(productId),
                warehouse_id: Number(warehouseId),
                posting_date: normalizeDateParam(exportDate) ?? new Date().toISOString().slice(0, 10),
                posting_time: normalizeTimeForInput(exportTime),
            }),
        staleTime: 30_000,
    })
    const lots = hasParentLots ? availableLots ?? [] : getPagedItems(data)
    const selected = lotCode && lots.some((lot: any) => lot?.lot_no === lotCode) ? lotCode : "AUTO"

    if (!isNew) {
        return <span className="text-sm text-muted-foreground">{lotCode || item.lot_no || item.lot_nos || "Auto"}</span>
    }

    return (
        <Select
            value={selected}
            disabled={disabled}
            onValueChange={(value) => onChange(value === "AUTO" ? undefined : value)}
        >
            <SelectTrigger className="h-8 min-w-[220px]">
                <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="AUTO" textValue="Auto">
                    <span className="inline-flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Auto
                    </span>
                </SelectItem>
                {(lotsLoading || isLoading) && <SelectItem value="LOADING" disabled>Đang tải...</SelectItem>}
                {lots.map((lot: any) => {
                    const lotNo = lot?.lot_no ? String(lot.lot_no) : ""
                    if (!lotNo) return null
                    return (
                        <SelectItem key={`${lot.id}-${lotNo}`} value={lotNo} textValue={lotNo}>
                            {lotNo} - còn {formatNumber(resolveLotRemaining(lot))}
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
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

function getPayloadAvailableQuantity(item: any) {
    if (Array.isArray(item?.available_lots)) {
        return sumBy(item.available_lots, resolveLotRemaining)
    }
    return Number(item?.available_quantity || 0)
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

function resolvePhysicalWarehouseLabel(items: any[]) {
    const physicals = items
        .map((item) => item?.warehouse?.physical_warehouse)
        .filter(Boolean)
    const ids = Array.from(new Set(physicals.map((warehouse: any) => warehouse.id).filter(Boolean)))

    if (!ids.length) return "Chưa chọn địa điểm kho"
    if (ids.length > 1) return "Nhiều địa điểm kho"

    return physicals[0]?.name || `Địa điểm kho #${ids[0]}`
}

function resolveSinglePhysicalWarehouseId(items: any[]) {
    const ids = Array.from(
        new Set(
            items
                .map((item) => item?.warehouse?.physical_warehouse?.id ?? item?.warehouse?.physical_warehouse_id)
                .filter(Boolean)
                .map(Number)
        )
    )
    return ids.length === 1 ? ids[0] : undefined
}

function warehouseNameOption(warehouse: any) {
    if (!warehouse) return null
    return {
        value: warehouse.id,
        label: warehouse.name || warehouse.code || `#${warehouse.id}`,
        raw: warehouse,
    }
}

function resolveLotRemaining(lot: any) {
    return lot?.closing_quantity ?? lot?.quantity_remaining ?? lot?.total_quantity ?? 0
}

function resolveItemProductId(item: any) {
    const value = item?.product_id ?? item?.productId ?? item?.product?.id
    return value != null ? Number(value) : undefined
}

function resolveItemWarehouseId(item: any) {
    const value = item?.warehouse_id ?? item?.warehouseId ?? item?.warehouse?.id
    return value != null ? Number(value) : undefined
}

function resolveItemLotCode(item: any) {
    return item?.lot_code
}

function normalizeDateParam(value?: string) {
    if (!value) return undefined
    const [date] = value.split("T")
    return date || undefined
}

function normalizeTimeForInput(value?: string) {
    if (!value) return undefined
    const rawTime = value.includes("T") ? value.split("T")[1] : value
    if (!rawTime) return undefined
    const time = rawTime.split(/[.+-]/)[0]
    if (!time) return undefined
    const parts = time.split(":")
    if (parts.length >= 3) return `${parts[0]}:${parts[1]}:${parts[2]}`
    if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`
    return undefined
}

function currentTimeForInput() {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, "0")
    const mm = String(now.getMinutes()).padStart(2, "0")
    const ss = String(now.getSeconds()).padStart(2, "0")
    return `${hh}:${mm}:${ss}`
}

function getPagedItems(data: any) {
    if (Array.isArray(data)) return data
    return data?.items ?? data?.data?.items ?? []
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
