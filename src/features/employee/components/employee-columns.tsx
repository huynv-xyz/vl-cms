import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Employee } from "../data/schema"
import { EmployeeRowActions } from "./employee-row-actions"

const fmt = (v?: number | null) => v == null ? "-" : v.toLocaleString("vi-VN")

export const employeeColumns: ColumnDef<Employee>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã NV",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên",
    }),

    buildTextColumn({
        accessorKey: "birth_date",
        title: "Ngày sinh",
    }),

    buildTextColumn({
        accessorKey: "identity_no",
        title: "CMND/CCCD",
    }),

    {
        accessorKey: "labor_type",
        header: "Loại LĐ",
        cell: ({ row }) => row.original.labor_type || "CT",
    },

    {
        accessorKey: "dependent_count",
        header: () => <div className="text-right">NPT</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.dependent_count ?? 0}</div>,
    },

    {
        accessorKey: "basic_salary",
        header: () => <div className="text-right">Lương cơ bản</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{fmt(row.original.basic_salary)}</div>,
    },

    {
        accessorKey: "allowance_salary",
        header: () => <div className="text-right">Phụ cấp</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{fmt(row.original.allowance_salary)}</div>,
    },

    {
        accessorKey: "insurance_base",
        header: () => <div className="text-right">Lương đóng BH</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{fmt(row.original.insurance_base)}</div>,
    },

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Còn làm" : "Đã nghỉ"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <EmployeeRowActions row={row} />,
    }),
]
