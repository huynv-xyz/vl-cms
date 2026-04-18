import { type ColumnDef, type Row } from "@tanstack/react-table"

type BuildActionsColumnOptions<T> = {
    header?: string
    renderActions: (original: T, row: Row<T>) => React.ReactNode
}

export function buildActionsColumn<T>({
    header = "Thao tác",
    renderActions,
}: BuildActionsColumnOptions<T>): ColumnDef<T> {
    return {
        id: "actions",
        header,
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2">
                {renderActions(row.original, row)}
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    }
}