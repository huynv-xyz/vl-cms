import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { formatCurrency } from "@/lib/utils"

type BuildCurrencyColumnOptions<T> = {
    accessorKey?: keyof T & string
    title: string
    width?: number
    enableSorting?: boolean
    meta?: ColumnDef<T>["meta"]

    render?: (row: T) => number | string | undefined
}

export function buildCurrencyColumn<T>({
    accessorKey,
    title,
    width = 150,
    enableSorting = false,
    meta,
    render,
}: BuildCurrencyColumnOptions<T>): ColumnDef<T> {

    if (accessorKey) {
        return {
            accessorKey,
            enableSorting,

            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={title} />
            ),

            cell: ({ row }) => {
                const value = render
                    ? render(row.original)
                    : (row.getValue(accessorKey) as number | undefined)

                return (
                    <span className="whitespace-nowrap text-sm">
                        {typeof value === "number"
                            ? formatCurrency(value)
                            : value ?? "-"}
                    </span>
                )
            },

            size: width,
            meta: {
                thClassName: `w-[${width}px] whitespace-nowrap`,
                tdClassName: `w-[${width}px] whitespace-nowrap`,
                ...meta,
            },
        }
    }

    return {
        id: title,
        enableSorting,

        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),

        cell: ({ row }) => {
            const value = render?.(row.original)

            return (
                <span className="whitespace-nowrap text-sm">
                    {typeof value === "number"
                        ? formatCurrency(value)
                        : value ?? "-"}
                </span>
            )
        },

        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
            ...meta,
        },
    }
}