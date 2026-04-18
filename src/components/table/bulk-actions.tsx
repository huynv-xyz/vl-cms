import { type ReactNode } from 'react'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions } from './table-bulk-actions'

export type BulkActionItem<TData> = {
    key: string
    icon?: ReactNode
    label: string
    variant?: React.ComponentProps<typeof Button>['variant']
    size?: React.ComponentProps<typeof Button>['size']
    className?: string
    disabled?: boolean | ((selectedItems: TData[], table: Table<TData>) => boolean)
    onClick: (selectedItems: TData[], table: Table<TData>) => void
}

export type BaseBulkActionsProps<TData> = {
    table: Table<TData>
    entityName?: string
    actions: BulkActionItem<TData>[]
}

export function BaseBulkActions<TData>({
    table,
    entityName = 'item',
    actions,
}: BaseBulkActionsProps<TData>) {
    const selectedRows = table.getSelectedRowModel().rows
    const selectedItems = selectedRows.map((r) => r.original)

    return (
        <DataTableBulkActions table={table} entityName={entityName}>
            {actions.map((action) => {
                const isDisabled =
                    typeof action.disabled === 'function'
                        ? action.disabled(selectedItems, table)
                        : action.disabled

                return (
                    <Tooltip key={action.key}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={action.variant ?? 'outline'}
                                size={action.size ?? 'icon'}
                                className={action.className}
                                onClick={() => action.onClick(selectedItems, table)}
                                aria-label={action.label}
                                title={action.label}
                                disabled={isDisabled}
                            >
                                {action.icon}
                                <span className='sr-only'>{action.label}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{action.label}</p>
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </DataTableBulkActions>
    )
}