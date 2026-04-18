import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'

export function buildSelectColumn<T>(): ColumnDef<T> {
    return {
        id: 'select',
        header: ({ table }) => (
            <div className='flex items-center justify-center'>
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                                ? 'indeterminate'
                                : false
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label='Chọn tất cả'
                    className='translate-y-[2px]'
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className='flex items-center justify-center'>
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label='Chọn dòng'
                    className='translate-y-[2px]'
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: 'w-12 text-center',
            thClassName: 'w-12 text-center',
            tdClassName: 'w-12 text-center',
        },
    }
}