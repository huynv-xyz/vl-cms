import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { formatNumber } from "@/lib/utils"
import { ShipmentItemRowActions } from "./shipment-item-row-actions"
import { ShipmentItem } from "../data/schema"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"

export const shipmentItemColumns: ColumnDef<ShipmentItem>[] = [
    buildIndexColumn(),

    buildTextColumn({
        id: "shipment_code",
        title: "Mã lô",
        accessorFn: (row) => row.shipment?.code ?? `#${row.shipment_id ?? "-"}`,
    }),

    buildTextColumn({
        id: "product_code",
        title: "Mã sản phẩm",
        accessorFn: (row) => row.product?.code ?? "-",
    }),

    buildTextColumn({
        id: "product_name",
        title: "Tên sản phẩm",
        accessorFn: (row) => row.product?.name ?? "-",
    }),


    buildTextColumn({
        id: "destination_port",
        title: "Cảng đến",
        render: (row) => row.shipment?.destination_port?.name ?? "",
    }),

    buildTextColumn({
        id: "etd",
        title: "Ngày dự kiến đi",
        render: (row) => row.shipment?.etd,
    }),

    buildTextColumn({
        id: "eta",
        title: "Ngày dự kiến đến",
        render: (row) => row.shipment?.eta,
    }),

    buildTextColumn({
        id: "warehouse_id",
        title: "Kho",
        accessorFn: (row) => row.shipment?.warehouse?.name
    }),


    buildTextColumn({
        id: "warehouse_at",
        title: "Ngày về kho",
        render: (row) => row.shipment?.warehouse_at,
    }),

    buildTextColumn({
        accessorKey: "quantity",
        title: "Số lượng",
        render: (row) => formatNumber(row.quantity ?? 0),
    }),

    buildTextColumn({
        id: "unit",
        title: "Đơn vị",
        accessorFn: (row) => row.product?.unit,
    }),

    buildBadgeColumn({
        id: "status",
        title: "Trạng thái",
        accessorFn: (row) => row.shipment?.status,
        mapValueToLabel: (v) => {
            switch (v) {
                case "PLANNED":
                    return "Kế hoạch"
                case "IN_TRANSIT":
                    return "Đang vận chuyển"
                case "DONE":
                    return "Hoàn tất"
                case "CANCELLED":
                    return "Đã hủy"
                default:
                    return "-"
            }
        },
    }),

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
        render: (row) => row.shipment?.note
    }),

    buildActionsColumn({
        renderActions: (_, row) => (
            <ShipmentItemRowActions row={row} />
        ),
    }),
]