import { type ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"

import { getPermissionRoles } from "@/api/auth/permission"
import type { PermissionRow } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Badge } from "@/components/ui/badge"
import { PermissionRowActions } from "./permission-row-actions"

export const permissionColumns: ColumnDef<PermissionRow>[] = [
    buildIndexColumn<PermissionRow>(),

    {
        accessorKey: "module",
        header: "Module",
        size: 280,
        minSize: 220,
        cell: ({ row }) => (
            <div className="min-w-0 leading-tight">
                <div className="break-words text-sm font-medium">{row.original.module}</div>
                <div className="break-all text-xs text-muted-foreground">
                    /{row.original.module.replace(/\./g, "/")}
                </div>
            </div>
        ),
    },

    {
        accessorKey: "action",
        header: "Hành động",
        size: 140,
        minSize: 120,
        cell: ({ row }) => (
            <Badge variant="secondary" className="font-mono">
                {row.original.action}
            </Badge>
        ),
    },

    buildTextColumn<PermissionRow>({
        accessorKey: "name",
        title: "Tên hiển thị",
        width: 300,
        maxWidth: 420,
    }),

    {
        id: "roles",
        header: "Vai trò đang dùng",
        size: 320,
        minSize: 260,
        cell: ({ row }) => <PermissionRoleBadges permissionId={row.original.id} />,
    },

    buildActionsColumn<PermissionRow>({
        renderActions: (_, row) => <PermissionRowActions row={row} />,
    }),
]

function PermissionRoleBadges({ permissionId }: { permissionId: number }) {
    const query = useQuery({
        queryKey: ["admin", "permissions", permissionId, "roles"],
        queryFn: () => getPermissionRoles(permissionId),
        staleTime: 60_000,
    })

    if (query.isLoading) {
        return <span className="text-muted-foreground text-xs">Đang tải...</span>
    }

    const roles = query.data?.roles ?? []
    if (roles.length === 0) {
        return <span className="text-muted-foreground text-xs">Chưa role nào dùng</span>
    }

    const visibleRoles = roles.slice(0, 3)
    const hiddenCount = Math.max(0, roles.length - visibleRoles.length)

    return (
        <div className="flex max-w-[300px] flex-wrap gap-1">
            {visibleRoles.map((role) => (
                <Badge
                    key={role.id}
                    variant="secondary"
                    className="max-w-[140px] truncate"
                    title={`${role.code} - ${role.name}`}
                >
                    {role.name}
                </Badge>
            ))}
            {hiddenCount > 0 ? (
                <Badge variant="outline">+{hiddenCount}</Badge>
            ) : null}
        </div>
    )
}
