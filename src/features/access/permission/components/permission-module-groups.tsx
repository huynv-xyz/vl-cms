import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"

import {
    deletePermission,
    getPermissionRoles,
    type PermissionRole,
} from "@/api/auth/permission"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import type { PermissionRow } from "../data/schema"
import { useAccessPermissions } from "./permissions-provider"

type Props = {
    data: PermissionRow[]
    keyword: string
}

export function PermissionModuleGroups({ data, keyword }: Props) {
    const grouped = useMemo(() => {
        const kw = normalize(keyword)
        const map = new Map<string, PermissionRow[]>()

        for (const permission of data) {
            const hay = normalize(
                `${permission.module} ${moduleToPath(permission.module)} ${permission.action} ${permission.name ?? ""}`
            )
            if (kw && !hay.includes(kw)) continue

            const items = map.get(permission.module) ?? []
            items.push(permission)
            map.set(permission.module, items)
        }

        return Array.from(map.entries())
            .map(([module, items]) => ({
                module,
                items: items.sort((a, b) => a.action.localeCompare(b.action)),
            }))
            .sort((a, b) => a.module.localeCompare(b.module))
    }, [data, keyword])

    if (grouped.length === 0) {
        return (
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Không có quyền phù hợp.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {grouped.map((group) => (
                <section key={group.module} className="overflow-hidden rounded-md border">
                    <div className="flex min-w-0 items-center justify-between gap-3 border-b bg-muted/40 px-3 py-1.5">
                        <div className="flex min-w-0 items-baseline gap-2">
                            <h3 className="truncate text-sm font-semibold">
                                {group.module}
                            </h3>
                            <span className="truncate text-xs text-muted-foreground">
                                {moduleToPath(group.module)}
                            </span>
                        </div>
                        <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                            {group.items.length}
                        </Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] table-fixed text-sm">
                            <colgroup>
                                <col className="w-[170px]" />
                                <col />
                                <col className="w-[420px]" />
                                <col className="w-[44px]" />
                            </colgroup>
                            <thead>
                                <tr className="border-b text-left text-[11px] font-medium text-muted-foreground">
                                    <th className="px-3 py-1.5">Hành động</th>
                                    <th className="px-3 py-1.5">Tên hiển thị</th>
                                    <th className="px-3 py-1.5">Vai trò đang dùng</th>
                                    <th className="px-2 py-1.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {group.items.map((permission) => (
                                    <tr key={permission.id} className="align-top hover:bg-muted/30">
                                        <td className="px-3 py-1.5">
                                            <Badge
                                                variant="secondary"
                                                className="max-w-full truncate px-1.5 py-0 font-mono text-[11px]"
                                                title={permission.action}
                                            >
                                                {permission.action}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="line-clamp-2 leading-snug" title={permission.name ?? ""}>
                                                {permission.name || "-"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <PermissionRoles permissionId={permission.id} />
                                        </td>
                                        <td className="px-2 py-1">
                                            <PermissionActions permission={permission} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    )
}

function PermissionRoles({ permissionId }: { permissionId: number }) {
    const query = useQuery({
        queryKey: ["admin", "permissions", permissionId, "roles"],
        queryFn: () => getPermissionRoles(permissionId),
        staleTime: 60_000,
    })

    if (query.isLoading) {
        return <span className="text-xs text-muted-foreground">Đang tải...</span>
    }

    const roles = query.data?.roles ?? []
    if (roles.length === 0) {
        return <span className="text-xs text-muted-foreground">Chưa dùng</span>
    }

    const visibleRoles = roles.slice(0, 2)
    const hiddenCount = Math.max(0, roles.length - visibleRoles.length)

    return (
        <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1 overflow-hidden">
            {visibleRoles.map((role) => (
                <RoleBadge key={role.id} role={role} />
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
                                Vai trò đang dùng quyền này
                            </div>
                            <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                                {roles.length}
                            </Badge>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <tbody className="divide-y">
                                    {roles.map((role) => (
                                        <tr key={role.id}>
                                            <td className="py-1 pr-2 font-medium">
                                                <RoleLink role={role} />
                                            </td>
                                            <td className="py-1 font-mono text-muted-foreground">
                                                {role.code}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}
        </div>
    )
}

function RoleBadge({ role }: { role: PermissionRole }) {
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

function RoleLink({ role }: { role: PermissionRole }) {
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

function PermissionActions({ permission }: { permission: PermissionRow }) {
    const { openEdit } = useAccessPermissions()
    const queryClient = useQueryClient()

    return (
        <CrudRowActions<PermissionRow>
            row={permission}
            onEdit={(row) => openEdit(row)}
            onDelete={async (row) => {
                try {
                    await deletePermission(row.id)
                    toast.success("Đã xoá quyền")
                    queryClient.invalidateQueries({
                        queryKey: ["admin", "permissions"],
                        exact: false,
                    })
                } catch (err: any) {
                    toast.error(err?.message ?? "Xoá thất bại")
                }
            }}
        />
    )
}

function moduleToPath(module: string) {
    return `/${module.replace(/\./g, "/")}`
}

function normalize(value: string) {
    return value.trim().toLowerCase().replace(/^\/+/, "").replace(/\//g, ".")
}
