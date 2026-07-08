import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"

type BuildTextColumnOptions<T> = {
    id?: string
    accessorKey?: keyof T & string
    accessorFn?: (row: T) => any

    title: string
    width?: number
    maxWidth?: number

    emptyText?: string
    className?: string
    textClassName?: string
    enableSorting?: boolean

    render?: (row: T) => React.ReactNode
}
export function buildTextColumn<T>({
    accessorKey,
    accessorFn,
    title,
    width,
    maxWidth,
    emptyText = "-",
    className,
    textClassName = "text-sm",
    enableSorting = false,
    render,
}: BuildTextColumnOptions<T>): ColumnDef<T> {

    const widthClass = width ? `w-[${width}px]` : undefined
    const maxWidthStyle = maxWidth

    const base = {
        enableSorting,

        header: ({ column }: any) => (
            <DataTableColumnHeader column={column} title={title} />
        ),

        cell: ({ row }: any) => {
            if (render) return render(row.original)

            let value: any

            if (accessorFn) {
                value = accessorFn(row.original)
            } else if (accessorKey) {
                value = row.getValue(accessorKey)
            }

            const display =
                value === null || value === undefined || value === ""
                    ? emptyText
                    : String(value)

            return (
                <span
                    className={`block truncate ${textClassName}`}
                    style={maxWidthStyle ? { maxWidth: `${maxWidthStyle}px` } : undefined}
                >
                    {display}
                </span>
            )
        },

        size: width,

        meta: {
            thClassName:
                className ??
                (widthClass ? `${widthClass} whitespace-nowrap` : "whitespace-nowrap"),
            tdClassName: className ?? widthClass,
        },
    }

    if (accessorFn) {
        return {
            ...base,
            id: title,
            accessorFn,
        }
    }

    if (accessorKey) {
        return {
            ...base,
            accessorKey,
        }
    }

    return {
        ...base,
        id: title,
    }
}
