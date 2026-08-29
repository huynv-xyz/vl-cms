import { useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { CopyCheck, Key } from "lucide-react"
import { toast } from "sonner"

import { getUserRoles, updateUserRoles } from "@/api/auth/user-role"
import type { AccessRole } from "@/api/auth/role"
import { listUsers } from "@/api/user"
import type { User } from "@/features/user/data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const TEST_EMAIL = "test@vlife.com"

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
            width: 140,
            mapValueToLabel: (value) =>
                Number(value) === 1 ? "Hoạt động" : "Tắt",
            mapValueToVariant: (value) =>
                Number(value) === 1 ? "default" : "outline",
            mapValueToClassName: () => "text-xs",
        }),

        {
            id: "actions",
            header: "Thao tác",
            size: 220,
            minSize: 220,
            cell: ({ row }) => {
                const user = row.original

                return (
                    <div className="flex items-center justify-end gap-2 pl-4">
                        <CopyRolesToTestButton user={user} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAssign(user)}
                        >
                            <Key className="mr-2 h-4 w-4" />
                            Phân quyền
                        </Button>
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: false,
            meta: {
                className: "text-right",
                thClassName: "pl-4 text-right",
                tdClassName: "pl-4 text-right whitespace-nowrap",
            },
        },
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

function CopyRolesToTestButton({ user }: { user: User }) {
    const queryClient = useQueryClient()
    const isTestUser = user.email.toLowerCase() === TEST_EMAIL

    const mutation = useMutation({
        mutationFn: async () => {
            const sourceRoles = await getUserRoles(user.id)
            const testUsers = await listUsers({
                page: 1,
                size: 10,
                email: TEST_EMAIL,
            })
            const testUser = testUsers.items.find(
                (item) => item.email.toLowerCase() === TEST_EMAIL
            )

            if (!testUser) {
                throw new Error(`Không tìm thấy tài khoản ${TEST_EMAIL}`)
            }

            await updateUserRoles(testUser.id, sourceRoles.role_ids)

            return {
                testUserId: testUser.id,
                roleCount: sourceRoles.role_ids.length,
            }
        },
        onSuccess: ({ testUserId, roleCount }) => {
            queryClient.invalidateQueries({
                queryKey: ["admin", "users", testUserId, "roles"],
            })
            queryClient.invalidateQueries({
                queryKey: ["admin", "users"],
            })
            toast.success(
                `Đã gán ${roleCount} vai trò của ${user.email} cho ${TEST_EMAIL}`
            )
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Gán quyền cho tài khoản test thất bại")
        },
    })

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    disabled={isTestUser || mutation.isPending}
                    onClick={(event) => {
                        event.stopPropagation()
                        mutation.mutate()
                    }}
                >
                    <CopyCheck className="h-4 w-4" />
                    <span className="sr-only">Gán quyền tương tự cho test</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {isTestUser
                    ? "Đây là tài khoản test"
                    : `Gán quyền tương tự cho ${TEST_EMAIL}`}
            </TooltipContent>
        </Tooltip>
    )
}
