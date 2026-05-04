import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatNumber } from "@/lib/utils"
import type { InventorySummary } from "../data/schema"

export const summaryColumns: ColumnDef<InventorySummary>[] = [
    buildIndexColumn(),


    {
        id: "product",
        header: "Mã sản phẩm",
        cell: ({ row }) => `${row.original.product.code}`
    },

    {
        id: "product",
        header: "Tên sản phẩm",
        cell: ({ row }) => `${row.original.product.name}`
    },

    {
        id: "warehouse",
        header: "Kho",
        cell: ({ row }) => row.original.warehouse?.name ?? "-",
    },

    {
        accessorKey: "total_quantity",
        header: "Số lượng tồn kho",
        cell: ({ row }) => (
            <span className="font-medium">
                {formatNumber(row.original.total_quantity ?? 0)}
            </span>
        ),
    }
]