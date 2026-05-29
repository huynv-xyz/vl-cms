import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Return } from "../data/schema"
import { ReturnRowActions } from "./return-row-actions"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { useUpdateStatus } from "@/hooks/use-update-status"
import { updateReturnStatus } from "@/api/sale/return"
import { ReturnDetailDialog } from "../components/return-detail-dialog" // 🔥 thêm
import { RETURN_STATUSES, returnStatusLabel } from "./return-status"

export function useReturnColumns() {

    const [selectedId, setSelectedId] = useState<number | null>(null)

    const mutation = useUpdateStatus<Return>({
        queryKey: ["returns"],
        mutationFn: updateReturnStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Return>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "return_no",
            title: "Mã trả",
            render: (row) => (
                <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setSelectedId(row.id)}
                >
                    {row.return_no}
                    <div className="text-xs font-normal text-muted-foreground">
                        {row.export?.export_no ? `Xuất ${row.export.export_no}` : "Chưa có phiếu xuất"}
                    </div>
                </button>
            ),
        }),

        {
            accessorKey: "order_id",
            header: "Đơn hàng",
            cell: ({ row }) =>
                row.original.order?.order_no ??
                `#${row.original.order_id}`,
        },

        {
            accessorKey: "customer",
            header: "Khách hàng",
            cell: ({ row }) => {
                const customer = row.original.customer ?? row.original.order?.customer

                return (
                    <div className="min-w-[220px]">
                        <div className="font-medium text-slate-900">
                            {customer?.name ?? "-"}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {customer?.code ?? "-"}
                        </div>
                    </div>
                )
            },
        },

        {
            accessorKey: "export_id",
            header: "Phiếu xuất",
            cell: ({ row }) =>
                row.original.export?.export_no ??
                `#${row.original.export_id}`,
        },

        buildTextColumn({
            accessorKey: "reason",
            title: "Lý do",
        }),

        {
            accessorKey: "created_at",
            header: "Ngày trả",
            cell: ({ row }) => formatReturnDate(row.original.created_at),
        },

        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {

                const status = row.original.status
                const isLocked = status === "DONE"

                return (
                    <Select
                        value={status}
                        onValueChange={(v) =>
                            mutation.mutate({
                                id: row.original.id,
                                status: v,
                            })
                        }
                        disabled={mutation.isPending || isLocked}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {returnStatusLabel(status)}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {RETURN_STATUSES.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={isLocked}
                                >
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
        },

        buildActionsColumn({
            renderActions: (_, row) => {
                if (row.original.status === "DONE") return null
                return <ReturnRowActions row={row} />
            },
        }),
    ]

    return {
        columns,

        // 🔥 DIALOG
        dialog: (
            <ReturnDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        ),
    }
}

function formatReturnDate(value?: string | number[]) {
    if (!value) return "-"
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return "-"
        return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`
    }

    const [datePart] = value.split("T")
    const normalized = datePart.includes(" ") ? datePart.split(" ")[0] : datePart
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return value
    return `${match[3]}-${match[2]}-${match[1]}`
}
