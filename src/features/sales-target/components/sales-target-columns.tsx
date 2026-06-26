import { type ColumnDef } from "@tanstack/react-table"

import type { SalesTarget } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { SalesTargetRowActions } from "./sales-target-row-actions"
import { Badge } from "@/components/ui/badge"

function employeeCell(row: SalesTarget) {
    const employeeLabel = row.employee
        ? [row.employee.code, row.employee.name].filter(Boolean).join(" - ")
        : "Chưa có thông tin nhân viên"
    const roleLabel = row.role
        ? [row.role.code, row.role.name].filter(Boolean).join(" - ")
        : "Chưa có vai trò"
    const regionLabel = row.region
        ? [row.region.code, row.region.name].filter(Boolean).join(" - ")
        : "Chưa có vùng"
    const provinceLabel = row.province
        ? [row.province.code, row.province.name].filter(Boolean).join(" - ")
        : "Không tỉnh"

    return (
        <div className="min-w-[280px] space-y-1">
            <div className="font-medium text-foreground">{employeeLabel}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="h-5 px-1.5">
                    {roleLabel}
                </Badge>
                <span>{regionLabel}</span>
                <span>·</span>
                <span>{provinceLabel}</span>
            </div>
        </div>
    )
}

export const salesTargetColumns: ColumnDef<SalesTarget>[] = [
    buildIndexColumn<SalesTarget>(),

    {
        id: "employee",
        accessorFn: (row) => row.employee?.name || row.employee?.code || "",
        header: "Nhân viên",
        cell: ({ row }) => employeeCell(row.original),
        size: 340,
    },

    buildTextColumn<SalesTarget>({
        accessorKey: "period",
        title: "Kỳ",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_goc",
        title: "Bón gốc (kg)",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_la_bot",
        title: "Bón lá bột (kg)",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "clcn",
        title: "CLCN (kg)",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_la_long",
        title: "Bón lá lỏng (lít)",
    }),

    buildActionsColumn<SalesTarget>({
        renderActions: (_, row) => <SalesTargetRowActions row={row} />,
    }),
]
