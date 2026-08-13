import { type ColumnDef } from "@tanstack/react-table"

import type { AccessRole } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Badge } from "@/components/ui/badge"
import { RoleRowActions } from "./role-row-actions"

export function buildRoleColumns(
    onAssignPermissions: (role: AccessRole) => void
): ColumnDef<AccessRole>[] {
    return [
        buildIndexColumn<AccessRole>(),

        {
            accessorKey: "code",
            header: "Mã",
            size: 180,
            minSize: 140,
            maxSize: 220,
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono">
                    {row.original.code}
                </Badge>
            ),
        },

        buildTextColumn<AccessRole>({
            accessorKey: "name",
            title: "Tên vai trò",
            width: 320,
            maxWidth: 380,
            textClassName: "font-medium text-sm",
        }),

        buildTextColumn<AccessRole>({
            accessorKey: "created_at",
            title: "Ngày tạo",
            width: 180,
        }),

        buildTextColumn<AccessRole>({
            accessorKey: "updated_at",
            title: "Cập nhật",
            width: 180,
        }),

        buildActionsColumn<AccessRole>({
            renderActions: (_, row) => (
                <RoleRowActions row={row} onAssignPermissions={onAssignPermissions} />
            ),
        }),
    ]
}
