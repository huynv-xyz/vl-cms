import { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
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
import { ExportRowActions } from "./export-row-actions"
import { EXPORT_STATUSES, exportStatusLabel } from "./export-status"
import { FileText } from "lucide-react"

export function useExportColumns() {

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
                <Link
                    to="/sales/exports/$id"
                    params={{ id: String(row.id) }}
                    className="group inline-flex flex-col gap-0.5"
                >
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-primary transition-colors group-hover:underline">
                        <FileText className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                        {row.export_no ?? `#${row.id}`}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                        {row.delivery?.delivery_no
                            ? `Giao ${row.delivery.delivery_no}`
                            : "Chưa có phiếu giao"}
                    </span>
                </Link>
            ),
        }),

        buildTextColumn({
            accessorKey: "export_date",
            title: "Ngày xuất",
        }),

        buildTextColumn({
            accessorKey: "order_id",
            title: "Đơn hàng",
            render: (row) => (
                <div>
                    <div className="font-medium">
                        {row.order?.order_no ?? `#${row.order_id}`}
                    </div>
                    {row.order?.customer?.name && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {row.order.customer.name}
                        </div>
                    )}
                </div>
            ),
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

    return { columns }
}
