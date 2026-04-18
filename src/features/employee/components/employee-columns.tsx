import { ColumnDef } from "@tanstack/react-table"
import { buildSelectColumn } from "@/components/crud/build-select-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Employee } from "../data/schema"
import { EmployeeRowActions } from "./employee-row-actions"
import { buildCurrencyColumn } from "@/components/crud/build-currency-column"


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

    buildCurrencyColumn({
        accessorKey: "insurance_base",
        title: "Lương BH",
    }),

    buildCurrencyColumn({
        accessorKey: "basic_salary",
        title: "Lương cơ bản",
    }),

    buildCurrencyColumn({
        accessorKey: "allowance_salary",
        title: "Phụ cấp",
    }),

    buildTextColumn({
        accessorKey: "identity_issue_date",
        title: "Ngày sinh",
    }),

    buildTextColumn({
        accessorKey: "identity_no",
        title: "CMND/CCCD",
    }),

    buildTextColumn({
        accessorKey: "identity_issue_date",
        title: "Ngày cấp",
    }),

    buildTextColumn({
        accessorKey: "identity_issue_place",
        title: "Nơi cấp",
    }),

    buildTextColumn({
        accessorKey: "permanent_address",
        title: "Địa chỉ",
    }),

    buildTextColumn({
        accessorKey: "dependent_count",
        title: "Người phụ thuộc",
    }),

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Còn làm" : "Đã nghỉ"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <EmployeeRowActions row={row} />,
    }),
]