import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { Badge } from "@/components/ui/badge"

type BaseOptions<T> = {
    title: string
    width?: number
    enableSorting?: boolean
    mapValueToLabel?: (value: unknown, row: T) => string
    mapValueToVariant?: (
        value: unknown,
        row: T
    ) => "default" | "secondary" | "destructive" | "outline"
    mapValueToClassName?: (value: unknown, row: T) => string | undefined
}

type AccessorKeyOptions<T> = BaseOptions<T> & {
    accessorKey: keyof T & string
}

type AccessorFnOptions<T> = BaseOptions<T> & {
    id: string
    accessorFn: (row: T) => unknown
}

type BuildBadgeColumnOptions<T> = AccessorKeyOptions<T> | AccessorFnOptions<T>

export function buildBadgeColumn<T>(
    options: BuildBadgeColumnOptions<T>
): ColumnDef<T> {
    const {
        title,
        width = 120,
        enableSorting = false,
        mapValueToLabel,
        mapValueToVariant,
        mapValueToClassName,
    } = options

    const buildCell = (value: unknown, original: T) => {
        const label = mapValueToLabel
            ? mapValueToLabel(value, original)
            : String(value ?? "-")

        const variant = mapValueToVariant
            ? mapValueToVariant(value, original)
            : "outline"

        const className = mapValueToClassName?.(value, original)

        return (
            <Badge variant={variant} className={className}>
                {label}
            </Badge>
        )
    }

    if ("accessorKey" in options) {
        const accessorKey = options.accessorKey

        return {
            accessorKey,
            enableSorting,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={title} />
            ),
            cell: ({ row }) => {
                const value = row.getValue(accessorKey)
                return buildCell(value, row.original)
            },
            size: width,
            meta: {
                thClassName: `w-[${width}px] whitespace-nowrap`,
                tdClassName: `w-[${width}px] whitespace-nowrap`,
            },
        }
    }

    const { id, accessorFn } = options

    return {
        id,
        accessorFn,
        enableSorting,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const value = accessorFn(row.original)
            return buildCell(value, row.original)
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
        },
    }
}