import { type ColumnDef } from "@tanstack/react-table"

import type { AccessRole } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { RoleRowActions } from "./role-row-actions"

export function buildRoleColumns(
    onAssignPermissions: (role: AccessRole) => void
): ColumnDef<AccessRole>[] {
    return [
        buildIndexColumn<AccessRole>(),

        buildTextColumn<AccessRole>({
            accessorKey: "code",
            title: "Mã",
            width: 180,
            maxWidth: 220,
            textClassName: "font-medium text-sm",
        }),

        buildTextColumn<AccessRole>({
            accessorKey: "name",
            title: "Tên vai trò",
            width: 280,
            maxWidth: 320,
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
