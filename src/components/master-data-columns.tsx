import type { ColumnDef, Row } from "@tanstack/react-table"
import type { ReactNode } from "react"

import { buildIndexColumn } from "@/components/crud/build-index-column"

export const masterGridCell = "border-r border-slate-200 last:border-r-0"
export const masterCenterCell = `${masterGridCell} text-center`

export function MasterOneLineText({
    value,
    className,
}: {
    value: unknown
    className?: string
}) {
    const display =
        value === null || value === undefined || value === "" ? "-" : String(value)

    return <span className={`block min-w-0 truncate ${className ?? ""}`}>{display}</span>
}

export function buildMasterIndexColumn<T>(): ColumnDef<T> {
    return {
        ...buildIndexColumn<T>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${masterCenterCell}`,
            tdClassName: `w-14 whitespace-nowrap ${masterCenterCell}`,
        },
    }
}

export function buildMasterActionsColumn<T>({
    renderActions,
}: {
    renderActions: (original: T, row: Row<T>) => ReactNode
}): ColumnDef<T> {
    return {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableHiding: false,
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                {renderActions(row.original, row)}
            </div>
        ),
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${masterCenterCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${masterCenterCell}`,
        },
    }
}
