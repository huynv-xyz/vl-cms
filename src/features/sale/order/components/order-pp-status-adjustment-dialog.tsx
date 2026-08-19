import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save } from "lucide-react"

import { listProductGroupPpStatusLookups } from "@/api/app-lookup"
import { adjustOrderPpStatus } from "@/api/sale/order"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { formatNumber } from "@/lib/utils"

type Props = {
    open: boolean
    order: any
    onOpenChange: (open: boolean) => void
}

type RowState = {
    order_item_id: number
    pp_status?: string
}

const NO_PP_STATUS_VALUE = "__NO_PP_STATUS__"

export function OrderPpStatusAdjustmentDialog({ open, order, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [rows, setRows] = useState<RowState[]>([])
    const items = useMemo(() => order?.items ?? [], [order])
    const { data: lookupPage } = useQuery({
        queryKey: ["app-lookups", "PRODUCT_GROUP_PP_STATUS"],
        queryFn: () => listProductGroupPpStatusLookups({ page: 1, size: 100 }),
        enabled: open,
    })
    const options = lookupPage?.items ?? []

    useEffect(() => {
        if (!open) return
        setRows(
            items
                .filter((item: any) => item.id != null)
                .map((item: any) => ({
                    order_item_id: Number(item.id),
                    pp_status: item.pp_status || undefined,
                }))
        )
    }, [open, items])

    const rowMap = useMemo(
        () => new Map(rows.map((row) => [row.order_item_id, row])),
        [rows]
    )

    const mutation = useMutation({
        mutationFn: () => adjustOrderPpStatus(Number(order.id), rows.map((row) => ({
            order_item_id: row.order_item_id,
            pp_status: row.pp_status || null,
        }))),
        onSuccess: async (res: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }),
            ])
            const updatedTransactions = Number(res?.updated_export_transaction_rows ?? res?.updatedExportTransactionRows ?? 0)
                + Number(res?.updated_return_transaction_rows ?? res?.updatedReturnTransactionRows ?? 0)
            toast.success(`Đã sửa tình trạng PP (${updatedTransactions} dòng giao dịch)`)
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không thể sửa tình trạng PP")
        },
    })

    const updateRow = (orderItemId: number, ppStatus?: string) => {
        setRows((prev) =>
            prev.map((row) =>
                row.order_item_id === orderItemId
                    ? { ...row, pp_status: ppStatus }
                    : row
            )
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[92vw] max-w-[1200px] overflow-hidden p-0 sm:max-w-[92vw]">
                <DialogHeader className="border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2">
                        Sửa tình trạng PP
                        <span className="font-mono text-sm text-primary">{order?.order_no}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-3">
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[980px]">
                            <TableHeader>
                                <TableRow className="bg-muted/70">
                                    <TableHead className="w-[56px] text-center">#</TableHead>
                                    <TableHead className="min-w-[150px]">Mã SP</TableHead>
                                    <TableHead className="min-w-[300px]">Tên sản phẩm</TableHead>
                                    <TableHead className="w-[110px] text-right">SL đặt</TableHead>
                                    <TableHead className="w-[130px] text-right">SL đã xuất</TableHead>
                                    <TableHead className="w-[160px]">PP hiện tại</TableHead>
                                    <TableHead className="w-[220px]">PP mới</TableHead>
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
                                            <TableCell>{item.pp_status || "-"}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row?.pp_status || NO_PP_STATUS_VALUE}
                                                    onValueChange={(value) =>
                                                        updateRow(Number(item.id), value === NO_PP_STATUS_VALUE ? undefined : value)
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 bg-white">
                                                        <SelectValue placeholder="Chọn tình trạng PP" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={NO_PP_STATUS_VALUE}>Không có</SelectItem>
                                                        {options.map((option) => (
                                                            <SelectItem key={option.code} value={option.code}>
                                                                {option.name || option.code}
                                                            </SelectItem>
                                                        ))}
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
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
