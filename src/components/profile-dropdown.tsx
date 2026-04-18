import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useAuthStore } from '@/stores/auth-store'

export function ProfileDropdown() {
    const [open, setOpen] = useDialogState()
    const { state } = useAuthStore()

    const user = state.user

    if (!user) return null // Không có user -> không hiển thị dropdown

    // Lấy chữ cái viết tắt từ tên
    const initials = user.name
        ? user.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'US'

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={user.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-sm leading-none font-medium">{user.name}</p>
                            <p className="text-muted-foreground text-xs leading-none">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setOpen(true)}
                    >
                        Đăng xuất
                        <DropdownMenuShortcut className="text-current">
                            ⇧⌘Q
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <SignOutDialog open={!!open} onOpenChange={setOpen} />
        </>
    )
}
