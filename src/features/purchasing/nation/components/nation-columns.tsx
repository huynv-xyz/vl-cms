import type { ColumnDef } from "@tanstack/react-table"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { Nation } from "../data/schema"
import { NationRowActions } from "./nation-row-actions"

export const nationColumns: ColumnDef<Nation>[] = [
    buildIndexColumn<Nation>(),

    buildTextColumn<Nation>({
        accessorKey: "code",
        title: "Mã quốc gia",
    }),

    buildTextColumn<Nation>({
        accessorKey: "name",
        title: "Tên quốc gia",
    }),

    buildTextColumn<Nation>({
        accessorKey: "created_at",
        title: "Ngày tạo",
    }),

    buildActionsColumn<Nation>({
        renderActions: (_, row) => <NationRowActions row={row} />,
    }),
]
