'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type BaseRowActionsProps<TData> = {
    row: Row<TData>
    onEdit?: (row: TData) => void
    onDelete?: (row: TData) => void
    extraMenuItemsTop?: React.ReactNode
    extraMenuItemsBottom?: React.ReactNode
}

export function BaseRowActions<TData>({
    row,
    onEdit,
    onDelete,
    extraMenuItemsTop,
    extraMenuItemsBottom,
}: BaseRowActionsProps<TData>) {
    const original = row.original

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='ghost'
                    className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
                >
                    <DotsHorizontalIcon className='h-4 w-4' />
                    <span className='sr-only'>Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[180px]'>
                {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(original)}>
                        Edit
                    </DropdownMenuItem>
                )}

                {extraMenuItemsTop}

                {(onEdit || extraMenuItemsTop || extraMenuItemsBottom) && <DropdownMenuSeparator />}

                {extraMenuItemsBottom}

                {onDelete && (
                    <>
                        {(extraMenuItemsBottom || extraMenuItemsTop) && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={() => onDelete(original)}>
                            Delete
                            <DropdownMenuShortcut>
                                <Trash2 size={16} />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
