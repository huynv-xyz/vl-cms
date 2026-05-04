import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatNumber } from "@/lib/utils"
import { DOC_TYPE_META, type InventoryLedgerReportRow } from "../data/schema"
import { Badge } from "@/components/ui/badge"

export const inventoryLedgerColumns: ColumnDef<InventoryLedgerReportRow>[] = [
    buildIndexColumn(),

    { accessorKey: "posting_date", header: "Ngày chứng từ" },

    { accessorKey: "product_code", header: "Mã SP" },

    { accessorKey: "product_name", header: "Tên sản phẩm" },

    { accessorKey: "warehouse_name", header: "Kho" },

    {

        accessorKey: "doc_type",

        header: "Loại",

        cell: ({ row }) => {

            const meta = DOC_TYPE_META[row.original.doc_type]

            return (

                <span className={`px-2 py-1 rounded text-sm ${meta?.color || ""}`}>

                    {meta?.label ?? row.original.doc_type}

                </span>

            )

        },

    },

    { accessorKey: "doc_no", header: "Số chứng từ" },

    {
        accessorKey: "quantity_in",
        header: "Nhập",
        cell: ({ row }) => formatNumber(row.original.quantity_in ?? 0),
    },

    {
        accessorKey: "quantity_out",
        header: "Xuất",
        cell: ({ row }) => formatNumber(row.original.quantity_out ?? 0),
    },

    {
        accessorKey: "balance_quantity",
        header: "Tồn sau phát sinh",
        cell: ({ row }) => (
            <span className="font-bold">
                {formatNumber(row.original.balance_quantity ?? 0)}
            </span>
        ),
    },
]