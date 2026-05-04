import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Return } from "../data/schema"
import { ReturnRowActions } from "./return-row-actions"
import { Badge } from "@/components/ui/badge"

export const returnColumns: ColumnDef<Return>[] = [

    // STT
    buildIndexColumn(),

    // Mã phiếu trả
    buildTextColumn({
        accessorKey: "return_no",
        title: "Mã trả"
    }),

    // Đơn hàng
    {
        accessorKey: "order_id",
        header: "Đơn hàng",
        cell: ({ row }) =>
            row.original.order?.order_no ??
            `#${row.original.order_id}`,
    },

    // Phiếu xuất
    {
        accessorKey: "export_id",
        header: "Phiếu xuất",
        cell: ({ row }) =>
            row.original.export?.export_no ??
            `#${row.original.export_id}`,
    },

    // Lý do
    buildTextColumn({
        accessorKey: "reason",
        title: "Lý do",
    }),

    // Trạng thái
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {

            const status = row.original.status

            const map: any = {
                NEW: { label: "Mới", variant: "secondary" },
                DONE: { label: "Hoàn thành", variant: "outline" },
                CANCELLED: { label: "Hủy", variant: "destructive" },
            }

            const meta = map[status] || {
                label: status,
                variant: "outline",
            }

            return (
                <Badge variant={meta.variant}>
                    {meta.label}
                </Badge>
            )
        },
    },

    // Actions
    buildActionsColumn({
        renderActions: (_, row) => <ReturnRowActions row={row} />,
    }),
]