import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
    getRolePermissions,
    getRoleUsers,
    updateRolePermissions,
} from "@/api/auth/role"
import {
    listPermissions,
    type PermissionItem,
} from "@/api/auth/permission"
import type { AccessRole } from "../data/schema"

type Props = {
    role: AccessRole | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AssignPermissionsDialog({ role, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [initialSelected, setInitialSelected] = useState<Set<number>>(new Set())
    const [keyword, setKeyword] = useState("")
    const [rolePermissionsLoaded, setRolePermissionsLoaded] = useState(false)

    const allPermsQuery = useQuery({
        queryKey: ["admin", "permissions", "all"],
        queryFn: fetchAllPermissions,
        enabled: open,
        staleTime: 60_000,
    })

    const rolePermsQuery = useQuery({
        queryKey: ["admin", "access-roles", role?.id, "permissions"],
        queryFn: () => getRolePermissions(role!.id),
        enabled: open && !!role,
    })

    const roleUsersQuery = useQuery({
        queryKey: ["admin", "access-roles", role?.id, "users"],
        queryFn: () => getRoleUsers(role!.id),
        enabled: open && !!role,
        staleTime: 30_000,
    })

    useEffect(() => {
        if (open && role) {
            setSelected(new Set())
            setInitialSelected(new Set())
            setRolePermissionsLoaded(false)
        }
    }, [open, role?.id])

    useEffect(() => {
        if (open && rolePermsQuery.data && role) {
            const roleId = Number((rolePermsQuery.data as any).role_id)
            if (roleId !== role.id) {
                setSelected(new Set())
                setInitialSelected(new Set())
                setRolePermissionsLoaded(false)
                return
            }

            const permissionIds = getPermissionIds(rolePermsQuery.data)

            if (!permissionIds) {
                setSelected(new Set())
                setInitialSelected(new Set())
                setRolePermissionsLoaded(false)
                toast.error("Không đọc được danh sách quyền hiện tại của vai trò")
                return
            }

            setSelected(new Set(permissionIds))
            setInitialSelected(new Set(permissionIds))
            setRolePermissionsLoaded(true)
        }
    }, [open, rolePermsQuery.data, role?.id])

    useEffect(() => {
        if (!open) {
            setKeyword("")
        }
    }, [open])

    const permissions: PermissionItem[] = allPermsQuery.data ?? []
    const isReady =
        allPermsQuery.isSuccess &&
        rolePermsQuery.isSuccess &&
        rolePermissionsLoaded

    const grouped = useMemo(() => {
        const m = new Map<string, PermissionItem[]>()
        const kw = normalizePermissionKeyword(keyword)

        for (const p of permissions) {
            if (kw) {
                const hay = normalizePermissionKeyword(
                    `${p.module} ${moduleToPath(p.module)} ${p.action} ${p.name ?? ""}`
                )
                if (!hay.includes(kw)) continue
            }
            const arr = m.get(p.module) ?? []
            arr.push(p)
            m.set(p.module, arr)
        }
        return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b))
    }, [permissions, keyword])

    const visiblePermissions = useMemo(
        () => grouped.flatMap(([, items]) => items),
        [grouped]
    )

    const allVisibleSelected =
        visiblePermissions.length > 0 &&
        visiblePermissions.every((it) => selected.has(it.id))

    const addedCount = useMemo(
        () => Array.from(selected).filter((id) => !initialSelected.has(id)).length,
        [selected, initialSelected]
    )

    const removedCount = useMemo(
        () => Array.from(initialSelected).filter((id) => !selected.has(id)).length,
        [selected, initialSelected]
    )

    const hasChanges = addedCount > 0 || removedCount > 0

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleGroup = (items: PermissionItem[]) => {
        setSelected((prev) => {
            const next = new Set(prev)
            const allOn = items.every((it) => next.has(it.id))
            if (allOn) {
                items.forEach((it) => next.delete(it.id))
            } else {
                items.forEach((it) => next.add(it.id))
            }
            return next
        })
    }

    const toggleAllVisible = () => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (allVisibleSelected) {
                visiblePermissions.forEach((it) => next.delete(it.id))
            } else {
                visiblePermissions.forEach((it) => next.add(it.id))
            }
            return next
        })
    }

    const mutation = useMutation({
        mutationFn: () => {
            if (!rolePermissionsLoaded) {
                throw new Error("Chưa tải xong quyền hiện tại, vui lòng chờ rồi lưu lại")
            }
            return updateRolePermissions(role!.id, Array.from(selected))
        },
        onSuccess: () => {
            toast.success("Đã cập nhật quyền cho vai trò")
            queryClient.invalidateQueries({
                queryKey: ["admin", "access-roles", role?.id, "permissions"],
            })
            queryClient.invalidateQueries({
                queryKey: ["admin", "access-roles"],
            })
            queryClient.invalidateQueries({
                queryKey: ["admin", "permissions"],
                exact: false,
            })
            queryClient.invalidateQueries({
                queryKey: ["my-permissions"],
            })
            onOpenChange(false)
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Cập nhật thất bại")
        },
    })

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[min(96vw,980px)] gap-0 p-0 sm:max-w-none">
                <SheetHeader className="border-b px-6 py-5">
                    <SheetTitle className="text-lg">
                        Quản lý quyền vai trò
                    </SheetTitle>
                    <SheetDescription>
                        {role?.name}{" "}
                        <span className="font-medium text-foreground">
                            ({role?.code})
                        </span>
                    </SheetDescription>
                </SheetHeader>

                <div className="grid min-h-0 flex-1 gap-4 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="flex min-h-0 flex-col gap-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <SummaryBox label="Đang chọn" value={selected.size} />
                            <SummaryBox label="Thêm mới" value={addedCount} className="text-emerald-600" />
                            <SummaryBox label="Sẽ gỡ" value={removedCount} className="text-destructive" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Tìm quyền hoặc nhập route, ví dụ /transactions..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={toggleAllVisible}
                                disabled={!isReady || visiblePermissions.length === 0}
                                className="shrink-0"
                            >
                                {allVisibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </Button>
                        </div>

                        <ScrollArea className="min-h-0 flex-1 rounded-md border">
                            <div className="p-4">
                                {allPermsQuery.isLoading || rolePermsQuery.isLoading ? (
                                    <div className="text-muted-foreground text-sm">
                                        Đang tải...
                                    </div>
                                ) : grouped.length === 0 ? (
                                    <div className="text-muted-foreground text-sm">
                                        Không có quyền phù hợp
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {grouped.map(([module, items]) => {
                                            const selectedCount = items.filter((it) =>
                                                selected.has(it.id)
                                            ).length
                                            const groupChecked =
                                                selectedCount === 0
                                                    ? false
                                                    : selectedCount === items.length
                                                        ? true
                                                        : "indeterminate"

                                            return (
                                                <div key={module} className="space-y-2">
                                                    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
                                                        <label className="flex min-w-0 cursor-pointer items-center gap-2">
                                                            <Checkbox
                                                                checked={groupChecked}
                                                                disabled={!isReady}
                                                                onCheckedChange={() => toggleGroup(items)}
                                                            />
                                                            <span className="min-w-0 leading-tight">
                                                                <span className="block break-words text-sm font-semibold">
                                                                    {module}
                                                                </span>
                                                                <span className="block break-all text-xs text-muted-foreground">
                                                                    {moduleToPath(module)}
                                                                </span>
                                                            </span>
                                                        </label>
                                                        <Badge variant="outline">
                                                            {selectedCount}/{items.length}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2 pl-6">
                                                        {items.map((p) => (
                                                            <label
                                                                key={p.id}
                                                                className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-snug hover:bg-muted/60"
                                                            >
                                                                <Checkbox
                                                                    checked={selected.has(p.id)}
                                                                    disabled={!isReady}
                                                                    onCheckedChange={() => toggle(p.id)}
                                                                    className="mt-0.5"
                                                                />
                                                                <span className="min-w-0">
                                                                    <span className="block break-words font-medium text-muted-foreground">
                                                                        {p.action}
                                                                    </span>
                                                                    {p.name ? (
                                                                        <span className="block whitespace-normal break-words">
                                                                            {p.name}
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex min-h-0 flex-col rounded-md border">
                        <div className="border-b p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold">
                                        Người dùng bị ảnh hưởng
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        Các tài khoản đang được gán vai trò này
                                    </div>
                                </div>
                                <Badge variant="outline">
                                    {roleUsersQuery.data?.users.length ?? 0}
                                </Badge>
                            </div>
                        </div>

                        <ScrollArea className="min-h-0 flex-1">
                            <div className="space-y-2 p-3">
                                {roleUsersQuery.isLoading ? (
                                    <div className="text-muted-foreground text-sm">
                                        Đang tải...
                                    </div>
                                ) : (roleUsersQuery.data?.users.length ?? 0) === 0 ? (
                                    <div className="text-muted-foreground text-sm">
                                        Chưa có người dùng nào dùng vai trò này.
                                    </div>
                                ) : (
                                    roleUsersQuery.data?.users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="rounded-md border px-3 py-2"
                                        >
                                            <div className="truncate text-sm font-medium">
                                                {user.name}
                                            </div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </div>
                                            <Badge
                                                variant={Number(user.status) === 1 ? "secondary" : "outline"}
                                                className="mt-2"
                                            >
                                                {Number(user.status) === 1 ? "Hoạt động" : "Tắt"}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <SheetFooter className="flex-row items-center justify-between border-t px-6 py-4 sm:flex-row">
                    <div className="text-muted-foreground text-sm">
                        {hasChanges
                            ? `Có ${addedCount} quyền thêm mới, ${removedCount} quyền sẽ gỡ.`
                            : "Chưa có thay đổi."}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                        >
                            Huỷ
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !role || !isReady || !hasChanges}
                        >
                            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

function SummaryBox({
    label,
    value,
    className,
}: {
    label: string
    value: number
    className?: string
}) {
    return (
        <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className={`mt-1 text-2xl font-semibold ${className ?? ""}`}>
                {value}
            </div>
        </div>
    )
}

function getPermissionIds(data: unknown): number[] | null {
    const x = data as any
    const raw =
        x?.permission_ids ??
        x?.permissionIds ??
        x?.permissions?.map((permission: any) => permission?.id)

    if (!Array.isArray(raw)) return null

    return raw
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
}

function moduleToPath(module: string) {
    return `/${module.replace(/\./g, "/")}`
}

function normalizePermissionKeyword(value: string) {
    return value.trim().toLowerCase().replace(/^\/+/, "").replace(/\//g, ".")
}

async function fetchAllPermissions() {
    const size = 500
    const first = await listPermissions({ page: 1, size })
    const items = [...(first.items ?? [])]
    const totalPage = Number(first.total_page ?? 1)

    for (let page = 2; page <= totalPage; page += 1) {
        const res = await listPermissions({ page, size })
        items.push(...(res.items ?? []))
    }

    return items
}
