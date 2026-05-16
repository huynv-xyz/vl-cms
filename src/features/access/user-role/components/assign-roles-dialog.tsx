import { useEffect, useState } from "react"
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
        }
    }, [open, user?.id])

    useEffect(() => {
        if (userRolesQuery.data) {
            setSelected(new Set(userRolesQuery.data.role_ids))
        }
    }, [userRolesQuery.data])

    const toggle = (id: number) =>
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const mutation = useMutation({
        mutationFn: () => updateUserRoles(user!.id, Array.from(selected)),
        onSuccess: () => {
            toast.success("Đã cập nhật vai trò cho người dùng")
            queryClient.invalidateQueries({
                queryKey: ["admin", "users", user?.id, "roles"],
            })
            onOpenChange(false)
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Cập nhật thất bại")
        },
    })

    const roles: AccessRole[] = allRolesQuery.data?.items ?? []
    const isReady = allRolesQuery.isSuccess && userRolesQuery.isSuccess
    const allRolesSelected =
        roles.length > 0 && roles.every((role) => selected.has(role.id))

    const toggleAllRoles = () => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (allRolesSelected) {
                roles.forEach((role) => next.delete(role.id))
            } else {
                roles.forEach((role) => next.add(role.id))
            }
            return next
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Phân quyền cho: {user?.name}{" "}
                        <span className="text-muted-foreground text-sm">
                            ({user?.email})
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleAllRoles}
                        disabled={!isReady || roles.length === 0}
                    >
                        {allRolesSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Button>
                </div>

                <ScrollArea className="h-[360px] rounded-md border p-3">
                    {allRolesQuery.isLoading || userRolesQuery.isLoading ? (
                        <div className="text-muted-foreground text-sm">
                            Đang tải...
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="text-muted-foreground text-sm">
                            Chưa có vai trò nào, hãy tạo vai trò trước.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {roles.map((r) => (
                                <label
                                    key={r.id}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={selected.has(r.id)}
                                        onCheckedChange={() => toggle(r.id)}
                                    />
                                    <span>
                                        <span className="font-medium">{r.code}</span>
                                        <span className="text-muted-foreground">
                                            {" "}— {r.name}
                                        </span>
                                    </span>
                                </label>
                            ))}
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
                        disabled={mutation.isPending || !user || !isReady}
                    >
                        {mutation.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
