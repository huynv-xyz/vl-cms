import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { changeUserPassword } from "@/api/user"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { User } from "../data/schema"

type Props = { user: User; open: boolean; onOpenChange: (open: boolean) => void }

export function ChangePasswordDialog({ user, open, onOpenChange }: Props) {
    const [password, setPassword] = useState("")
    const [confirmation, setConfirmation] = useState("")

    useEffect(() => {
        if (open) {
            setPassword("")
            setConfirmation("")
        }
    }, [open])

    const mutation = useMutation({
        mutationFn: () => changeUserPassword(user.id, password),
        onSuccess: () => {
            toast.success("Đã đổi mật khẩu")
            onOpenChange(false)
        },
        onError: (error: any) => toast.error(error?.message ?? "Đổi mật khẩu thất bại"),
    })

    const error = password.length > 0 && password.length < 6
        ? "Mật khẩu phải có ít nhất 6 ký tự"
        : confirmation.length > 0 && password !== confirmation
          ? "Mật khẩu xác nhận không khớp"
          : null
    const canSubmit = password.length >= 6 && password === confirmation

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Đổi mật khẩu</DialogTitle>
                    <DialogDescription>
                        Đặt mật khẩu mới cho {user.name} ({user.email}).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Mật khẩu mới</Label>
                        <PasswordInput id="new-password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                        <PasswordInput id="confirm-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Huỷ</Button>
                    <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
                        {mutation.isPending ? "Đang lưu..." : "Đổi mật khẩu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
