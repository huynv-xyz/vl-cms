import { calculateOrderAmounts, getInclusiveUnitPrice, getPriceBasis, toPreVatInputPrice, type PriceBasis } from "../data/order-money"
import { PriceBasisSelect } from "./price-basis-select"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save } from "lucide-react"

import { adjustOrderPrice } from "@/api/sale/order"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    unit_price: number
    price_basis: PriceBasis
    unit_price_including_vat?: number
    discount: number
    vat_code?: string
}

export function OrderPriceAdjustmentDialog({ open, order, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [rows, setRows] = useState<RowState[]>([])

    const items = useMemo(() => order?.items ?? [], [order])

    useEffect(() => {
        if (!open) return
        setRows(
            items
                .filter((item: any) => item.id != null)
                .map((item: any) => ({
                    order_item_id: Number(item.id),
                    unit_price: Number(item.unit_price || 0),
                    price_basis: getPriceBasis(item),
                    unit_price_including_vat: item.unit_price_including_vat ?? undefined,
                    discount: Number(item.discount || 0),
                    vat_code: item.vat_code ?? undefined,
                }))
        )
    }, [open, items])

    const rowMap = useMemo(
        () => new Map(rows.map((row) => [row.order_item_id, row])),
        [rows]
    )

    const mutation = useMutation({
        mutationFn: () => adjustOrderPrice(Number(order.id), rows),
        onSuccess: async (res: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["order-detail"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-summary"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] }),
                queryClient.invalidateQueries({ queryKey: ["ar-ledgers-totals"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }),
            ])
            const data = res ?? {}
            toast.success(
                `Đã sửa giá. Chênh lệch công nợ: ${formatCurrency(Number(data?.ar_delta ?? data?.arDelta ?? 0))}`
            )
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || error?.message || "Không thể sửa giá")
        },
    })

    const totalOld = items.reduce((sum: number, item: any) => sum + calculateOrderAmounts(item).total, 0)
    const totalNew = items.reduce((sum: number, item: any) =>
        sum + calculateOrderAmounts({ ...item, ...rowMap.get(Number(item.id)) }).total, 0)

    const updateRow = (orderItemId: number, patch: Partial<RowState>) => {
        setRows((prev) =>
            prev.map((row) =>
                row.order_item_id === orderItemId
                    ? (() => {
                        const next = { ...row, ...patch }
                        if (next.price_basis === "VAT_INCLUSIVE") {
                            next.unit_price = toPreVatInputPrice(next.unit_price_including_vat ?? 0, next.vat_code,
                                Number(items.find((item: any) => Number(item.id) === orderItemId)?.quantity || 0))
                        }
                        return next
                    })()
                    : row
            )
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-[1600px] overflow-hidden p-0 sm:max-w-[96vw]">
                <DialogHeader className="border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2">
                        Sửa giá sau hoàn thành
                        <span className="font-mono text-sm text-primary">{order?.order_no}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-3">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                        <Summary label="Tổng cũ" value={formatCurrency(totalOld)} />
                        <Summary label="Tổng mới" value={formatCurrency(totalNew)} />
                        <Summary label="Chênh lệch" value={formatCurrency(totalNew - totalOld)} />
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[1480px]">
                            <TableHeader>
                                <TableRow className="bg-muted/70">
                                    <TableHead className="w-[56px] text-center">#</TableHead>
                                    <TableHead className="min-w-[150px]">Mã SP</TableHead>
                                    <TableHead className="min-w-[280px]">Tên sản phẩm</TableHead>
                                    <TableHead className="w-[110px] text-right">SL đặt</TableHead>
                                    <TableHead className="w-[130px] text-right">SL đã xuất</TableHead>
                                    <TableHead className="w-[130px] text-right">SL đã trả</TableHead>
                                    <TableHead className="w-[150px] text-right">Đơn giá cũ</TableHead>
                                    <TableHead className="min-w-[180px]">Nguồn giá</TableHead>
                                    <TableHead className="min-w-[160px] text-right">Đơn giá chưa VAT</TableHead>
                                    <TableHead className="min-w-[160px] text-right">Đơn giá gồm VAT</TableHead>
                                    <TableHead className="w-[150px] text-right">CK cũ</TableHead>
                                    <TableHead className="w-[160px] text-right">CK mới</TableHead>
                                    <TableHead className="w-[130px] text-center">VAT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item: any, index: number) => {
                                    const row = rowMap.get(Number(item.id))
                                    return (
                                        <TableRow key={item.id ?? index}>
                                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.product?.code ?? item.product_code ?? "-"}</TableCell>
                                            <TableCell className="font-medium">{item.product?.name ?? item.product_name ?? "-"}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.quantity || 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.exported_quantity || 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatNumber(item.returned_quantity || 0)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(item.unit_price || 0)}</TableCell>
                                            <TableCell>
                                                <PriceBasisSelect value={row?.price_basis ?? getPriceBasis(item)} disabled={mutation.isPending}
                                                    onChange={(price_basis) => {
                                                        const inclusive = getInclusiveUnitPrice({ ...item, ...row })
                                                        updateRow(Number(item.id), {
                                                            price_basis,
                                                            unit_price_including_vat: price_basis === "VAT_INCLUSIVE" ? inclusive : undefined,
                                                            unit_price: price_basis === "VAT_INCLUSIVE" ? toPreVatInputPrice(inclusive, row?.vat_code) : row?.unit_price ?? 0,
                                                        })
                                                    }} />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.001"
                                                    className="text-right"
                                                    readOnly={row?.price_basis === "VAT_INCLUSIVE"}
                                                    disabled={item.line_type === "PROMOTION" || mutation.isPending}
                                                    value={row?.unit_price ?? 0}
                                                    onChange={(event) =>
                                                        updateRow(Number(item.id), {
                                                            unit_price: Number(event.target.value || 0),
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" min={0} step="0.001" className="text-right"
                                                    value={getInclusiveUnitPrice({ ...item, ...row })}
                                                    readOnly={row?.price_basis !== "VAT_INCLUSIVE"}
                                                    disabled={item.line_type === "PROMOTION" || mutation.isPending}
                                                    onChange={(event) => {
                                                        const inclusive = Number(event.target.value || 0)
                                                        updateRow(Number(item.id), { unit_price_including_vat: inclusive, unit_price: toPreVatInputPrice(inclusive, row?.vat_code) })
                                                    }} />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{formatCurrency(item.discount || 0)}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="text-right"
                                                    value={row?.discount ?? 0}
                                                    disabled
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row?.vat_code || "NONE"}
                                                    disabled={row?.price_basis === "LEGACY" || mutation.isPending}
                                                    onValueChange={(value) => {
                                                        const vat_code = value === "NONE" ? undefined : value
                                                        updateRow(Number(item.id), {
                                                            vat_code,
                                                            unit_price: row?.price_basis === "VAT_INCLUSIVE"
                                                                ? toPreVatInputPrice(row.unit_price_including_vat ?? 0, vat_code) : row?.unit_price ?? 0,
                                                        })
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">-</SelectItem>
                                                        <SelectItem value="KCT">KCT</SelectItem>
                                                        <SelectItem value="VAT5">5%</SelectItem>
                                                        <SelectItem value="VAT8">8%</SelectItem>
                                                        <SelectItem value="VAT10">10%</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                        disabled={mutation.isPending || !rows.length}
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
