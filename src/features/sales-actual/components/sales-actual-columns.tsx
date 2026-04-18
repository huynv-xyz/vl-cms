import { type ColumnDef } from "@tanstack/react-table"
import type { SalesActualItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"

function formatNumber(value?: number) {
    if (value == null) return "-"
    return value.toLocaleString()
}

function calcPercent(actual?: number, target?: number) {
    if (actual == null || target == null || target === 0) return "-"
    return `${((actual / target) * 100).toFixed(1)}%`
}

function centeredHeader(title: string) {
    return <div className="w-full text-center font-semibold">{title}</div>
}

function textCell(value?: string | number | null) {
    if (value == null || value === "") return "-"
    return <div className="w-full whitespace-nowrap text-sm">{value}</div>
}

function numberCell(value?: number) {
    return (
        <div className="w-full text-center whitespace-nowrap text-sm">
            {formatNumber(value)}
        </div>
    )
}

function percentCell(actual?: number, target?: number) {
    return (
        <div className="w-full text-center whitespace-nowrap text-sm">
            {calcPercent(actual, target)}
        </div>
    )
}

const borderLeft = "border-l border-border"
const borderRight = "border-r border-border"
const borderX = "border-x border-border"

export const salesActualColumns: ColumnDef<SalesActualItem>[] = [
    buildIndexColumn<SalesActualItem>(),

    {
        id: "employee",
        accessorFn: (row) => row.employee?.name || row.employee?.code || "",
        header: () => <>Nhân viên</>,
        cell: ({ row }) => {
            const employee = row.original.employee
            return textCell(employee?.name)
        },
        size: 220,
        meta: {
            thClassName: "w-[220px] whitespace-nowrap",
            tdClassName: "whitespace-nowrap",
        },
    },

    {
        id: "period",
        accessorFn: (row) => row.actual?.period,
        header: () => <>Kỳ</>,
        cell: ({ row }) => textCell(row.original.actual?.period),
        size: 100,
        meta: {
            thClassName: `w-[100px] whitespace-nowrap ${borderRight}`,
            tdClassName: `whitespace-nowrap ${borderRight}`,
        },
    },

    {
        id: "bon_goc_group",
        header: () => centeredHeader("Bón góc"),
        meta: {
            thClassName: borderX,
        },
        columns: [
            {
                id: "bon_goc_target",
                accessorFn: (row) => row.target?.bon_goc,
                header: () => centeredHeader("Chỉ tiêu"),
                cell: ({ row }) => numberCell(row.original.target?.bon_goc),
                size: 120,
                meta: {
                    thClassName: `w-[120px] whitespace-nowrap ${borderLeft}`,
                    tdClassName: `text-center whitespace-nowrap ${borderLeft}`,
                },
            },
            {
                id: "bon_goc_actual",
                accessorFn: (row) => row.actual?.bon_goc,
                header: () => centeredHeader("Thực hiện"),
                cell: ({ row }) => numberCell(row.original.actual?.bon_goc),
                size: 120,
                meta: {
                    thClassName: "w-[120px] whitespace-nowrap",
                    tdClassName: "text-center whitespace-nowrap",
                },
            },
            {
                id: "bon_goc_percent",
                header: () => centeredHeader("Tỉ lệ hoàn thành"),
                cell: ({ row }) =>
                    percentCell(
                        row.original.actual?.bon_goc,
                        row.original.target?.bon_goc,
                    ),
                size: 140,
                meta: {
                    thClassName: `w-[140px] whitespace-nowrap ${borderRight}`,
                    tdClassName: `text-center whitespace-nowrap ${borderRight}`,
                },
            },
        ],
    },

    {
        id: "bon_la_bot_group",
        header: () => centeredHeader("Bón lá bột"),
        meta: {
            thClassName: borderX,
        },
        columns: [
            {
                id: "bon_la_bot_target",
                accessorFn: (row) => row.target?.bon_la_bot,
                header: () => centeredHeader("Chỉ tiêu"),
                cell: ({ row }) => numberCell(row.original.target?.bon_la_bot),
                size: 120,
                meta: {
                    thClassName: `w-[120px] whitespace-nowrap ${borderLeft}`,
                    tdClassName: `text-center whitespace-nowrap ${borderLeft}`,
                },
            },
            {
                id: "bon_la_bot_actual",
                accessorFn: (row) => row.actual?.bon_la_bot,
                header: () => centeredHeader("Thực hiện"),
                cell: ({ row }) => numberCell(row.original.actual?.bon_la_bot),
                size: 120,
                meta: {
                    thClassName: "w-[120px] whitespace-nowrap",
                    tdClassName: "text-center whitespace-nowrap",
                },
            },
            {
                id: "bon_la_bot_percent",
                header: () => centeredHeader("Tỉ lệ hoàn thành"),
                cell: ({ row }) =>
                    percentCell(
                        row.original.actual?.bon_la_bot,
                        row.original.target?.bon_la_bot,
                    ),
                size: 140,
                meta: {
                    thClassName: `w-[140px] whitespace-nowrap ${borderRight}`,
                    tdClassName: `text-center whitespace-nowrap ${borderRight}`,
                },
            },
        ],
    },

    {
        id: "clcn_group",
        header: () => centeredHeader("CLCN"),
        meta: {
            thClassName: borderX,
        },
        columns: [
            {
                id: "clcn_target",
                accessorFn: (row) => row.target?.clcn,
                header: () => centeredHeader("Chỉ tiêu"),
                cell: ({ row }) => numberCell(row.original.target?.clcn),
                size: 120,
                meta: {
                    thClassName: `w-[120px] whitespace-nowrap ${borderLeft}`,
                    tdClassName: `text-center whitespace-nowrap ${borderLeft}`,
                },
            },
            {
                id: "clcn_actual",
                accessorFn: (row) => row.actual?.clcn,
                header: () => centeredHeader("Thực hiện"),
                cell: ({ row }) => numberCell(row.original.actual?.clcn),
                size: 120,
                meta: {
                    thClassName: "w-[120px] whitespace-nowrap",
                    tdClassName: "text-center whitespace-nowrap",
                },
            },
            {
                id: "clcn_percent",
                header: () => centeredHeader("Tỉ lệ hoàn thành"),
                cell: ({ row }) =>
                    percentCell(
                        row.original.actual?.clcn,
                        row.original.target?.clcn,
                    ),
                size: 140,
                meta: {
                    thClassName: `w-[140px] whitespace-nowrap ${borderRight}`,
                    tdClassName: `text-center whitespace-nowrap ${borderRight}`,
                },
            },
        ],
    },

    {
        id: "bon_la_long_group",
        header: () => centeredHeader("Bón lá lỏng"),
        meta: {
            thClassName: borderX,
        },
        columns: [
            {
                id: "bon_la_long_target",
                accessorFn: (row) => row.target?.bon_la_long,
                header: () => centeredHeader("Chỉ tiêu"),
                cell: ({ row }) => numberCell(row.original.target?.bon_la_long),
                size: 120,
                meta: {
                    thClassName: `w-[120px] whitespace-nowrap ${borderLeft}`,
                    tdClassName: `text-center whitespace-nowrap ${borderLeft}`,
                },
            },
            {
                id: "bon_la_long_actual",
                accessorFn: (row) => row.actual?.bon_la_long,
                header: () => centeredHeader("Thực hiện"),
                cell: ({ row }) => numberCell(row.original.actual?.bon_la_long),
                size: 120,
                meta: {
                    thClassName: "w-[120px] whitespace-nowrap",
                    tdClassName: "text-center whitespace-nowrap",
                },
            },
            {
                id: "bon_la_long_percent",
                header: () => centeredHeader("Tỉ lệ hoàn thành"),
                cell: ({ row }) =>
                    percentCell(
                        row.original.actual?.bon_la_long,
                        row.original.target?.bon_la_long,
                    ),
                size: 140,
                meta: {
                    thClassName: `w-[140px] whitespace-nowrap ${borderRight}`,
                    tdClassName: `text-center whitespace-nowrap ${borderRight}`,
                },
            },
        ],
    },
]