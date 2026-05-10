import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import type { Export } from "../data/schema"
import { ExportDetailDialog } from "../components/export-detail-dialog" // 🔥 cần có

export function useExportColumns() {

    const [selectedId, setSelectedId] = useState<number | null>(null)

    const columns: ColumnDef<Export>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "export_no",
            title: "Số PX",
            render: (row) => (
                <span
                    className="text-primary cursor-pointer hover:underline font-medium"
                    onClick={() => setSelectedId(row.id)}
                >
                    {row.export_no}
                </span>
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

        buildBadgeColumn({
            accessorKey: "status",
            title: "Trạng thái",
            mapValueToLabel: (v) => {
                switch (v) {
                    case "DRAFT":
                        return "Nháp"
                    case "DONE":
                        return "Hoàn tất"
                    default:
                        return "-"
                }
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