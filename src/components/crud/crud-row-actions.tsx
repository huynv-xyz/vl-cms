import { useState } from "react"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, // ✅ FIX WARNING
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type CrudRowActionsProps<T> = {
    row?: T
    getId?: (row: T) => number | string

    onEdit?: (row: T) => void
    onEditById?: (id: number | string) => void

    onDelete?: (row: T) => void | Promise<void>

    extraActions?: (row: T) => React.ReactNode
}

export function CrudRowActions<T>({
    row,
    getId,
    onEdit,
    onEditById,
    onDelete,
    extraActions,
}: CrudRowActionsProps<T>) {

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const hasEdit = !!onEdit || !!onEditById
    const hasDelete = !!onDelete
    const hasExtra = !!extraActions

    const handleEdit = () => {
        if (!row) return

        if (onEdit) return onEdit(row)

        if (onEditById && getId) {
            return onEditById(getId(row))
        }
    }

    const handleDelete = async () => {
        if (!row || !onDelete) return

        try {
            setIsDeleting(true)
            await onDelete(row)
            setOpenDeleteDialog(false)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[180px]">

                    {/* EDIT */}
                    {hasEdit && (
                        <DropdownMenuItem onClick={handleEdit}>
                            Sửa
                        </DropdownMenuItem>
                    )}

                    {/* EXTRA */}
                    {hasExtra && row && (
                        <>
                            {(hasEdit || hasDelete) && <DropdownMenuSeparator />}
                            {extraActions(row)}
                        </>
                    )}

                    {/* DELETE */}
                    {hasDelete && (
                        <>
                            {(hasEdit || hasExtra) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                                onClick={() => setOpenDeleteDialog(true)}
                                className="text-red-500"
                            >
                                Xoá
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* CONFIRM DELETE */}
            <AlertDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xoá
                        </AlertDialogTitle>

                        {/* ✅ FIX WARNING */}
                        <AlertDialogDescription>
                            Bạn có chắc muốn xoá bản ghi này không? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Huỷ
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDelete}
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