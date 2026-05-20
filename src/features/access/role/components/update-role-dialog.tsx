import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save } from "lucide-react"

import {
    updateAccessRole,
    type UpdateAccessRoleRequest,
} from "@/api/auth/role"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccessRole } from "../data/schema"

type Props = {
    role: AccessRole
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateRoleDialog({ role, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [code, setCode] = useState("")
    const [name, setName] = useState("")

    useEffect(() => {
        if (!open) return

        setCode(role.code ?? "")
        setName(role.name ?? "")
    }, [open, role.id, role.code, role.name])

    const mutation = useMutation({
        mutationFn: (body: UpdateAccessRoleRequest) => updateAccessRole(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin", "access-roles"] })
            toast.success("Đã cập nhật vai trò")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.message ?? "Cập nhật vai trò thất bại")
        },
    })

    const submit = () => {
        const nextCode = code.trim()
        const nextName = name.trim()

        if (!nextCode) {
            toast.error("Mã vai trò không được để trống")
            return
        }
        if (!nextName) {
            toast.error("Tên vai trò không được để trống")
            return
        }

        mutation.mutate({
            id: role.id,
            code: nextCode,
            name: nextName,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Cập nhật vai trò</DialogTitle>
                    <DialogDescription>
                        Chỉ sửa thông tin vai trò. Quyền của vai trò được chỉnh riêng ở nút Gán quyền.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-code">Mã vai trò</Label>
                        <Input
                            id="role-code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            disabled={mutation.isPending}
                            placeholder="VD: ADMIN"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role-name">Tên vai trò</Label>
                        <Input
                            id="role-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            disabled={mutation.isPending}
                            placeholder="VD: Quản trị hệ thống"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={mutation.isPending}
                        onClick={() => onOpenChange(false)}
                    >
                        Đóng
                    </Button>
                    <Button type="button" disabled={mutation.isPending} onClick={submit}>
                        <Save className="mr-2 h-4 w-4" />
                        {mutation.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
