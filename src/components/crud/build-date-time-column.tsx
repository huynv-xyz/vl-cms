import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"

type BuildDateTimeColumnOptions<T> = {
    accessorKey: keyof T & string
    title: string
    width?: number
    enableSorting?: boolean
}

export function buildDateTimeColumn<T>({
    accessorKey,
    title,
    width = 180,
    enableSorting = false,
}: BuildDateTimeColumnOptions<T>): ColumnDef<T> {
    return {
        accessorKey,
        enableSorting,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
        ),
        cell: ({ row }) => {
            const ts = row.getValue<string>(accessorKey)
            const n = ts ? Number(ts) : 0
            const d = n ? new Date(n) : null

            return (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {d ? d.toLocaleString() : "-"}
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