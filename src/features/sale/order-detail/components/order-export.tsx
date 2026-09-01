import { useEffect, useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertTriangle,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Clock,
    Eye,
    Loader2,
    MoreHorizontal,
    Pencil,
    PackageCheck,
    SlidersHorizontal,
    Warehouse,
} from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import type { DocumentPostingTimeChangeResult } from "@/api/inventory/ledger"
import { getAvailableLotsAt } from "@/api/inventory/lot"
import {
    applyExportPostingDateTimeChange,
    checkExportPostingDateTimeChange,
    checkExportInventory,
    type ExportInventoryCheckResult,
    updateExportItemLot,
    updateExportItemWarehouse,
    updateExportStatus,
    updateExportTime,
} from "@/api/sale/export"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
    const [correctionExport, setCorrectionExport] = useState<any | null>(null)
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
    const canUseCorrections = permissions.some(
        (permission: any) =>
            permission.module === "inventory.ledgers" &&
            permission.action === "correction.change"
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

    const inventoryCheckQueries = useQueries({
        queries: (exports ?? []).map((exportDoc: any) => {
            const exportTime = exportTimes[exportDoc.id]
                ?? normalizeTimeForInput(exportDoc.export_time)
                ?? currentTimeForInput()
            const itemSignature = (exportDoc.items ?? []).map((item: any) => [
                item.id,
                item.product_id,
                item.warehouse_id,
                item.lot_code,
                item.quantity,
                summarizeLotSelection(item),
            ])
            return {
                queryKey: ["export-inventory-check", exportDoc.id, exportTime, itemSignature],
                enabled: exportDoc.status === "NEW" && Boolean(exportDoc.id && exportTime),
                queryFn: () => checkExportInventory(exportDoc.id, exportTime),
                staleTime: 5_000,
            }
        }),
    })

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
            queryClient.invalidateQueries({ queryKey: ["export-inventory-check"] })
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
            queryClient.invalidateQueries({ queryKey: ["export-inventory-check"] })
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
                    {exports.map((exportDoc: any, exportIndex: number) => {
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
                        const inventoryCheck = inventoryCheckQueries[exportIndex]?.data as ExportInventoryCheckResult | undefined
                        const inventoryCheckLoading = Boolean(inventoryCheckQueries[exportIndex]?.isLoading)
                        const historyInvalid = exportDoc.status === "NEW" && inventoryCheck?.valid === false
                        const statusDisabledReason =
                            missingWarehouseRows > 0
                                ? "Chưa có kho xuất, không thể chuyển trạng thái"
                                : historyInvalid
                                    ? inventoryCheck?.message
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
                                                  historyInvalid ||
                                                  inventoryCheckLoading ||
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

                                        {canUseCorrections && exportDoc.status === "DONE" ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 px-2.5">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        Sửa sai
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-72">
                                                    <DropdownMenuLabel>Thao tác sửa sai</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => setCorrectionExport(exportDoc)}>
                                                        <CalendarClock className="h-4 w-4" />
                                                        <div className="min-w-0">
                                                            <div className="font-medium">Đổi ngày/giờ chứng từ</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Kiểm tra lịch sử tồn trước khi cập nhật.
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : null}

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
                                {historyInvalid && (
                                    <div className="flex items-start gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>{inventoryCheck?.message}</span>
                                    </div>
                                )}
                                     <ItemsTable
                                         items={exportDoc.items ?? []}
                                         exportDoc={exportDoc}
                                         exportTime={exportTime}
                                          order={order}
                                     orderId={order.id}
                                     physicalWarehouseId={physicalWarehouseId}
                                      canUpdateExport={canUpdateStatus}
                                      inventoryCheck={inventoryCheck}
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
            <ExportPostingDateTimeCorrectionDialog
                exportDoc={correctionExport}
                order={order}
                open={Boolean(correctionExport)}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) setCorrectionExport(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["order-detail", order?.id] })
                    queryClient.invalidateQueries({ queryKey: ["exports"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory"] })
                }}
            />
        </div>
    )
}

