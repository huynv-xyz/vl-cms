import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import type { Export } from "../data/schema"
import { Link } from "@tanstack/react-router"

export const exportColumns: ColumnDef<Export>[] = [

    // STT
    buildIndexColumn(),

    // Số phiếu xuất
    buildTextColumn({
        accessorKey: "export_no",
        title: "Số PX",
        render: (row) => (
            <Link
                to="/sales/exports/$id"
                params={{ id: String(row.id) }}
                className="text-primary hover:underline font-medium"
            >
                {row.export_no}
            </Link>
        ),
    }),

    // Ngày xuất
    buildTextColumn({
        accessorKey: "export_date",
        title: "Ngày xuất",
    }),

    // Đơn hàng
    buildTextColumn({
        accessorKey: "order_id",
        title: "Đơn hàng",
        render: (row) =>
            row.order?.order_no ?? `#${row.order_id}`,
    }),

    // Phiếu giao
    buildTextColumn({
        accessorKey: "delivery_id",
        title: "Phiếu giao",
        render: (row) =>
            row.delivery?.delivery_no ?? `#${row.delivery_id}`,
    }),

    // Kho
    buildTextColumn({
        accessorKey: "warehouse_id",
        title: "Kho",
        render: (row) => row.warehouse?.name,
    }),

    // Trạng thái
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