import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { deleteReceipt } from "@/api/sale/receipt"
import { CreateReceiptDialog } from "../../receipt/components/create-receipt-dialog"
import { UpdateReceiptDialog } from "../../receipt/components/update-receipt-dialog"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CalendarDays, Pencil, Plus, Trash2, WalletCards } from "lucide-react"


export function OrderReceipts({ order, receipts }: any) {
    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)

    const { mutate: removeReceipt, isPending } = useMutation({
        mutationFn: (id: number) => deleteReceipt(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
            toast.success("Đã xoá phiếu thu")
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    return (
        <div className="rounded-md border bg-background">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h2 className="font-semibold">Thu tiền</h2>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi các khoản thanh toán đã ghi nhận cho đơn hàng.
                    </p>
                </div>

                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thu tiền
                </Button>
            </div>

            {!receipts?.length ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Chưa có phiếu thu
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>Mã phiếu</TableHead>
                                <TableHead className="w-[150px]">Ngày thu</TableHead>
                                <TableHead className="w-[180px] text-right">Số tiền</TableHead>
                                <TableHead className="w-[150px]">Hình thức</TableHead>
                                <TableHead className="w-[140px]">Trạng thái</TableHead>
                                <TableHead>Ghi chú</TableHead>
                                <TableHead className="w-[110px] text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                        {receipts.map((r: any) => (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <div className="font-semibold">{r.receipt_no ?? `RC-${r.id}`}</div>
                                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <WalletCards className="h-3.5 w-3.5" />
                                        {r.method || "-"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-1 text-sm">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        {formatDate(r.receipt_date)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">
                                    {formatCurrency(r.amount)}
                                </TableCell>
                                <TableCell>{r.method || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{r.status || "-"}</Badge>
                                </TableCell>
                                <TableCell className="max-w-[260px] truncate" title={r.note}>
                                    {r.note || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"

                                            onClick={() => setEditRow(r)}

                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:text-red-600"
                                            disabled={isPending}
                                            onClick={() => {
                                                if (confirm("Xoá phiếu thu này?")) {
                                                    removeReceipt(r.id)
                                                }
                                            }}

                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <CreateReceiptDialog
                order={order}
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {editRow && (
                <UpdateReceiptDialog
                    receipt={editRow}
                    order={order}
                    open={!!editRow}
                    onOpenChange={(open: boolean) => {
                        if (!open) setEditRow(null)
                    }}
                />
            )}
        </div>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3) {
        return parts[0].length === 4
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return date
}
