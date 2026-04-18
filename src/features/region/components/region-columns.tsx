import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Region } from "../data/schema"
import { RegionRowActions } from "./region-row-actions"

export const regionColumns: ColumnDef<Region>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã khu vực",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên khu vực",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <RegionRowActions row={row} />,
    }),
]