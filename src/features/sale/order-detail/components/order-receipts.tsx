import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { deleteReceipt } from "@/api/sale/receipt"
import { CreateReceiptDialog } from "../../receipt/components/create-receipt-dialog"
import { UpdateReceiptDialog } from "../../receipt/components/update-receipt-dialog"
import { Pencil, Trash2 } from "lucide-react"


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
        <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">Thu tiền</h2>
                    <p className="text-sm text-muted-foreground">
                        Danh sách phiếu thu của đơn hàng
                    </p>
                </div>

                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    + Thu tiền
                </Button>
            </div>

            {!receipts?.length ? (
                <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                    Chưa có phiếu thu
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30 text-left">
                            <th className="px-3 py-2">Mã</th>
                            <th>Ngày</th>
                            <th className="">Số tiền</th>
                            <th>Hình thức</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th className="w-[140px] text-right">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {receipts.map((r: any) => (
                            <tr key={r.id} className="border-b last:border-0">
                                <td className="px-3 py-2 font-medium">
                                    {r.receipt_no ?? `RC-${r.id}`}
                                </td>
                                <td>{r.receipt_date}</td>
                                <td className="font-semibold text-green-600">
                                    {formatCurrency(r.amount)}
                                </td>
                                <td>{r.method}</td>
                                <td>{r.status}</td>
                                <td className="max-w-[220px] truncate" title={r.note}>
                                    {r.note || "-"}
                                </td>
                                <td className="text-right">
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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