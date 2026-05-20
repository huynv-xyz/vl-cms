import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
    getRolePermissions,
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

    useEffect(() => {
        if (open && role) {
            setSelected(new Set())
            setRolePermissionsLoaded(false)
        }
    }, [open, role?.id])

    useEffect(() => {
        if (open && rolePermsQuery.data && role) {
            const roleId = Number((rolePermsQuery.data as any).role_id)
            if (roleId !== role.id) {
                setSelected(new Set())
                setRolePermissionsLoaded(false)
                return
            }

            const permissionIds = getPermissionIds(rolePermsQuery.data)

            if (!permissionIds) {
                setSelected(new Set())
                setRolePermissionsLoaded(false)
                toast.error("Không đọc được danh sách quyền hiện tại của vai trò")
                return
            }

            setSelected(new Set(permissionIds))
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
                queryKey: ["my-permissions"],
            })
            onOpenChange(false)
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Cập nhật thất bại")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Gán quyền cho vai trò: {role?.name}{" "}
                        <span className="text-muted-foreground text-sm">
                            ({role?.code})
                        </span>
                    </DialogTitle>
                </DialogHeader>

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

                <ScrollArea className="h-[420px] rounded-md border p-3">
                    {allPermsQuery.isLoading || rolePermsQuery.isLoading ? (
                        <div className="text-muted-foreground text-sm">
                            Đang tải...
                        </div>
                    ) : grouped.length === 0 ? (
                        <div className="text-muted-foreground text-sm">
                            Không có quyền phù hợp
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {grouped.map(([module, items]) => {
                                const allOn = items.every((it) =>
                                    selected.has(it.id)
                                )
                                return (
                                    <div key={module} className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={allOn}
                                                disabled={!isReady}
                                                onCheckedChange={() => toggleGroup(items)}
                                            />
                                            <div className="leading-tight">
                                                <div className="font-semibold text-sm">
                                                    {module}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {moduleToPath(module)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 pl-6">
                                            {items.map((p) => (
                                                <label
                                                    key={p.id}
                                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={selected.has(p.id)}
                                                        disabled={!isReady}
                                                        onCheckedChange={() => toggle(p.id)}
                                                    />
                                                    <span>
                                                        <span className="text-muted-foreground">
                                                            {p.action}
                                                        </span>
                                                        {p.name ? ` — ${p.name}` : ""}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={mutation.isPending}
                    >
                        Huỷ
                    </Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !role || !isReady}
                    >
                        {mutation.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
