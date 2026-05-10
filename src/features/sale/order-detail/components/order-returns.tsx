import { useState, Fragment } from "react"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import { CreateReturnDialog } from "../../return/components/create-return-dialog"
import { deleteReturn, updateReturnStatus } from "@/api/sale/return"
import { UpdateReturnDialog } from "../../return/components/update-return-dialog"
import { ReturnDetailDialog } from "../../return/components/return-detail-dialog"

const statusOptions = [
    { value: "NEW", label: "Mới" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
]

export function OrderReturns({ order, returns }: any) {

    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const isEditable = order?.status === "CONFIRMED"

    const { mutate: removeReturn, isPending } = useMutation({
        mutationFn: deleteReturn,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
            toast.success("Đã xoá phiếu trả")
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">

            {/* HEADER */}
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Trả hàng</h2>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Tạo mới
                    </Button>
                )}
            </div>

            {!returns?.length ? (
                <div className="text-sm text-muted-foreground">
                    Chưa có phiếu trả
                </div>
            ) : (
                <table className="w-full text-sm border rounded-lg overflow-hidden">

                    <thead className="bg-muted text-xs uppercase">
                        <tr>
                            <th className="w-[70px] text-center">#</th>
                            <th className="p-2 text-left">Mã trả</th>
                            <th className="p-2 text-left">Lý do</th>
                            <th className="p-2 text-left">Trạng thái</th>
                            <th className="p-2 w-[140px]" />
                        </tr>
                    </thead>

                    <tbody>
                        {returns.map((r: any, idx: number) => {

                            const isRowLocked = !isEditable || r.status === "DONE"

                            return (
                                <Fragment key={r.id}>

                                    <tr className="border-t bg-muted/20">

                                        <td className="text-center font-bold text-primary">
                                            <span className="text-2xl font-bold text-primary">
                                                #{idx + 1}
                                            </span>
                                        </td>

                                        <td className="p-2 font-medium">
                                            <span
                                                className="text-primary cursor-pointer hover:underline"
                                                onClick={() => setSelectedId(r.id)}
                                            >
                                                {r.return_no}
                                            </span>
                                        </td>

                                        <td className="p-2 text-muted-foreground">
                                            {r.reason || "-"}
                                        </td>

                                        {/* STATUS */}
                                        <td className="p-2">
                                            <Select
                                                value={r.status}
                                                onValueChange={(v) =>
                                                    updateReturnStatus(r.id, v)
                                                }
                                                disabled={isRowLocked}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue>
                                                        {statusOptions.find(s => s.value === r.status)?.label}
                                                    </SelectValue>
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {statusOptions.map(s => (
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
                                        </td>

                                        {/* ACTION */}
                                        <td className="p-2 text-right space-x-1">

                                            {!isRowLocked && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setEditRow(r)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500"
                                                        disabled={isPending}
                                                        onClick={() => {
                                                            if (confirm("Xoá phiếu trả này?")) {
                                                                removeReturn(r.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>

                                    {/* ITEMS */}
                                    <tr>
                                        <td />
                                        <td colSpan={4}>
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/30">
                                                    <tr>
                                                        <th className="p-2 text-left">Mã SP</th>
                                                        <th className="p-2 text-left">Tên SP</th>
                                                        <th className="p-2 text-right">SL</th>
                                                        <th className="p-2 text-right">ĐVT</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {r.items?.map((i: any) => (
                                                        <tr key={i.product_id} className="border-t">
                                                            <td className="p-2 text-xs text-muted-foreground">
                                                                {i.product?.code}
                                                            </td>
                                                            <td className="p-2">
                                                                {i.product?.name}
                                                            </td>
                                                            <td className="p-2 text-right font-medium">
                                                                {i.quantity}
                                                            </td>
                                                            <td className="p-2 text-right text-muted-foreground">
                                                                {i.product?.unit}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            )}

            {/* CREATE */}
            {isEditable && (
                <CreateReturnDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {/* EDIT */}
            {editRow && (
                <UpdateReturnDialog
                    returnData={editRow}
                    open={!!editRow}
                    onOpenChange={(v: boolean) => {
                        if (!v) setEditRow(null)
                    }}
                />
            )}

            {/* DETAIL */}
            <ReturnDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        </div>
    )
}