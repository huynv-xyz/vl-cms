import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Employee } from "../data/schema"
import { EmployeeRowActions } from "./employee-row-actions"


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

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Còn làm" : "Đã nghỉ"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <EmployeeRowActions row={row} />,
    }),
]
