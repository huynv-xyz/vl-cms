import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import type { Employee } from "../data/schema"
import { EmployeeRowActions } from "./employee-row-actions"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

function formatDate(value?: string | null) {
    if (!value) return "-"

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return `${match[3]}/${match[2]}/${match[1]}`

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")

    return `${day}/${month}/${date.getFullYear()}`
}

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

export const employeeColumns: ColumnDef<Employee>[] = [
    {
        ...buildIndexColumn<Employee>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<Employee>({
        accessorKey: "code",
        title: "Mã NV",
        width: 130,
        className: `w-[130px] whitespace-nowrap ${centerCell}`,
        render: (row) => (
            <OneLineText
                value={row.code}
                className="text-center font-mono text-sm font-semibold"
            />
        ),
    }),

    buildTextColumn<Employee>({
        accessorKey: "name",
        title: "Tên nhân viên",
        width: 240,
        className: `w-[240px] ${centerCell}`,
        render: (row) => (
            <OneLineText value={row.name} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn<Employee>({
        accessorKey: "birth_date",
        title: "Ngày sinh",
        width: 120,
        className: `w-[120px] whitespace-nowrap ${centerCell}`,
        render: (row) => formatDate(row.birth_date),
    }),

    buildTextColumn<Employee>({
        accessorKey: "identity_no",
        title: "CMND/CCCD",
        width: 150,
        className: `w-[150px] whitespace-nowrap ${centerCell}`,
        render: (row) => <OneLineText value={row.identity_no} className="text-center text-sm" />,
    }),

    buildTextColumn<Employee>({
        accessorKey: "identity_issue_date",
        title: "Ngày cấp",
        width: 120,
        className: `w-[120px] whitespace-nowrap ${centerCell}`,
        render: (row) => formatDate(row.identity_issue_date),
    }),

    buildTextColumn<Employee>({
        accessorKey: "identity_issue_place",
        title: "Nơi cấp",
        width: 180,
        className: `w-[180px] ${centerCell}`,
        render: (row) => (
            <OneLineText value={row.identity_issue_place} className="text-center text-sm" />
        ),
    }),

    buildTextColumn<Employee>({
        accessorKey: "permanent_address",
        title: "Địa chỉ",
        width: 320,
        className: `w-[320px] ${gridCell}`,
        render: (row) => <OneLineText value={row.permanent_address} className="text-sm" />,
    }),

    {
        ...buildBadgeColumn<Employee>({
            accessorKey: "status",
            title: "Trạng thái",
            width: 120,
            mapValueToLabel: (v) => (Number(v) === 1 ? "Còn làm" : "Đã nghỉ"),
            mapValueToVariant: (v) => (Number(v) === 1 ? "default" : "outline"),
            mapValueToClassName: (v) =>
                Number(v) === 1 ? "text-xs" : "text-xs text-muted-foreground",
        }),
        meta: {
            thClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableHiding: false,
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                <EmployeeRowActions row={row} />
            </div>
        ),
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
        },
    },
]
