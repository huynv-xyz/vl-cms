import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { actions } = useAuthStore()

  const handleSignOut = async () => {
    await actions.logout()

    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Đăng xuất"
      desc="Bạn có chắc chắn muốn đăng xuất không? Bạn sẽ cần phải đăng nhập lại để truy cập tài khoản của mình."
      confirmText="Đăng xuất"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  )
}
