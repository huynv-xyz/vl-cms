import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Save } from "lucide-react"
import { toast } from "sonner"

import { adjustOrderQuantity, checkOrderQuantityAdjustment } from "@/api/sale/order"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/utils"

type Props = {
    open: boolean
    order: any
    onOpenChange: (open: boolean) => void
}

type RowState = {
    order_item_id: number
    quantity: string
}

export function OrderQuantityAdjustmentDialog({ open, order, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [rows, setRows] = useState<RowState[]>([])
    const [report, setReport] = useState<any>(null)
    const [checkReport, setCheckReport] = useState<any>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const [errorData, setErrorData] = useState<any>(null)

    const items = useMemo(() => order?.items ?? [], [order])

    useEffect(() => {
        if (!open) return
        setRows(
            items
                .filter((item: any) => item.id != null)
                .map((item: any) => ({
                    order_item_id: Number(item.id),
                    quantity: String(item.quantity ?? 0),
                }))
        )
        setReport(null)
        setCheckReport(null)
        setErrorMessage("")
        setErrorData(null)
    }, [open, items])

    const rowMap = useMemo(
        () => new Map(rows.map((row) => [row.order_item_id, row])),
        [rows]
    )

    const parseQuantity = (value: unknown) => {
        const text = String(value ?? "").trim()
        if (!text || text === ".") return 0
        return Number(text)
    }

    const changedRows = useMemo(
        () =>
            rows
                .map((row) => ({
                    order_item_id: row.order_item_id,
                    quantity: parseQuantity(row.quantity),
                }))
                .filter((row) => {
                const item = items.find((x: any) => Number(x.id) === row.order_item_id)
                return item && Number(item.quantity || 0) !== Number(row.quantity || 0)
            }),
        [items, rows]
    )

    const mutation = useMutation({
        mutationFn: () => adjustOrderQuantity(Number(order.id), changedRows),
        onSuccess: async (res: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] }),
                queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
                queryClient.invalidateQueries({ queryKey: ["exports"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] }),
                queryClient.invalidateQueries({ queryKey: ["sales-transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["inventory-ledgers"] }),
            ])
            setReport(res ?? {})
            setErrorMessage("")
            setErrorData(null)
            toast.success("Đã sửa số lượng và tái tính dữ liệu liên quan")
        },
        onError: (error: any) => {
            const message =
                error?.data?.message ||
                error?.response?.data?.message ||
                error?.message ||
                "Không thể sửa số lượng"
            setReport(null)
            setErrorMessage(message)
            setErrorData(error?.data ?? error?.response?.data?.data ?? null)
            toast.error(message)
        },
    })

    const checkMutation = useMutation({
        mutationFn: () => checkOrderQuantityAdjustment(Number(order.id), changedRows),
        onSuccess: async (res: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] }),
                queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
                queryClient.invalidateQueries({ queryKey: ["exports"] }),
            ])
            setCheckReport(res ?? {})
            setReport(null)
            setErrorMessage("")
            setErrorData(null)
            toast.success("Kiểm tra an toàn đạt")
        },
        onError: (error: any) => {
            const message =
                error?.data?.message ||
                error?.response?.data?.message ||
                error?.message ||
                "Kiểm tra an toàn không đạt"
            setCheckReport(null)
            setReport(null)
            setErrorMessage(message)
            setErrorData(error?.data ?? error?.response?.data?.data ?? null)
            toast.error(message)
        },
    })

    const totalOld = items.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity || 0)
        const price = Number(item.unit_price || 0)
        const discount = Number(item.discount || 0)
        const isPromotion = item.line_type === "PROMOTION"
        return sum + (isPromotion ? 0 : Math.max(quantity * price - discount, 0))
    }, 0)

    const totalNew = items.reduce((sum: number, item: any) => {
        const row = rowMap.get(Number(item.id))
        const quantity = parseQuantity(row?.quantity ?? item.quantity ?? 0)
        const price = Number(item.unit_price || 0)
        const discount = Number(item.discount || 0)
        const isPromotion = item.line_type === "PROMOTION"
        return sum + (isPromotion ? 0 : Math.max(quantity * price - discount, 0))
    }, 0)

    const updateRow = (orderItemId: number, quantity: string) => {
        setRows((prev) =>
            prev.map((row) =>
                row.order_item_id === orderItemId ? { ...row, quantity } : row
            )
        )
        setReport(null)
        setCheckReport(null)
        setErrorMessage("")
        setErrorData(null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-[1500px] overflow-hidden p-0 sm:max-w-[96vw]">
                <DialogHeader className="border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2">
                        Sửa số lượng sau hoàn thành
                        <span className="font-mono text-sm text-primary">{order?.order_no}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[72vh] space-y-3 overflow-y-auto px-5 py-3">
                    <div className="grid gap-3 text-sm md:grid-cols-4">
                        <Summary label="Tổng cũ" value={formatCurrency(totalOld)} />
                        <Summary label="Tổng mới" value={formatCurrency(totalNew)} />
                        <Summary label="Chênh lệch" value={formatCurrency(totalNew - totalOld)} />
                        <Summary label="Dòng thay đổi" value={`${changedRows.length}`} />
                    </div>

                    {errorMessage && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <div className="font-semibold">Không thể xử lý, toàn bộ dữ liệu đã rollback.</div>
                                <div>{errorMessage}</div>
                                {errorData?.product_code && (
                                    <div className="mt-1 font-medium">
                                        Dòng lỗi: {errorData.product_code}
                                        {errorData.product_name ? ` - ${errorData.product_name}` : ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {checkReport && !report && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                            <div className="font-semibold">Kiểm tra an toàn đạt.</div>
                            <div className="mt-1 grid gap-1 md:grid-cols-3">
                                <span>Phiếu xuất tác động: {checkReport.affected_exports ?? checkReport.affectedExports ?? 0}</span>
                                <span>Chênh lệch tổng đơn: {formatCurrency(Number(checkReport.order_total_delta ?? checkReport.orderTotalDelta ?? 0))}</span>
                                <span>Đã kiểm tra tồn kho theo thời gian</span>
                            </div>
                        </div>
                    )}

                    {report && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            <div className="font-semibold">Đã xử lý thành công.</div>
                            <div className="mt-1 grid gap-1 md:grid-cols-3">
                                <span>Dòng đơn: {report.updated_order_items ?? report.updatedOrderItems ?? 0}</span>
                                <span>Phiếu xuất tái ghi kho: {report.rebuilt_inventory_vouchers ?? report.rebuiltInventoryVouchers ?? 0}</span>
                                <span>Chênh lệch công nợ: {formatCurrency(Number(report.ar_delta ?? report.arDelta ?? 0))}</span>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[1280px]">
                            <TableHeader>
                                <TableRow className="bg-muted/70">
                                    <TableHead className="w-[56px] text-center">#</TableHead>
                                    <TableHead className="min-w-[150px]">Mã SP</TableHead>
                                    <TableHead className="min-w-[300px]">Tên sản phẩm</TableHead>
                                    <TableHead className="w-[110px] text-right">SL cũ</TableHead>
                                    <TableHead className="w-[150px] text-right">SL mới</TableHead>
                                    <TableHead className="w-[130px] text-right">SL đã xuất</TableHead>
                                    <TableHead className="w-[130px] text-right">SL đã trả</TableHead>
                                    <TableHead className="w-[140px] text-right">Đơn giá</TableHead>
                                    <TableHead className="w-[140px] text-right">CK</TableHead>
                                    <TableHead className="w-[160px] text-right">Thành tiền mới</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item: any, index: number) => {
                                    const row = rowMap.get(Number(item.id))
                                    const quantity = parseQuantity(row?.quantity ?? item.quantity ?? 0)
                                    const price = Number(item.unit_price || 0)
                                    const discount = Number(item.discount || 0)
                                    const isPromotion = item.line_type === "PROMOTION"
                                    const amount = isPromotion ? 0 : Math.max(quantity * price - discount, 0)
                                    const productId = item.product?.id ?? item.product_id
                                    const productCode = item.product?.code ?? item.product_code
                                    const hasError =
                                        (errorData?.order_item_id != null && Number(errorData.order_item_id) === Number(item.id)) ||
                                        (errorData?.product_id != null && Number(errorData.product_id) === Number(productId)) ||
                                        (errorData?.product_code && String(errorData.product_code) === String(productCode))
                                    return (
                                        <TableRow
                                            key={item.id ?? index}
                                            className={hasError ? "bg-red-50 ring-1 ring-inset ring-red-300" : ""}
                                        >
                                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.product?.code ?? item.product_code ?? "-"}</TableCell>
                                            <TableCell className="font-medium">{item.product?.name ?? item.product_name ?? "-"}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.quantity || 0)}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="text-right"
                                                    value={row?.quantity ?? "0"}
                                                    onChange={(event) => {
                                                        const value = event.target.value
                                                        if (/^\d*(\.\d*)?$/.test(value)) {
                                                            updateRow(Number(item.id), value)
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.exported_quantity || 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.returned_quantity || 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(price)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(discount)}</TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(amount)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="border-t px-5 py-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={checkMutation.isPending || mutation.isPending || !changedRows.length}
                        onClick={() => checkMutation.mutate()}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Kiểm tra an toàn
                    </Button>
                    <Button
                        className="gap-2"
                        disabled={mutation.isPending || checkMutation.isPending || !changedRows.length || !checkReport}
                        onClick={() => mutation.mutate()}
                    >
                        <Save className="h-4 w-4" />
                        Lưu & tái tính
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 text-right text-lg font-bold tabular-nums">{value}</div>
        </div>
    )
}
