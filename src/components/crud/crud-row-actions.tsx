import { useState } from "react"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Trash2, UserPen } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ==========================
// TYPES
// ==========================
export type CrudRowActionsProps<T> = {
    row?: T
    getId?: (row: T) => number | string

    // edit
    onEdit?: (row: T) => void
    onEditById?: (id: number | string) => void

    // delete
    onDelete?: (row: T) => void | Promise<void>

    // UI
    editLabel?: string
    deleteLabel?: string
    deleteSuccessMessage?: string
    deleteErrorMessage?: string
    confirmDeleteTitle?: string
    confirmDeleteMessage?: string
}

// ==========================
// COMPONENT
// ==========================
export function CrudRowActions<T>({
    row,
    getId,

    onEdit,
    onEditById,
    onDelete,

    editLabel = "Sửa",
    deleteLabel = "Xoá",
    deleteSuccessMessage = "Xoá thành công",
    deleteErrorMessage = "Xoá thất bại",
    confirmDeleteTitle = "Xác nhận xoá",
    confirmDeleteMessage = "Bạn có chắc muốn xoá bản ghi này không?",
}: CrudRowActionsProps<T>) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

    const hasEdit = !!onEdit || !!onEditById
    const hasDelete = !!onDelete

    if (!hasEdit && !hasDelete) return null

    // ==========================
    // HANDLERS
    // ==========================

    const handleEdit = () => {
        if (!row) return

        // ưu tiên dùng row
        if (onEdit) return onEdit(row)

        // fallback sang id
        if (onEditById && getId) {
            const id = getId(row)
            return onEditById(id)
        }
    }

    const handleDelete = async () => {
        if (!row || !onDelete || isDeleting) return

        try {
            setIsDeleting(true)
            await onDelete(row)
            toast.success(deleteSuccessMessage)
            setOpenDeleteDialog(false)
        } catch (error) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : deleteErrorMessage

            toast.error(message)
        } finally {
            setIsDeleting(false)
        }
    }

    // ==========================
    // RENDER
    // ==========================
    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                        disabled={isDeleting}
                    >
                        <DotsHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[160px]">
                    {hasEdit && (
                        <DropdownMenuItem
                            onClick={handleEdit}
                            disabled={isDeleting}
                        >
                            {editLabel}
                            <DropdownMenuShortcut>
                                <UserPen size={16} />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    )}

                    {hasEdit && hasDelete && <DropdownMenuSeparator />}

                    {hasDelete && (
                        <DropdownMenuItem
                            onClick={() => setOpenDeleteDialog(true)}
                            disabled={isDeleting}
                            className="text-red-500 focus:text-red-500"
                        >
                            {deleteLabel}
                            <DropdownMenuShortcut>
                                <Trash2 size={16} />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDeleteTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDeleteMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Huỷ
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                void handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Đang xoá..." : "Xoá"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}