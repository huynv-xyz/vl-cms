
import { buildSelectColumn } from "@/components/crud/build-select-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Province } from "../data/schema"
import { ProvinceRowActions } from "./province-row-actions"
import { ColumnDef } from "@tanstack/react-table"

export const provinceColumns: ColumnDef<Province>[] = [
    buildSelectColumn(),
    buildIndexColumn(),
    buildTextColumn({ accessorKey: "code", title: "Mã" }),
    buildTextColumn({ accessorKey: "name", title: "Tên" }),
    buildTextColumn({ accessorKey: "region_id", title: "Khu vực" }),

    buildActionsColumn({
        renderActions: (_, row) => <ProvinceRowActions row={row} />,
    }),
]
