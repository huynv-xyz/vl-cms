export function columnsTemplate({ Entity }) {
    return `
import { buildSelectColumn } from "@/components/crud/build-select-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { ${Entity} } from "../data/schema"
import { ${Entity}RowActions } from "./${Entity.toLowerCase()}-row-actions"

export const ${Entity.toLowerCase()}Columns = [
    buildSelectColumn(),
    buildIndexColumn(),
    buildTextColumn({ accessorKey: "code", title: "Code" }),
    buildTextColumn({ accessorKey: "name", title: "Name" }),
    buildBadgeColumn({
        accessorKey: "status",
        title: "Status",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Active" : "Inactive"),
    }),
    buildActionsColumn({
        renderActions: (_, row) => <${Entity}RowActions row={row} />,
    }),
]
`
}