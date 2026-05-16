import { type ColumnDef } from "@tanstack/react-table"

import type { PermissionRow } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { PermissionRowActions } from "./permission-row-actions"

export const permissionColumns: ColumnDef<PermissionRow>[] = [
    buildIndexColumn<PermissionRow>(),

    buildTextColumn<PermissionRow>({
        accessorKey: "module",
        title: "Module",
        width: 220,
        maxWidth: 260,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<PermissionRow>({
        accessorKey: "action",
        title: "Hành động",
        width: 140,
    }),

    buildTextColumn<PermissionRow>({
        accessorKey: "name",
        title: "Tên hiển thị",
        width: 320,
    }),

    buildActionsColumn<PermissionRow>({
        renderActions: (_, row) => <PermissionRowActions row={row} />,
    }),
]
