import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { correctReturnUnitPrices, getReturn } from "@/api/sale/return"
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
import type { Return, ReturnItem } from "../data/schema"

type Props = {
    open: boolean
    returnData: Return | null
    onOpenChange: (open: boolean) => void
}

type RowState = {
    return_item_id: number
    unit_price: number
}

export function ReturnUnitPriceCorrectionDialog({ open, returnData, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [rows, setRows] = useState<RowState[]>([])

    const query = useQuery({
        queryKey: ["return-detail", returnData?.id],
        queryFn: () => getReturn(Number(returnData?.id)),
        enabled: open && !!returnData?.id,
    })

    const data = (query.data ?? returnData) as Return | null
    const items = useMemo(() => data?.items ?? [], [data])

    useEffect(() => {
        if (!open) return
        setRows(
            items
                .filter((item) => item.id != null)
                .map((item) => ({
                    return_item_id: Number(item.id),
                    unit_price: Number(item.unit_price ?? 0),
                }))
        )
    }, [open, items])

    const rowMap = useMemo(
        () => new Map(rows.map((row) => [row.return_item_id, row])),
        [rows]
    )

    const totalOld = useMemo(
        () => items.reduce((sum, item) => sum + lineAmount(item, Number(item.unit_price ?? 0)), 0),
        [items]
    )

    const totalNew = useMemo(
        () => items.reduce((sum, item) => {
            const row = rowMap.get(Number(item.id))
            return sum + lineAmount(item, Number(row?.unit_price ?? item.unit_price ?? 0))
        }, 0),
        [items, rowMap]
    )

    const hasInvalidPrice = rows.some((row) => !Number.isFinite(row.unit_price) || row.unit_price < 0)

    const mutation = useMutation({
        mutationFn: () => correctReturnUnitPrices(Number(data?.id), rows),
        onSuccess: async (result: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["returns"] }),
                queryClient.invalidateQueries({ queryKey: ["return-detail", data?.id] }),
                queryClient.invalidateQueries({ queryKey: ["ar-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] }),
                queryClient.invalidateQueries({ queryKey: ["sales-transactions"] }),
            ])
            toast.success(`Đã sửa giá phiếu trả. Chênh lệch: ${formatCurrency(Number(result?.ar_delta ?? 0))}`)
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không thể sửa giá phiếu trả")
        },
    })

    const updateRow = (returnItemId: number, unitPrice: number) => {
        setRows((prev) =>
            prev.map((row) =>
                row.return_item_id === returnItemId
                    ? { ...row, unit_price: unitPrice }
                    : row
            )
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[94vw] max-w-[1180px] overflow-hidden p-0 sm:max-w-[94vw]">
                <DialogHeader className="border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        Sửa giá phiếu trả
                        <span className="font-mono text-sm text-primary">{data?.return_no}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-3">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                        <Summary label="Tổng cũ" value={formatCurrency(totalOld)} />
                        <Summary label="Tổng mới" value={formatCurrency(totalNew)} />
                        <Summary label="Chênh lệch" value={formatCurrency(totalNew - totalOld)} />
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[980px]">
                            <TableHeader>
                                <TableRow className="bg-muted/70">
                                    <TableHead className="w-[56px] text-center">#</TableHead>
                                    <TableHead className="min-w-[150px]">Mã SP</TableHead>
                                    <TableHead className="min-w-[320px]">Tên sản phẩm</TableHead>
                                    <TableHead className="w-[130px] text-right">Số lượng</TableHead>
                                    <TableHead className="w-[150px] text-right">Đơn giá cũ</TableHead>
                                    <TableHead className="w-[170px] text-right">Đơn giá mới</TableHead>
                                    <TableHead className="w-[160px] text-right">Thành tiền mới</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => {
                                    const row = rowMap.get(Number(item.id))
                                    const nextPrice = Number(row?.unit_price ?? item.unit_price ?? 0)
                                    return (
                                        <TableRow key={item.id ?? index}>
                                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.product?.code ?? "-"}</TableCell>
                                            <TableCell className="font-medium">{item.product?.name ?? "-"}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(Number(item.quantity || 0))}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(Number(item.unit_price || 0))}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="text-right"
                                                    value={nextPrice}
                                                    onChange={(event) =>
                                                        updateRow(Number(item.id), Number(event.target.value || 0))
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums">
                                                {formatCurrency(lineAmount(item, nextPrice))}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="border-t px-5 py-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        className="gap-2"
                        disabled={query.isLoading || mutation.isPending || !rows.length || hasInvalidPrice}
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

function lineAmount(item: ReturnItem, unitPrice: number) {
    return Math.max(Number(item.quantity || 0) * Number(unitPrice || 0), 0)
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 text-right text-lg font-bold tabular-nums">{value}</div>
        </div>
    )
}
