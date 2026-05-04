import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatNumber } from "@/lib/utils"
import type { InventoryLot } from "../data/schema"

export const inventoryLotColumns: ColumnDef<InventoryLot>[] = [
    buildIndexColumn(),

    {
        id: "product_code",
        header: "Mã sản phẩm",
        cell: ({ row }) => row.original.product?.code ?? "-",
    },

    {
        accessorKey: "product_name",
        header: "Tên sản phẩm",
        cell: ({ row }) => row.original.product?.name ?? "-",
    },

    {
        id: "warehouse",
        header: "Kho",
        cell: ({ row }) =>
            row.original.warehouse?.name ?? "-",
    },

    {
        accessorKey: "lot_no",
        header: "Số lô",
    },

    {
        accessorKey: "inbound_date",
        header: "Ngày nhập",
    },

    {
        accessorKey: "source_type",
        header: "Nguồn",
    },

    {
        accessorKey: "quantity_in",
        header: "SL nhập",
        cell: ({ row }) => (
            <span>
                {formatNumber(row.original.quantity_in ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "quantity_remaining",
        header: "SL còn",
        cell: ({ row }) => (
            <span className="font-bold text-green-600">
                {formatNumber(row.original.quantity_remaining ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "unit_cost",
        header: "Giá vốn",
        cell: ({ row }) => (
            <span>
                {formatNumber(row.original.unit_cost ?? 0)}
            </span>
        ),
    },

    {
        id: "total_value",
        header: "Giá trị tồn",
        cell: ({ row }) => {
            const qty = row.original.quantity_remaining ?? 0
            const cost = row.original.unit_cost ?? 0

            return (
                <span className="font-semibold">
                    {formatNumber(qty * cost)}
                </span>
            )
        },
    },
]