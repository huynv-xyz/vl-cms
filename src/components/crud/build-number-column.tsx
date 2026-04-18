import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { formatNumber } from "@/lib/utils"

type BuildNumberColumnOptions<T> = {
    accessorKey: keyof T & string
    title: string
    width?: number
    emptyText?: string
    enableSorting?: boolean
}

export function buildNumberColumn<T>({
    accessorKey,
    title,
    width = 130,
    enableSorting = false,
}: BuildNumberColumnOptions<T>): ColumnDef<T> {
    return {
        accessorKey,
        enableSorting,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey) as number | undefined
            return (
                <span className="whitespace-nowrap text-sm">
                    {formatNumber(value)}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
        },
    }
}