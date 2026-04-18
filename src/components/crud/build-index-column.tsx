import type { ColumnDef } from "@tanstack/react-table"

export function buildIndexColumn<T>(): ColumnDef<T> {
    return {
        id: "stt",
        header: "#",
        cell: ({ row, table }) => {
            const pageIndex = table.getState().pagination?.pageIndex ?? 0
            const pageSize = table.getState().pagination?.pageSize ?? row.index + 1
            const stt = pageIndex * pageSize + row.index + 1

            return <span className="text-xs text-muted-foreground">{stt}</span>
        },
        size: 40,
        meta: {
            className: "ps-2",
            tdClassName: "ps-3",
        },
        enableSorting: false,
        enableHiding: false,
    }
}