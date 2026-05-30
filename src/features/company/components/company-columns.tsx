import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Company } from "../data/schema"
import { CompanyRowActions } from "./company-row-actions"

export const companyColumns: ColumnDef<Company>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên công ty",
    }),

    buildTextColumn({
        accessorKey: "address",
        title: "Địa chỉ",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <CompanyRowActions row={row} />,
    }),
]
