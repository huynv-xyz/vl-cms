import { useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Key } from "lucide-react"

import { getUserRoles } from "@/api/auth/user-role"
import type { AccessRole } from "@/api/auth/role"
import type { User } from "@/features/user/data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function buildUserRoleColumns(
    onAssign: (user: User) => void,
    roles: AccessRole[],
): ColumnDef<User>[] {
    return [
        buildIndexColumn<User>(),

        buildTextColumn<User>({
            accessorKey: "email",
            title: "Email",
            width: 260,
            maxWidth: 260,
            textClassName: "font-medium text-sm",
        }),

        buildTextColumn<User>({
            accessorKey: "name",
            title: "Tên",
            width: 220,
            maxWidth: 220,
        }),

        {
            id: "roles",
            header: "Vai trò",
            size: 320,
            minSize: 240,
            cell: ({ row }) => (
                <UserRoleBadges userId={row.original.id} roles={roles} />
            ),
        },

        buildBadgeColumn<User>({
            accessorKey: "status",
            title: "Trạng thái",
            width: 120,
            mapValueToLabel: (value) =>
                Number(value) === 1 ? "Hoạt động" : "Tắt",
            mapValueToVariant: (value) =>
                Number(value) === 1 ? "default" : "outline",
            mapValueToClassName: () => "text-xs",
        }),

        buildActionsColumn<User>({
            renderActions: (_, row) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssign(row.original)}
                >
                    <Key className="mr-2 h-4 w-4" />
                    Phân quyền
                </Button>
            ),
        }),
    ]
}

function UserRoleBadges({
    userId,
    roles,
}: {
    userId: number
    roles: AccessRole[]
}) {
    const rolesById = useMemo(
        () => new Map(roles.map((role) => [role.id, role])),
        [roles]
    )

    const query = useQuery({
        queryKey: ["admin", "users", userId, "roles"],
        queryFn: () => getUserRoles(userId),
        staleTime: 60_000,
    })

    if (query.isLoading) {
        return <span className="text-muted-foreground text-xs">Đang tải...</span>
    }

    const roleIds = query.data?.role_ids ?? []
    if (roleIds.length === 0) {
        return <span className="text-muted-foreground text-xs">Chưa gán role</span>
    }

    const assignedRoles = roleIds.map((roleId) => rolesById.get(roleId)).filter(Boolean) as AccessRole[]
    const visibleRoles = assignedRoles.slice(0, 2)
    const missingRoleIds = roleIds.filter((roleId) => !rolesById.has(roleId))
    const visibleMissingRoleIds =
        visibleRoles.length < 2 ? missingRoleIds.slice(0, 2 - visibleRoles.length) : []
    const visibleCount = visibleRoles.length + visibleMissingRoleIds.length
    const hiddenCount = Math.max(0, roleIds.length - visibleCount)

    return (
        <div className="flex max-w-[300px] min-w-0 flex-wrap gap-1 overflow-hidden">
            {visibleRoles.map((role) => (
                <RoleBadge key={role.id} role={role} />
            ))}
            {visibleMissingRoleIds.map((roleId) => (
                <Badge key={roleId} variant="secondary" className="w-[128px] justify-start px-1.5 py-0 text-[11px]">
                    <span className="block min-w-0 truncate">Role #{roleId}</span>
                </Badge>
            ))}
            {hiddenCount > 0 ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-5 px-1.5 text-[11px]"
                        >
                            +{hiddenCount}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[420px] p-2">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold">
                                Vai trò của người dùng
                            </div>
                            <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                                {roleIds.length}
                            </Badge>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <tbody className="divide-y">
                                    {roleIds.map((roleId) => {
                                        const role = rolesById.get(roleId)
                                        return (
                                            <tr key={roleId}>
                                                <td className="py-1 pr-2 font-medium">
                                                    {role ? (
                                                        <RoleLink role={role} />
                                                    ) : (
                                                        `Role #${roleId}`
                                                    )}
                                                </td>
                                                <td className="py-1 font-mono text-muted-foreground">
                                                    {role?.code ?? "-"}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}
        </div>
    )
}

function RoleBadge({ role }: { role: AccessRole }) {
    return (
        <Badge
            asChild
            variant="secondary"
            className="w-[128px] min-w-0 justify-start px-1.5 py-0 text-[11px] hover:bg-secondary/80"
            title={`${role.code} - ${role.name}`}
        >
            <Link
                to="/access/roles"
                search={{ page: 1, size: 20, keyword: role.code }}
                target="_blank"
                rel="noreferrer"
            >
                <span className="block min-w-0 truncate">{role.name}</span>
            </Link>
        </Badge>
    )
}

function RoleLink({ role }: { role: AccessRole }) {
    return (
        <Link
            to="/access/roles"
            search={{ page: 1, size: 20, keyword: role.code }}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs font-medium hover:underline"
            title={`${role.code} - ${role.name}`}
        >
            {role.name}
        </Link>
    )
}
