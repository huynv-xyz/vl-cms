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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { listAccessRoles, type AccessRole } from "@/api/auth/role"
import { getUserRoles, updateUserRoles } from "@/api/auth/user-role"
import type { User } from "@/features/user/data/schema"

type Props = {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AssignRolesDialog({ user, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [initialSelected, setInitialSelected] = useState<Set<number>>(new Set())
    const [keyword, setKeyword] = useState("")

    const allRolesQuery = useQuery({
        queryKey: ["admin", "access-roles", "all"],
        queryFn: () => listAccessRoles({ page: 1, size: 1000 }),
        enabled: open,
        staleTime: 60_000,
    })

    const userRolesQuery = useQuery({
        queryKey: ["admin", "users", user?.id, "roles"],
        queryFn: () => getUserRoles(user!.id),
        enabled: open && !!user,
    })

    useEffect(() => {
        if (open && user) {
            setSelected(new Set())
            setInitialSelected(new Set())
            setKeyword("")
        }
    }, [open, user?.id])

    useEffect(() => {
        if (open && userRolesQuery.data) {
            const next = new Set(userRolesQuery.data.role_ids)
            setSelected(next)
            setInitialSelected(new Set(userRolesQuery.data.role_ids))
        }
    }, [open, userRolesQuery.data])

    const roles: AccessRole[] = allRolesQuery.data?.items ?? []
    const filteredRoles = useMemo(() => {
        const kw = keyword.trim().toLowerCase()
        if (!kw) return roles

        return roles.filter((role) =>
            `${role.code} ${role.name}`.toLowerCase().includes(kw)
        )
    }, [roles, keyword])

    const isReady = allRolesQuery.isSuccess && userRolesQuery.isSuccess
    const allVisibleSelected =
        filteredRoles.length > 0 && filteredRoles.every((role) => selected.has(role.id))

    const addedCount = useMemo(
        () => Array.from(selected).filter((id) => !initialSelected.has(id)).length,
        [selected, initialSelected]
    )

    const removedCount = useMemo(
        () => Array.from(initialSelected).filter((id) => !selected.has(id)).length,
        [selected, initialSelected]
    )

    const hasChanges = addedCount > 0 || removedCount > 0

    const toggle = (id: number) =>
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const toggleAllVisibleRoles = () => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (allVisibleSelected) {
                filteredRoles.forEach((role) => next.delete(role.id))
            } else {
                filteredRoles.forEach((role) => next.add(role.id))
            }
            return next
        })
    }

    const mutation = useMutation({
        mutationFn: () => updateUserRoles(user!.id, Array.from(selected)),
        onSuccess: () => {
            toast.success("Đã cập nhật vai trò cho người dùng")
            queryClient.invalidateQueries({
                queryKey: ["admin", "users", user?.id, "roles"],
            })
            queryClient.invalidateQueries({
                queryKey: ["admin", "users"],
            })
            queryClient.invalidateQueries({
                queryKey: ["admin", "access-roles"],
            })
            onOpenChange(false)
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Cập nhật thất bại")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Phân quyền người dùng
                    </DialogTitle>
                    <div className="text-muted-foreground text-sm">
                        {user?.name}{" "}
                        <span className="font-medium text-foreground">
                            ({user?.email})
                        </span>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground text-xs">Role đang chọn</div>
                        <div className="mt-1 text-2xl font-semibold">{selected.size}</div>
                    </div>
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground text-xs">Thêm mới</div>
                        <div className="mt-1 text-2xl font-semibold text-emerald-600">
                            {addedCount}
                        </div>
                    </div>
                    <div className="rounded-md border p-3">
                        <div className="text-muted-foreground text-xs">Sẽ gỡ</div>
                        <div className="mt-1 text-2xl font-semibold text-destructive">
                            {removedCount}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Tìm theo mã hoặc tên vai trò..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleAllVisibleRoles}
                        disabled={!isReady || filteredRoles.length === 0}
                        className="shrink-0"
                    >
                        {allVisibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                </div>

                <ScrollArea className="h-[380px] rounded-md border">
                    <div className="p-3">
                        {allRolesQuery.isLoading || userRolesQuery.isLoading ? (
                            <div className="text-muted-foreground text-sm">
                                Đang tải...
                            </div>
                        ) : roles.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                                Chưa có vai trò nào, hãy tạo vai trò trước.
                            </div>
                        ) : filteredRoles.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                                Không có vai trò phù hợp
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredRoles.map((role) => (
                                    <label
                                        key={role.id}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <Checkbox
                                                checked={selected.has(role.id)}
                                                disabled={!isReady}
                                                onCheckedChange={() => toggle(role.id)}
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">
                                                    {role.name}
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {role.code}
                                                </span>
                                            </span>
                                        </span>
                                        {selected.has(role.id) ? (
                                            <Badge variant="secondary">Đã chọn</Badge>
                                        ) : null}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="items-center justify-between gap-3 sm:justify-between">
                    <div className="text-muted-foreground text-sm">
                        {hasChanges
                            ? `Có ${addedCount} role thêm mới, ${removedCount} role sẽ gỡ.`
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
                            disabled={mutation.isPending || !user || !isReady || !hasChanges}
                        >
                            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
