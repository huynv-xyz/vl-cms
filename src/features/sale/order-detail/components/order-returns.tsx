import { useState } from "react"
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

import { CreateReturnDialog } from "../../return/components/create-return-dialog"
import { getMyPermissions } from "@/api/auth/permission"
import { deleteReturn, updateReturnStatus } from "@/api/sale/return"
import { UpdateReturnDialog } from "../../return/components/update-return-dialog"
import { ReturnDetailDialog } from "../../return/components/return-detail-dialog"

const statusOptions = [
    { value: "NEW", label: "Mới" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
]

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    NEW: "secondary",
    DONE: "outline",
    CANCELLED: "destructive",
}

export function OrderReturns({ order, returns }: any) {
    const queryClient = useQueryClient()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canChangeDoneStatus = permissions.some(
        (p: any) => p.module === "sales.returns" && p.action === "status.after-done"
    )

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

    const { mutate: changeStatus, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, status }: any) => updateReturnStatus(id, status),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
            toast.success("Cập nhật trạng thái thành công")
        },
        onError: () => toast.error("Cập nhật thất bại"),
    })

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <RotateCcw className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Phiếu trả hàng</h2>
                        <p className="text-xs text-muted-foreground">
                            Theo dõi các phiếu trả hàng phát sinh từ đơn này
                        </p>
                    </div>
                </div>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Tạo phiếu trả
                    </Button>
                )}
            </div>

            {!returns?.length ? (
                <EmptyState
                    title="Chưa có phiếu trả hàng"
                    desc="Phiếu trả sẽ xuất hiện khi khách hoàn lại sản phẩm."
                />
            ) : (
                <div className="space-y-3 p-4">
                    {returns.map((r: any) => {
                        const canChangeStatus = isEditable || (r.status === "DONE" && canChangeDoneStatus)
                        const isRowLocked = !isEditable || r.status === "DONE"
                        const totalQty = (r.items || []).reduce(
                            (s: number, i: any) => s + Number(i.quantity || 0),
                            0
                        )
                        const currentStatus = statusOptions.find((s) => s.value === r.status)

                        return (
                            <div
                                key={r.id}
                                className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            className="text-left font-semibold text-primary hover:underline"
                                            onClick={() => setSelectedId(r.id)}
                                        >
                                            {r.return_no}
                                        </button>
                                        {r.reason && (
                                            <div className="mt-1 max-w-[420px] truncate text-xs text-muted-foreground">
                                                <span className="font-medium">Lý do:</span> {r.reason}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="font-normal">
                                            {formatNumber(r.items?.length || 0)} dòng
                                        </Badge>
                                        <Badge variant="secondary" className="font-normal">
                                            SL: {formatNumber(totalQty)}
                                        </Badge>

                                        <Select
                                            value={r.status}
                                            onValueChange={(v) =>
                                                changeStatus({ id: r.id, status: v })
                                            }
                                            disabled={isUpdating || !canChangeStatus}
                                        >
                                            <SelectTrigger className="h-8 w-[150px]">
                                                <SelectValue>
                                                    <Badge
                                                        variant={statusVariant[r.status] || "outline"}
                                                    >
                                                        {currentStatus?.label || r.status}
                                                    </Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((s) => (
                                                    <SelectItem
                                                        key={s.value}
                                                        value={s.value}
                                                        disabled={!canChangeStatus}
                                                    >
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {!isRowLocked && (
                                            <>
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
                                                        if (confirm("Xoá phiếu trả này?")) {
                                                            removeReturn(r.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <ItemsTable items={r.items ?? []} />
                            </div>
                        )
                    })}
                </div>
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

function ItemsTable({ items }: { items: any[] }) {
    if (!items.length) {
        return (
            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                Phiếu chưa có hàng
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase">Sản phẩm</TableHead>
                        <TableHead className="w-[140px] text-right text-xs font-semibold uppercase">Số lượng</TableHead>
                        <TableHead className="w-[120px] text-right text-xs font-semibold uppercase">Đơn vị</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((i: any) => (
                        <TableRow key={`${i.product_id}-${i.id ?? ""}`}>
                            <TableCell>
                                <div className="font-medium">{i.product?.name}</div>
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {i.product?.code}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                                {formatNumber(i.quantity)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                                {i.product?.unit || "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{desc}</p>
        </div>
    )
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(value || 0))
}
