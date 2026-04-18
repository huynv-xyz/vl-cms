import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { ShipmentRowActions } from "./shipment-row-actions"
import { Shipment } from "../data/schema"

export const shipmentColumns: ColumnDef<Shipment>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã lô",
    }),

    buildTextColumn({
        accessorKey: "etd",
        title: "Ngày dự kiến đi",
    }),

    buildTextColumn({
        accessorKey: "eta",
        title: "Ngày dự kiến đến",
    }),

    buildTextColumn({
        accessorKey: "warehouse_at",
        title: "Ngày về kho",
    }),

    buildTextColumn({
        accessorKey: "container_no",
        title: "Số container",
    }),

    buildTextColumn({
        accessorKey: "destination_port_id",
        title: "Cảng đến",
        render: (row) =>
            row.destination_port
                ? `${row.destination_port.name}`
                : "-",
    }),

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => {
            switch (v) {
                case "PLANNED": return "Kế hoạch"
                case "IN_TRANSIT": return "Đang vận chuyển"
                case "DONE": return "Hoàn tất"
                case "CANCELLED": return "Đã hủy"
                default: return "-"
            }
        },
    }),

    buildActionsColumn({
        renderActions: (_, row) => <ShipmentRowActions row={row} />,
    }),
]