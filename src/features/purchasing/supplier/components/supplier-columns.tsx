import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Supplier } from "../data/schema"
import { SupplierRowActions } from "./supplier-row-actions"

export const supplierColumns: ColumnDef<Supplier>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã NCC",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên NCC",
    }),

    {
        accessorKey: "nation_id",
        header: "Quốc gia",
        cell: ({ row }) => row.original.nation?.name ?? "",
    },

    buildActionsColumn({
        renderActions: (_, row) => <SupplierRowActions row={row} />,
    }),
]