function ExportPostingDateTimeCorrectionDialog({
    exportDoc,
    order,
    open,
    onOpenChange,
    onChanged,
}: {
    exportDoc: any | null
    order: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const initialDate = normalizeDateParam(exportDoc?.export_date) || currentLocalDateForInput()
    const initialTime = normalizeTimeForInput(exportDoc?.export_time) || currentTimeForInput()
    const [newDate, setNewDate] = useState(initialDate)
    const [newTime, setNewTime] = useState(initialTime)
    const [result, setResult] = useState<DocumentPostingTimeChangeResult | null>(null)
    const [requestError, setRequestError] = useState("")

    useEffect(() => {
        if (!open || !exportDoc) return
        setNewDate(normalizeDateParam(exportDoc.export_date) || currentLocalDateForInput())
        setNewTime(normalizeTimeForInput(exportDoc.export_time) || currentTimeForInput())
        setResult(null)
        setRequestError("")
    }, [open, exportDoc?.id, exportDoc?.export_date, exportDoc?.export_time])

    const normalizedTime = normalizeTimeForApi(newTime)
    const orderDate = normalizeDateParam(order?.order_date)
    const currentDate = normalizeDateParam(exportDoc?.export_date)
    const currentTime = normalizeTimeForInput(exportDoc?.export_time)
    const changed = Boolean(
        newDate && normalizedTime &&
        (newDate !== currentDate || normalizedTime !== currentTime)
    )
    const checkedForCurrentInput = Boolean(
        result && result.new_posting_date === newDate &&
        normalizeTimeForInput(result.new_posting_time || undefined) === normalizedTime
    )

    const checkMutation = useMutation({
        mutationFn: () => checkExportPostingDateTimeChange(Number(exportDoc.id), newDate, normalizedTime),
        onSuccess: (data) => {
            setResult(data)
            setRequestError("")
        },
        onError: (error) => {
            setResult(null)
            setRequestError(readRequestError(error))
        },
    })
    const applyMutation = useMutation({
        mutationFn: () => applyExportPostingDateTimeChange(Number(exportDoc.id), newDate, normalizedTime),
        onSuccess: (data) => {
            setResult(data)
            setRequestError("")
            onChanged()
        },
        onError: (error) => {
            setResult(null)
            setRequestError(readRequestError(error))
        },
    })

    if (!exportDoc) return null

    const busy = checkMutation.isPending || applyMutation.isPending
    const dateInvalid = Boolean(orderDate && newDate && newDate < orderDate)
    const futureDate = Boolean(newDate && newDate > currentLocalDateForInput())
    const inputInvalid = !newDate || !normalizedTime || dateInvalid || futureDate
    const errors = result?.errors ?? []
    const warnings = result?.warnings ?? []

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
            <DialogContent className="flex max-h-[92vh] !w-[min(1180px,calc(100vw-32px))] !max-w-none flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CalendarClock className="h-5 w-5 text-teal-600" />
                        Đổi ngày/giờ chứng từ xuất kho
                    </DialogTitle>
                    <DialogDescription>
                        Kiểm tra toàn bộ lịch sử tồn kho trước khi cập nhật phiếu xuất và phiếu giao liên quan.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    <div className="grid gap-3 rounded-md border bg-muted/20 p-4 md:grid-cols-4">
                        <InfoValue label="Phiếu xuất" value={result?.export_no || exportDoc.export_no || exportDoc.code || `#${exportDoc.id}`} />
                        <InfoValue label="Đơn hàng" value={result?.order_no || order?.order_no || order?.code || "-"} />
                        <InfoValue label="Phiếu giao" value={result?.delivery_no || exportDoc.delivery_no || "-"} />
                        <InfoValue label="Trạng thái" value={exportDoc.status || "-"} />
                        <InfoValue label="Thời điểm hiện tại" value={formatDateTime(currentDate, currentTime)} />
                        <div className="space-y-1.5 md:col-span-2">
                            <span className="text-xs text-muted-foreground">Thời điểm mới</span>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    type="date"
                                    value={newDate}
                                    min={orderDate}
                                    max={currentLocalDateForInput()}
                                    disabled={busy || result?.applied}
                                    onChange={(event) => {
                                        setNewDate(event.target.value)
                                        setResult(null)
                                        setRequestError("")
                                    }}
                                />
                                <Input
                                    type="time"
                                    step={1}
                                    value={newTime}
                                    disabled={busy || result?.applied}
                                    onChange={(event) => {
                                        setNewTime(event.target.value)
                                        setResult(null)
                                        setRequestError("")
                                    }}
                                />
                            </div>
                            {dateInvalid ? <p className="text-xs text-red-600">Ngày mới không được trước ngày đặt hàng {formatDate(orderDate)}.</p> : null}
                            {futureDate ? <p className="text-xs text-red-600">Ngày mới không được lớn hơn ngày hiện tại.</p> : null}
                        </div>
                    </div>

                    {requestError ? (
                        <ResultPanel tone="error" title="Không thể xử lý" description={requestError} />
                    ) : result ? (
                        <ResultPanel
                            tone={result.applied || result.valid ? "success" : "error"}
                            title={result.applied ? "Đã đổi ngày/giờ chứng từ" : result.valid ? "Kiểm tra hợp lệ" : "Không thể đổi ngày/giờ"}
                            description={result.applied
                                ? "Phiếu xuất, phiếu giao và toàn bộ dòng sổ kho liên quan đã được cập nhật trong cùng một giao dịch."
                                : result.valid
                                    ? "Lịch sử tồn kho vẫn hợp lệ. Có thể thực hiện đổi ngày/giờ."
                                    : "Dữ liệu chưa được thay đổi. Xem nguyên nhân bên dưới."}
                        />
                    ) : null}

                    {errors.length ? <MessageList title="Lỗi kiểm tra" items={errors} tone="error" /> : null}
                    {warnings.length ? <MessageList title="Lưu ý" items={warnings} tone="warning" /> : null}

                    <div className="overflow-hidden rounded-md border">
                        <div className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">Các dòng sổ kho bị ảnh hưởng</div>
                        <div className="overflow-x-auto">
                            <Table className="min-w-[940px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14 text-center">STT</TableHead>
                                        <TableHead>Mã hàng</TableHead>
                                        <TableHead>Tên hàng</TableHead>
                                        <TableHead>Kho</TableHead>
                                        <TableHead>Số lô</TableHead>
                                        <TableHead className="text-right">Số lượng</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(result?.lines?.length ? result.lines : exportDoc.items ?? []).map((line: any, index: number) => (
                                        <TableRow key={line.ledger_id ?? line.id ?? index}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{line.product_code || line.product?.code || "-"}</TableCell>
                                            <TableCell>{line.product_name || line.product?.name || "-"}</TableCell>
                                            <TableCell>
                                                <div>{line.warehouse_name || line.warehouse?.name || "-"}</div>
                                                <div className="text-xs text-muted-foreground">{line.warehouse_code || line.warehouse?.code || ""}</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{line.lot_no || line.lot_code || "-"}</TableCell>
                                            <TableCell className="text-right font-medium">{formatNumber(line.quantity)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Đóng</Button>
                    <Button variant="outline" disabled={busy || inputInvalid || !changed || result?.applied} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        disabled={busy || inputInvalid || !changed || !checkedForCurrentInput || !result?.valid || result?.applied}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi ngày/giờ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InfoValue({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="truncate font-medium" title={String(value ?? "-")}>{String(value ?? "-")}</div>
        </div>
    )
}

function ResultPanel({ tone, title, description }: { tone: "success" | "error"; title: string; description: string }) {
    const success = tone === "success"
    return (
        <div className={success
            ? "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
            : "rounded-md border border-red-200 bg-red-50 p-4 text-red-800"}
        >
            <div className="flex items-start gap-2">
                {success ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="mt-0.5 text-sm">{description}</div>
                </div>
            </div>
        </div>
    )
}

function MessageList({ title, items, tone }: { title: string; items: string[]; tone: "error" | "warning" }) {
    const error = tone === "error"
    return (
        <div className={error
            ? "rounded-md border border-red-200 bg-red-50 p-4 text-red-800"
            : "rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800"}
        >
            <div className="font-semibold">{title}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ul>
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
    canUpdateExport,
    inventoryCheck,
}: {
    items: any[]
    exportDoc: any
    exportTime?: string
    order: any
    orderId: number
    physicalWarehouseId?: number
    canUpdateExport: boolean
    inventoryCheck?: ExportInventoryCheckResult
}) {
    const queryClient = useQueryClient()
    const { mutate: changeWarehouse, isPending } = useMutation({
        mutationFn: ({ itemId, warehouseId }: { itemId: number; warehouseId: number }) =>
            updateExportItemWarehouse(exportDoc.id, itemId, warehouseId),
        onSuccess: () => {
            toast.success("Đã cập nhật kho xuất")
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["export-inventory-check"] })
        },
        onError: () => toast.error("Cập nhật kho xuất thất bại"),
    })
    const { mutate: changeLot, isPending: isChangingLot } = useMutation({
        mutationFn: ({
            itemId,
            lotCode,
            allocations,
        }: {
            itemId: number
            lotCode?: string
            allocations?: LotAllocationPayload[]
        }) => updateExportItemLot(exportDoc.id, itemId, lotCode, allocations),
        onSuccess: (_res, variables) => {
            toast.success("Đã cập nhật lô xuất")
            updateExportItemLotInCache(queryClient, orderId, exportDoc.id, variables.itemId, variables.lotCode, variables.allocations)
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId], refetchType: "inactive" })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["export-inventory-check"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-ledgers"] })
        },
        onError: (error: any) => toast.error(error?.message || "Cập nhật lô xuất thất bại"),
    })

    const isNew = exportDoc?.status === "NEW"
    const canEditExport = isNew && canUpdateExport
    const postingDate = normalizeDateParam(exportDoc?.export_date) ?? new Date().toISOString().slice(0, 10)
    const postingTime = normalizeTimeForInput(exportTime)
    const payloadExportTime = normalizeTimeForInput(exportDoc?.export_time)
    const canUsePayloadAvailability = !payloadExportTime || payloadExportTime === postingTime
    const availabilityQueries = useQueries({
        queries: items.map((item) => {
            const productId = resolveItemProductId(item)
            const warehouseId = resolveItemWarehouseId(item)
            const hasCustomAllocations = hasLotAllocations(item)
            return ({
            queryKey: [
                "export-item-availability",
                exportDoc.id,
                item.id,
                productId,
                warehouseId,
                postingDate,
                postingTime,
                hasCustomAllocations,
            ],
            enabled: Boolean((isNew || hasCustomAllocations) && productId && warehouseId && postingTime),
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
                        const canEditDoneCustom = false
                        const missingWarehouse = isNew && !warehouseId
                        const quantity = Number(item.quantity || 0)
                        const availableQuantity = getLiveAvailableQuantity(item, idx)
                        const availabilityData = availabilityQueries[idx]?.data
                        const rawAvailableLots = canUsePayloadAvailability && Array.isArray(item?.available_lots)
                            ? item.available_lots
                            : availabilityData
                                ? getPagedItems(availabilityData)
                                : undefined
                        const availableLots = mergeLotAllocationOptions(item, rawAvailableLots)
                        const lotsLoading = Boolean(availabilityQueries[idx]?.isLoading && !availabilityData)
                        const stockShortage = isNew && warehouseId && availableQuantity < quantity
                        const historyIssue = Boolean(
                            isNew &&
                            inventoryCheck?.valid === false &&
                            (!inventoryCheck.product_id || Number(inventoryCheck.product_id) === Number(productId)) &&
                            (!inventoryCheck.warehouse_id || Number(inventoryCheck.warehouse_id) === Number(warehouseId))
                        )
                        const orderItem = resolveOrderItem(item, orderItemById, orderItemByProductId)
                        const unitPrice = resolveUnitPrice(orderItem)
                        const discount = resolveProratedDiscount(orderItem, quantity)
                        const amount = resolveExportItemAmount(item, orderItem, quantity, unitPrice, discount)

                        return (
                            <TableRow
                                key={item.id}
                                className={
                                    missingWarehouse || historyIssue
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
                                <TableCell className={stockShortage || historyIssue ? "text-right font-semibold tabular-nums text-rose-600" : "text-right font-medium tabular-nums text-muted-foreground"}>
                                    {warehouseId ? formatNumber(availableQuantity) : "-"}
                                </TableCell>
                                <TableCell className="text-center">
                                    {warehouseId ? (
                                        <span
                                            className={`inline-flex items-center gap-1 text-xs font-medium ${stockShortage || historyIssue ? "text-rose-600" : "text-emerald-600"}`}
                                            title={historyIssue ? inventoryCheck?.message : undefined}
                                        >
                                            {stockShortage || historyIssue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            {historyIssue ? "Làm âm lịch sử" : stockShortage ? "Vượt tồn" : "Đạt tồn"}
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
                                    {canEditExport ? (
                                        <div className="space-y-1">
                                            <AsyncSelect
                                                className="h-9 min-h-9 items-center bg-white px-3 py-0 [&>span]:truncate"
                                                placeholder="Chọn kho xuất"
                                                searchPlaceholder="Tìm kho"
                                                value={warehouseId}
                                                disabled={isPending || !canUpdateExport}
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
                                        isNew={canEditExport}
                                        canEditDoneCustom={canEditDoneCustom}
                                        disabled={isChangingLot || !(canEditExport || canEditDoneCustom) || !warehouseId || !productId}
                                        onChange={(lotCode, allocations) => changeLot({ itemId: item.id, lotCode, allocations })}
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
    canEditDoneCustom,
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
    canEditDoneCustom?: boolean
    disabled?: boolean
    onChange: (lotCode?: string, allocations?: LotAllocationPayload[]) => void
}) {
    const [customOpen, setCustomOpen] = useState(false)
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
    const allocations = getLotAllocations(item)
    const hasCustomAllocations = allocations.length > 0
    const selected = hasCustomAllocations
        ? "CUSTOM"
        : lotCode && lots.some((lot: any) => lot?.lot_no === lotCode)
            ? lotCode
            : "AUTO"

    if (!isNew) {
        if (canEditDoneCustom && hasCustomAllocations) {
            return (
                <>
                    <button
                        type="button"
                        className="block max-w-[240px] truncate text-left text-sm text-teal-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => setCustomOpen(true)}
                        disabled={disabled}
                        title={summarizeLotSelection(item)}
                    >
                        {summarizeLotSelection(item) || "Tùy chọn"}
                    </button>
                    <CustomLotAllocationDialog
                        open={customOpen}
                        onOpenChange={setCustomOpen}
                        item={item}
                        lots={lots}
                        lotsLoading={Boolean(lotsLoading || isLoading)}
                        onSave={(nextAllocations) => {
                            onChange(undefined, nextAllocations)
                            setCustomOpen(false)
                        }}
                    />
                </>
            )
        }
        return <span className="text-sm text-muted-foreground">{summarizeLotSelection(item) || "Auto"}</span>
    }

    return (
        <>
            <Select
                value={selected}
                disabled={disabled}
                onValueChange={(value) => {
                    if (value === "CUSTOM") {
                        setCustomOpen(true)
                        return
                    }
                    onChange(value === "AUTO" ? undefined : value, undefined)
                }}
            >
                <SelectTrigger className="h-8 min-w-[220px]" title={hasCustomAllocations ? summarizeLotSelection(item) : undefined}>
                    {hasCustomAllocations ? (
                        <span className="truncate text-left text-teal-700">Tùy chọn</span>
                    ) : (
                        <SelectValue placeholder="Auto" />
                    )}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AUTO" textValue="Auto">
                        <span className="inline-flex items-center gap-1.5">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Auto
                        </span>
                    </SelectItem>
                    <SelectItem value="CUSTOM" textValue="Tùy chọn">
                        <span className="inline-flex items-center gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Tùy chọn
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
            {hasCustomAllocations ? (
                <button
                    type="button"
                    className="mt-1 block max-w-[220px] truncate text-left text-xs text-teal-700 hover:underline"
                    onClick={() => setCustomOpen(true)}
                    disabled={disabled}
                    title={summarizeLotSelection(item)}
                >
                    {summarizeLotSelection(item)}
                </button>
            ) : null}
            <CustomLotAllocationDialog
                open={customOpen}
                onOpenChange={setCustomOpen}
                item={item}
                lots={lots}
                lotsLoading={Boolean(lotsLoading || isLoading)}
                onSave={(nextAllocations) => {
                    onChange(undefined, nextAllocations)
                    setCustomOpen(false)
                }}
            />
        </>
    )
}

type LotAllocationPayload = {
    lot_id?: number
    lot_code?: string
    quantity: number
}

function CustomLotAllocationDialog({
    open,
    onOpenChange,
    item,
    lots,
    lotsLoading,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: any
    lots: any[]
    lotsLoading?: boolean
    onSave: (allocations: LotAllocationPayload[]) => void
}) {
    const requiredQuantity = Number(item?.quantity || 0)
    const [quantities, setQuantities] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!open) return
        const next: Record<string, string> = {}
        for (const allocation of getLotAllocations(item)) {
            const key = allocationKey({
                id: allocation?.lot_id,
                lot_no: allocation?.lot_code,
            })
            if (key) next[key] = String(allocation?.quantity ?? "")
        }
        setQuantities(next)
    }, [open, item?.id, item?.lot_allocations])

    const total = Object.values(quantities).reduce((sum, value) => sum + Number(value || 0), 0)
    const diff = requiredQuantity - total
    const validTotal = sameNumber(total, requiredQuantity)
    const selectedRows = lots
        .map((lot) => ({ lot, quantity: Number(quantities[allocationKey(lot)] || 0) }))
        .filter((row) => row.quantity > 0)
    const hasInvalidRow = selectedRows.some(({ lot, quantity }) => quantity > Number(resolveLotRemaining(lot)))
    const canSave = validTotal && !hasInvalidRow && selectedRows.length > 0

    const updateQuantity = (lot: any, value: string) => {
        const key = allocationKey(lot)
        if (!key) return
        setQuantities((current) => ({
            ...current,
            [key]: value,
        }))
    }

    const clearAll = () => setQuantities({})

    const autoAllocate = () => {
        let remaining = roundQuantity(requiredQuantity)
        const next: Record<string, string> = {}

        const candidates = lots
            .map((lot) => ({
                lot,
                key: allocationKey(lot),
                available: Math.max(Number(resolveLotRemaining(lot) || 0), 0),
                quantity: 0,
            }))
            .filter((row) => row.key && row.available > 0)

        let active = candidates
        while (remaining > 0.000001 && active.length > 0) {
            const share = remaining / active.length
            const nextActive: typeof candidates = []
            let used = 0

            for (const row of active) {
                const room = row.available - row.quantity
                const take = Math.min(room, share)
                if (take > 0) {
                    row.quantity = roundQuantity(row.quantity + take)
                    used += take
                }
                if (row.available - row.quantity > 0.000001) {
                    nextActive.push(row)
                }
            }

            if (used <= 0) break
            remaining = roundQuantity(remaining - used)
            active = nextActive
        }

        if (remaining > 0.000001 && candidates.length > 0) {
            const last = candidates[candidates.length - 1]
            const room = last.available - last.quantity
            const take = Math.min(room, remaining)
            if (take > 0) {
                last.quantity = roundQuantity(last.quantity + take)
            }
        }

        let allocated = roundQuantity(candidates.reduce((sum, row) => sum + row.quantity, 0))
        let diff = roundQuantity(requiredQuantity - allocated)
        if (Math.abs(diff) > 0.000001) {
            const target = diff > 0
                ? [...candidates].reverse().find((row) => row.available - row.quantity >= diff - 0.000001)
                : [...candidates].reverse().find((row) => row.quantity + diff >= -0.000001)
            if (target) {
                target.quantity = roundQuantity(target.quantity + diff)
                allocated = roundQuantity(candidates.reduce((sum, row) => sum + row.quantity, 0))
                diff = roundQuantity(requiredQuantity - allocated)
            }
        }

        for (const row of candidates) {
            if (row.quantity > 0) next[row.key] = String(row.quantity)
        }

        setQuantities(next)
    }

    const handleSave = () => {
        if (!canSave) return
        onSave(selectedRows.map(({ lot, quantity }) => ({
            lot_id: lot?.lot_id ?? lot?.id,
            lot_code: lot?.lot_no,
            quantity,
        })))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Phân bổ lô xuất</DialogTitle>
                    <DialogDescription>
                        Nhập số lượng muốn xuất theo từng lô. Tổng phân bổ phải bằng số lượng dòng xuất.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    <div>
                        Cần xuất <span className="font-semibold tabular-nums">{formatNumber(requiredQuantity)}</span>
                    </div>
                    <div>
                        Đã phân bổ <span className={validTotal ? "font-semibold text-emerald-600 tabular-nums" : "font-semibold text-rose-600 tabular-nums"}>
                            {formatNumber(total)}
                        </span>
                    </div>
                    <div className={sameNumber(diff, 0) ? "text-muted-foreground" : "font-medium text-rose-600"}>
                        Chênh {formatNumber(diff)}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={autoAllocate} disabled={lotsLoading || !lots.length}>
                        Tự phân bổ
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                        Xóa hết
                    </Button>
                </div>

                <div className="max-h-[420px] overflow-auto rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                                <TableHead>Lô hàng</TableHead>
                                <TableHead className="text-right">Tồn khả dụng</TableHead>
                                <TableHead className="text-right">Số lượng xuất</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lotsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                        Đang tải lô hàng...
                                    </TableCell>
                                </TableRow>
                            ) : lots.length ? (
                                lots.map((lot) => {
                                    const key = allocationKey(lot)
                                    const quantity = Number(quantities[key] || 0)
                                    const available = Number(resolveLotRemaining(lot) || 0)
                                    const invalid = quantity > available
                                    return (
                                        <TableRow key={key}>
                                            <TableCell>
                                                <div className="font-mono text-sm">{lot?.lot_no || "-"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {lot?.expiry_date ? `HSD ${formatDateOnly(lot.expiry_date)}` : "Không có HSD"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(available)}</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={available}
                                                    step="0.001"
                                                    value={quantities[key] ?? ""}
                                                    onChange={(event) => updateQuantity(lot, event.target.value)}
                                                    className={invalid ? "ml-auto h-8 w-36 border-rose-400 text-right tabular-nums" : "ml-auto h-8 w-36 text-right tabular-nums"}
                                                />
                                                {invalid ? (
                                                    <div className="mt-1 text-xs text-rose-600">Vượt tồn lô</div>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                        Không có lô còn tồn tại kho xuất.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={!canSave}>
                        Áp dụng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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

function getLotAllocations(item: any) {
    if (Array.isArray(item?.lot_allocations)) return item.lot_allocations
    return []
}

function hasLotAllocations(item: any) {
    return getLotAllocations(item).length > 0
}

function mergeLotAllocationOptions(item: any, lots?: any[]) {
    const allocations = getLotAllocations(item)
    const result = new Map<string, any>()

    for (const lot of lots ?? []) {
        const key = allocationKey(lot)
        if (!key) continue
        result.set(key, { ...lot })
    }

    for (const allocation of allocations) {
        const key = allocationKey({
            id: allocation?.lot_id,
            lot_no: allocation?.lot_code,
        })
        if (!key) continue

        const current = result.get(key)
        const allocatedQuantity = Number(allocation?.quantity || 0)
        const allocationLotId = allocation?.lot_id
        const allocationLotCode = allocation?.lot_code
        if (current) {
            const availableAfterUnpost = Number(resolveLotRemaining(current) || 0) + allocatedQuantity
            result.set(key, {
                ...current,
                closing_quantity: availableAfterUnpost,
                available_quantity: availableAfterUnpost,
            })
        } else {
            result.set(key, {
                id: allocationLotId,
                lot_id: allocationLotId,
                lot_no: allocationLotCode,
                lot_code: allocationLotCode,
                product_id: item?.product_id ?? item?.product?.id,
                warehouse_id: item?.warehouse_id ?? item?.warehouse?.id,
                closing_quantity: allocatedQuantity,
                available_quantity: allocatedQuantity,
            })
        }
    }

    return Array.from(result.values())
}

function allocationKey(lot: any) {
    const id = lot?.lot_id ?? lot?.id
    const lotNo = lot?.lot_no ?? lot?.lot_code
    return id != null ? `id:${id}` : `code:${lotNo || ""}`
}

function sameNumber(a: number, b: number) {
    return Math.abs(Number(a || 0) - Number(b || 0)) < 0.000001
}

function roundQuantity(value: number) {
    return Math.round(Number(value || 0) * 1000) / 1000
}

function formatDateOnly(value?: string | null) {
    if (!value) return "-"
    const [date] = String(value).split(/[T ]/)
    const [year, month, day] = date.split("-")
    if (!year || !month || !day) return String(value)
    return `${day}/${month}/${year}`
}

function summarizeLotSelection(item: any) {
    const allocations = getLotAllocations(item)
    if (allocations.length) {
        return allocations
            .map((allocation: any) => `${allocation?.lot_code || "-"}: ${formatNumber(Number(allocation?.quantity || 0))}`)
            .join(", ")
    }
    return item?.lot_code || item?.lot_no || item?.lot_nos || ""
}

function updateExportItemLotInCache(
    queryClient: any,
    orderId: number,
    exportId: number,
    itemId: number,
    lotCode?: string,
    allocations?: LotAllocationPayload[]
) {
    const updateOrderDetail = (current: any) => {
        const wrapped = current?.data ? current : null
        const order = wrapped ? current.data : current
        if (!order?.exports) return current

        const nextOrder = {
            ...order,
            exports: order.exports.map((exportDoc: any) => {
                if (Number(exportDoc?.id) !== Number(exportId)) return exportDoc
                return {
                    ...exportDoc,
                    items: (exportDoc.items ?? []).map((item: any) => {
                        if (Number(item?.id) !== Number(itemId)) return item
                        const nextAllocations = Array.isArray(allocations)
                            ? allocations.map((allocation) => ({
                                    lot_id: allocation.lot_id,
                                    lot_code: allocation.lot_code,
                                    quantity: allocation.quantity,
                                }))
                            : []
                        return {
                            ...item,
                            lot_code: nextAllocations.length ? null : lotCode ?? null,
                            lot_allocations: nextAllocations,
                            lot_selection_mode: nextAllocations.length ? "CUSTOM" : lotCode ? "SINGLE" : "AUTO",
                        }
                    }),
                }
            }),
        }

        return wrapped ? { ...current, data: nextOrder } : nextOrder
    }

    queryClient.setQueryData(["order-detail", orderId], updateOrderDetail)
    queryClient.setQueriesData({ queryKey: ["order-detail"] }, updateOrderDetail)
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
    const [rawDate] = String(value).trim().split("T")
    if (!rawDate) return undefined

    const isoMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`
    }

    const displayMatch = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (displayMatch) {
        return `${displayMatch[3]}-${displayMatch[2].padStart(2, "0")}-${displayMatch[1].padStart(2, "0")}`
    }

    return undefined
}

function currentLocalDateForInput() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function normalizeTimeForApi(value?: string) {
    return normalizeTimeForInput(value) || ""
}

function formatDateTime(date?: string, time?: string) {
    if (!date) return "-"
    const normalizedTime = normalizeTimeForInput(time)
    return normalizedTime ? `${formatDate(date)} ${normalizedTime}` : formatDate(date)
}

function readRequestError(error: unknown) {
    if (error instanceof Error && error.message) return error.message
    if (typeof error === "string") return error
    return "Không thể xử lý yêu cầu."
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
