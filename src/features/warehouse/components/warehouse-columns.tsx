
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Warehouse } from "../data/schema"
import { WarehouseRowActions } from "./warehouse-row-actions"

const centerBody = "text-center"

export const warehouseColumns: ColumnDef<Warehouse>[] = [
    {
        ...buildIndexColumn<Warehouse>(),
        meta: {
            tdClassName: centerBody,
        },
    },

    buildTextColumn({
        accessorKey: "code",
        title: "Mã kho",
        width: 225,
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên kho",
        width: 300,
    }),

    {
        ...buildTextColumn({
            accessorKey: "inventory_account_code",
            title: "Tài khoản kho",
            textClassName: "text-sm text-center",
        }),
        meta: {
            thClassName: "whitespace-nowrap",
            tdClassName: centerBody,
        },
    },

    buildTextColumn({
        accessorFn: (row) =>
            row.physical_warehouse?.name ||
            (row.physical_warehouse_id ? `#${row.physical_warehouse_id}` : ""),
        title: "Địa điểm kho",
        width: 300,
    }),

    {
        ...buildBadgeColumn({
            accessorKey: "status",
            title: "Trạng thái",
            width: 130,
            mapValueToLabel: (v) => (v === "ACTIVE" ? "Hoạt động" : "Ngừng"),
        }),
        meta: {
            thClassName: "w-[130px] whitespace-nowrap",
            tdClassName: "w-[130px] whitespace-nowrap text-center",
        },
    },

    {
        ...buildBadgeColumn({
            accessorKey: "visible_in_sales_inventory_summary",
            title: "Tồn kho kinh doanh",
            width: 160,
            mapValueToLabel: (v) => (v === false ? "Ẩn" : "Hiện"),
            mapValueToVariant: (v) => (v === false ? "outline" : "secondary"),
        }),
        meta: {
            thClassName: "w-[160px] whitespace-nowrap",
            tdClassName: "w-[160px] whitespace-nowrap text-center",
        },
    },

    {
        ...buildActionsColumn({
            renderActions: (_, row) => <WarehouseRowActions row={row} />,
        }),
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                <WarehouseRowActions row={row} />
            </div>
        ),
        meta: {
            tdClassName: centerBody,
        },
    },
]
