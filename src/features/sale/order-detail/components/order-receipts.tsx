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
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    CalendarDays,
    Pencil,
    Plus,
    Trash2,
    Wallet,
    WalletCards,
} from "lucide-react"

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

    const totalAmount = (receipts || []).reduce(
        (s: number, r: any) => s + Number(r.amount || 0),
        0
    )

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Wallet className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Thu tiền</h2>
                        <p className="text-xs text-muted-foreground">
                            Theo dõi các khoản thanh toán đã ghi nhận cho đơn hàng
                        </p>
                    </div>
                </div>

                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Thu tiền
                </Button>
            </div>

            {!receipts?.length ? (
                <EmptyState
                    title="Chưa có phiếu thu"
                    desc="Tạo phiếu thu khi nhận được thanh toán từ khách hàng."
                />
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-semibold uppercase">Mã phiếu</TableHead>
                                <TableHead className="w-[150px] text-xs font-semibold uppercase">Ngày thu</TableHead>
                                <TableHead className="w-[180px] text-right text-xs font-semibold uppercase">Số tiền</TableHead>
                                <TableHead className="w-[150px] text-xs font-semibold uppercase">Hình thức</TableHead>
                                <TableHead className="w-[140px] text-xs font-semibold uppercase">Trạng thái</TableHead>
                                <TableHead className="text-xs font-semibold uppercase">Ghi chú</TableHead>
                                <TableHead className="w-[110px] text-right text-xs font-semibold uppercase">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {receipts.map((r: any) => (
                                <TableRow key={r.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="font-semibold">
                                            {r.receipt_no ?? `RC-${r.id}`}
                                        </div>
                                        <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <WalletCards className="h-3 w-3" />
                                            {r.method || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-1 text-sm">
                                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                            {formatDate(r.receipt_date)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(r.amount)}
                                    </TableCell>
                                    <TableCell className="text-sm">{r.method || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {r.status || "-"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="max-w-[260px] truncate text-sm text-muted-foreground"
                                        title={r.note}
                                    >
                                        {r.note || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-0.5">
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
                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
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

                        <TableFooter className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={2}
                                    className="text-right text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Tổng đã thu
                                </TableCell>
                                <TableCell className="text-right text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalAmount)}
                                </TableCell>
                                <TableCell colSpan={4} />
                            </TableRow>
                        </TableFooter>
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

function EmptyState({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{desc}</p>
        </div>
    )
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
