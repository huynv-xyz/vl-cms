import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Port } from "../data/schema"
import { PortRowActions } from "./port-row-actions"

export const portColumns: ColumnDef<Port>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên cảng",
    }),

    buildTextColumn({
        accessorKey: "created_at",
        title: "Ngày tạo",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <PortRowActions row={row} />,
    }),
]