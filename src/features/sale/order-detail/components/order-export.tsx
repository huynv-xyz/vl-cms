import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Eye, PackageCheck, Warehouse } from "lucide-react"
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

// ========================
// CONSTANT
// ========================
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

// ========================
// MAIN
// ========================
export function OrderExports({ exports, order }: any) {

    const queryClient = useQueryClient()
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const isEditable = order?.status === "CONFIRMED"

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status }: any) =>
            updateExportStatus(id, status),

        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({
                queryKey: ["order-detail", order.id],
            })

            const prev = queryClient.getQueryData([
                "order-detail",
                order.id,
            ])

            queryClient.setQueryData(
                ["order-detail", order.id],
                (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        exports: old.exports.map((x: any) =>
                            x.id === id ? { ...x, status } : x
                        ),
                    }
                }
            )

            return { prev }
        },

        onError: (_, __, context) => {
            queryClient.setQueryData(
                ["order-detail", order.id],
                context?.prev
            )
            toast.error("Cập nhật thất bại")
        },

        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công")
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
        },
    })

    return (
        <div className="rounded-md border bg-background">

            {/* HEADER */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h2 className="font-semibold">Phiếu xuất kho</h2>
                    <p className="text-sm text-muted-foreground">
                        Các chứng từ xuất kho đã tạo.
                    </p>
                </div>

                <Badge variant="outline">
                    {formatNumber(exports?.length || 0)} phiếu
                </Badge>
            </div>

            {/* EMPTY */}
            {!exports?.length ? (
                <EmptyState text="Chưa có phiếu xuất kho cho đơn này." />
            ) : (

                <div className="space-y-3 p-4">
                    {exports.map((exportDoc: any) => {

                        const meta = getExportStatusMeta(exportDoc.status)
                        const isRowLocked =
                            exportDoc.status === "DONE" ||
                            exportDoc.status === "CANCELLED"

                        const totalQty = sumBy(
                            exportDoc.items ?? [],
                            (item: any) => item.quantity
                        )

                        return (
                            <div key={exportDoc.id} className="rounded-md border">

                                {/* HEADER ITEM */}
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">

                                    <div className="min-w-0">
                                        <button
                                            className="font-semibold text-primary hover:underline"
                                            onClick={() => setSelectedId(exportDoc.id)}
                                        >
                                            {exportDoc.export_no}
                                        </button>

                                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4" />
                                                {formatDate(exportDoc.export_date)}
                                            </span>

                                            <span className="flex items-center gap-1">
                                                <Warehouse className="h-4 w-4" />
                                                {exportDoc.warehouse?.name || "-"}
                                            </span>

                                            <span className="flex items-center gap-1">
                                                <PackageCheck className="h-4 w-4" />
                                                {exportDoc.delivery?.delivery_no || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ACTION */}
                                    <div className="flex items-center gap-2">

                                        <Badge variant="outline">
                                            {formatNumber(exportDoc.items?.length || 0)} dòng
                                        </Badge>

                                        <Badge variant="secondary">
                                            {formatNumber(totalQty)} SL
                                        </Badge>

                                        <Select
                                            value={exportDoc.status || "NEW"}
                                            onValueChange={(status) =>
                                                changeStatus({
                                                    id: exportDoc.id,
                                                    status,
                                                })
                                            }
                                            disabled={isPending || isRowLocked}
                                        >
                                            <SelectTrigger className="h-9 w-[150px]">
                                                <SelectValue>
                                                    <Badge variant={meta.variant}>
                                                        {meta.label}
                                                    </Badge>
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
                                            onClick={() => setSelectedId(exportDoc.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <ItemsTable items={exportDoc.items ?? []} />
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

//
// ========================
// SUB COMPONENTS
// ========================
//

function ItemsTable({ items }: { items: any[] }) {
    if (!items.length) {
        return (
            <div className="px-4 py-6 text-sm text-muted-foreground">
                Phiếu chưa có hàng xuất.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader className="bg-muted/40">
                <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Đơn vị</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <div className="font-medium">{item.product?.code}</div>
                            <div className="text-sm text-muted-foreground">
                                {item.product?.name}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            {formatNumber(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                            {item.product?.unit}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {text}
        </div>
    )
}

//
// ========================
// HELPERS
// ========================
//

function getExportStatusMeta(status?: string) {
    return exportStatusMeta[String(status ?? "").toUpperCase()] ?? {
        label: status || "-",
        variant: "outline" as const,
    }
}

function sumBy(items: any[], fn: (item: any) => unknown) {
    return items.reduce((sum, item) => sum + Number(fn(item) || 0), 0)
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}