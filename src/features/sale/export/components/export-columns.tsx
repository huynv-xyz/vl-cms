import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUpdateStatus } from "@/hooks/use-update-status"
import { updateExportStatus } from "@/api/sale/export"
import type { Export } from "../data/schema"
import { ExportDetailDialog } from "../components/export-detail-dialog" // 🔥 cần có
import { ExportRowActions } from "./export-row-actions"
import { EXPORT_STATUSES, exportStatusLabel } from "./export-status"

export function useExportColumns() {

    const [selectedId, setSelectedId] = useState<number | null>(null)
    const statusMutation = useUpdateStatus<Export>({
        queryKey: ["exports"],
        mutationFn: updateExportStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Export>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "export_no",
            title: "Số PX",
            render: (row) => (
                <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setSelectedId(row.id)}
                >
                    {row.export_no}
                    <div className="text-xs font-normal text-muted-foreground">
                        {row.delivery?.delivery_no ? `Giao ${row.delivery.delivery_no}` : "Chưa có phiếu giao"}
                    </div>
                </button>
            ),
        }),

        buildTextColumn({
            accessorKey: "export_date",
            title: "Ngày xuất",
        }),

        buildTextColumn({
            accessorKey: "order_id",
            title: "Đơn hàng",
            render: (row) =>
                row.order?.order_no ?? `#${row.order_id}`,
        }),

        buildTextColumn({
            accessorKey: "delivery_id",
            title: "Phiếu giao",
            render: (row) =>
                row.delivery?.delivery_no ?? `#${row.delivery_id}`,
        }),

        buildTextColumn({
            accessorKey: "warehouse_id",
            title: "Kho",
            render: (row) => row.warehouse?.name,
        }),

        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status || "NEW"
                const isLocked = status === "DONE"

                return (
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            statusMutation.mutate({
                                id: row.original.id,
                                status: value,
                            })
                        }
                        disabled={statusMutation.isPending || isLocked}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {exportStatusLabel(status)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {EXPORT_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value} disabled={isLocked}>
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
                return <ExportRowActions row={row} />
            },
        }),
    ]

    return {
        columns,
        dialog: (
            <ExportDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        ),
    }
}
