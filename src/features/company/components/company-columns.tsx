import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { Company } from "../data/schema"
import { CompanyRowActions } from "./company-row-actions"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

function OneLineText({
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

export const companyColumns: ColumnDef<Company>[] = [
    {
        ...buildIndexColumn<Company>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn({
        accessorKey: "name",
        title: "Tên công ty",
        width: 320,
        className: `w-[320px] ${centerCell}`,
        render: (row) => (
            <OneLineText value={row.name} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn({
        accessorKey: "address",
        title: "Địa chỉ",
        width: 520,
        className: `w-[520px] ${gridCell}`,
        render: (row) => <OneLineText value={row.address} className="text-sm" />,
    }),

    {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableHiding: false,
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                <CompanyRowActions row={row} />
            </div>
        ),
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
        },
    },
]
