
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Warehouse } from "../data/schema"
import { WarehouseRowActions } from "./warehouse-row-actions"

export const warehouseColumns: ColumnDef<Warehouse>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã kho",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên kho",
    }),

    buildTextColumn({
        accessorKey: "inventory_account_code",
        title: "Tài khoản kho",
    }),

    buildTextColumn({
        accessorFn: (row) =>
            row.physical_warehouse?.name ||
            (row.physical_warehouse_id ? `#${row.physical_warehouse_id}` : ""),
        title: "Địa điểm kho",
    }),

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (v === "ACTIVE" ? "Hoạt động" : "Ngừng"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <WarehouseRowActions row={row} />,
    }),
]
