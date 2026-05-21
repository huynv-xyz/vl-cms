import { useMemo, useState } from "react"
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
import { updateExportStatus } from "@/api/sale/export"
import { getStockLots } from "@/api/inventory/lot"

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

// Tồn kho khả dụng theo từng kho xuất của dòng phiếu xuất.
type StockData = {
    byWarehouse: Map<string, number>
}

export function OrderExports({ exports, order }: any) {
    const queryClient = useQueryClient()
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // Danh sách sản phẩm cần kiểm tra tồn kho (các phiếu xuất chưa hoàn thành).
    const stockProductIds = useMemo(() => {
        const ids = new Set<number>()
        for (const exportDoc of exports ?? []) {
            if (exportDoc?.status !== "NEW") continue
            for (const item of exportDoc.items ?? []) {
                if (item?.product_id) ids.add(item.product_id)
            }
        }
        return [...ids].sort((a, b) => a - b)
    }, [exports])

    const stockWarehouseIds = useMemo(() => {
        const ids = new Set<number>()
        for (const exportDoc of exports ?? []) {
            if (exportDoc?.status !== "NEW") continue
            for (const item of exportDoc.items ?? []) {
                if (item?.warehouse_id) ids.add(Number(item.warehouse_id))
            }
        }
        return [...ids].sort((a, b) => a - b)
    }, [exports])

    // Tra tồn kho theo kho trên từng dòng xuất. Không lấy tổng tất cả kho để tránh xác nhận nhầm.
    const stockQuery = useQuery({
        queryKey: ["export-stock-check", order?.id, stockProductIds, stockWarehouseIds],
        enabled: stockProductIds.length > 0 && stockWarehouseIds.length > 0,
        queryFn: async (): Promise<StockData> => {
            const byWarehouse = new Map<string, number>()

            for (const warehouseId of stockWarehouseIds) {
                const rows = await getStockLots({
                    warehouse_id: warehouseId,
                    product_ids: stockProductIds,
                })
                for (const row of rows) {
                    const qty = Number(row.quantity || 0)
                    byWarehouse.set(`${warehouseId}:${row.product_id}`, qty)
                }
            }

            return { byWarehouse }
        },
    })

    const stock = stockQuery.data

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

        onError: (_, __, context) => {
            queryClient.setQueryData(["order-detail", order.id], context?.prev)
            toast.error("Cập nhật thất bại")
        },

        onSuccess: () => toast.success("Cập nhật trạng thái thành công"),

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            queryClient.invalidateQueries({ queryKey: ["export-stock-check"] })
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

                <Badge variant="outline" className="font-normal">
                    {formatNumber(exports?.length || 0)} phiếu
                </Badge>
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
                            exportDoc.status === "DONE" || exportDoc.status === "CANCELLED"
                        const isStockChecking =
                            exportDoc.status === "NEW" &&
                            stockProductIds.length > 0 &&
                            (stockQuery.isLoading || stockQuery.isFetching)

                        const totalQty = sumBy(
                            exportDoc.items ?? [],
                            (item: any) => item.quantity
                        )

                        const shortageRows = (exportDoc.items ?? []).filter(
                            (item: any) => getShortage(item, exportDoc, stock) > 0
                        ).length
                        const missingWarehouseRows = (exportDoc.items ?? []).filter(
                            (item: any) => exportDoc.status === "NEW" && !item?.warehouse_id
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
                                                {formatDate(exportDoc.export_date)}
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
                                        {shortageRows > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1 font-normal"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Tồn kho không đủ ({shortageRows} dòng)
                                            </Badge>
                                        )}

                                        {missingWarehouseRows > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1 font-normal"
                                            >
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Chưa có kho xuất ({missingWarehouseRows} dòng)
                                            </Badge>
                                        )}

                                        {isStockChecking && (
                                            <Badge variant="secondary" className="font-normal">
                                                Đang kiểm tồn...
                                            </Badge>
                                        )}

                                        <Badge variant="outline" className="font-normal">
                                            {formatNumber(exportDoc.items?.length || 0)} dòng
                                        </Badge>

                                        <Badge variant="secondary" className="font-normal">
                                            SL: {formatNumber(totalQty)}
                                        </Badge>

                                        <Select
                                            value={exportDoc.status || "NEW"}
                                            onValueChange={(status) =>
                                                changeStatus({ id: exportDoc.id, status })
                                            }
                                            disabled={
                                                isPending ||
                                                isRowLocked ||
                                                isStockChecking ||
                                                missingWarehouseRows > 0 ||
                                                shortageRows > 0
                                            }
                                        >
                                            <SelectTrigger
                                                className="h-8 w-[150px]"
                                                title={
                                                    isStockChecking
                                                        ? "Đang kiểm tra tồn kho"
                                                        : missingWarehouseRows > 0
                                                        ? "Chưa có kho xuất — không thể chuyển trạng thái"
                                                        : shortageRows > 0
                                                        ? "Tồn kho không đủ — không thể chuyển trạng thái"
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
                                                        disabled={isRowLocked}
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

                                {(missingWarehouseRows > 0 || shortageRows > 0) && (
                                    <div className="flex items-center gap-1.5 border-b bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        {missingWarehouseRows > 0
                                            ? "Một số dòng chưa có kho xuất — không thể chuyển trạng thái cho tới khi chọn đủ kho."
                                            : "Tồn kho không đủ để hoàn thành phiếu xuất này — không thể chuyển trạng thái cho tới khi đủ hàng."}
                                    </div>
                                )}

                                <ItemsTable
                                    items={exportDoc.items ?? []}
                                    exportDoc={exportDoc}
                                    stock={stock}
                                    stockLoading={stockQuery.isLoading}
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
    stock,
    stockLoading,
}: {
    items: any[]
    exportDoc: any
    stock?: StockData
    stockLoading: boolean
}) {
    if (!items.length) {
        return (
            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Phiếu chưa có hàng xuất
            </div>
        )
    }

    const isNew = exportDoc?.status === "NEW"

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase">Sản phẩm</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Số lượng</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Tồn kho</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Đơn vị</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item) => {
                        const available = getAvailable(item, stock)
                        const shortage = getShortage(item, exportDoc, stock)
                        const isShort = shortage > 0
                        const missingWarehouse = isNew && !item?.warehouse_id

                        return (
                            <TableRow
                                key={item.id}
                                className={
                                    missingWarehouse || isShort
                                        ? "bg-rose-50/70 dark:bg-rose-950/20"
                                        : undefined
                                }
                            >
                                <TableCell>
                                    <div className="font-medium">{item.product?.name}</div>
                                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                        {item.product?.code}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                    {formatNumber(item.quantity)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {missingWarehouse ? (
                                        <span className="inline-flex items-center justify-end gap-1 font-medium text-rose-600 dark:text-rose-400">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Chưa có kho xuất
                                        </span>
                                    ) : available === undefined ? (
                                        <span className="text-muted-foreground">
                                            {isNew && stockLoading ? "Đang tải..." : "—"}
                                        </span>
                                    ) : isShort ? (
                                        <span className="inline-flex items-center justify-end gap-1 font-medium text-rose-600 dark:text-rose-400">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {formatNumber(available)}
                                            <span className="text-xs">
                                                (thiếu {formatNumber(shortage)})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatNumber(available)}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                    {item.product?.unit}
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

/**
 * Tồn kho khả dụng của 1 dòng xuất.
 * - Tồn kho lấy theo kho trên từng dòng xuất.
 * - Nếu dòng chưa có kho thì không kiểm tồn, để UI báo thiếu kho xuất.
 * Trả về undefined khi chưa có dữ liệu để so sánh.
 */
function getAvailable(
    item: any,
    stock?: StockData
): number | undefined {
    if (!item?.product_id || !stock) return undefined

    const warehouseId = item?.warehouse_id
    if (!warehouseId) return undefined

    return stock.byWarehouse.get(`${warehouseId}:${item.product_id}`) ?? 0
}

/**
 * Số lượng thiếu so với tồn kho (chỉ tính cho phiếu xuất chưa hoàn thành).
 */
function getShortage(
    item: any,
    exportDoc: any,
    stock?: StockData
): number {
    if (exportDoc?.status !== "NEW") return 0
    const available = getAvailable(item, stock)
    if (available === undefined) return 0
    const shortage = Number(item?.quantity || 0) - available
    return shortage > 0 ? shortage : 0
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
