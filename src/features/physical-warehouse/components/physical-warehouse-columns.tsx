import type { ColumnDef } from "@tanstack/react-table"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { PhysicalWarehouse } from "../data/schema"
import { PhysicalWarehouseRowActions } from "./physical-warehouse-row-actions"

export const physicalWarehouseColumns: ColumnDef<PhysicalWarehouse>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã địa điểm kho",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên địa điểm kho",
    }),

    buildTextColumn({
        accessorKey: "address",
        title: "Địa chỉ",
    }),

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (v === "ACTIVE" ? "Hoạt động" : "Ngừng"),
    }),

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <PhysicalWarehouseRowActions row={row} />,
    }),
]
