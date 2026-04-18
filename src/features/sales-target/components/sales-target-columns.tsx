import { type ColumnDef } from "@tanstack/react-table"

import type { SalesTarget } from "../data/schema"
import { buildSelectColumn } from "@/components/crud/build-select-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { SalesTargetRowActions } from "./sales-target-row-actions"

export const salesTargetColumns: ColumnDef<SalesTarget>[] = [
    buildIndexColumn<SalesTarget>(),

    buildTextColumn<SalesTarget>({
        accessorKey: "employee_id",
        title: "Nhân viên",
        width: 160,
    }),

    buildTextColumn<SalesTarget>({
        accessorKey: "period",
        title: "Kỳ",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_goc",
        title: "Bón góc",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_la_bot",
        title: "Bổn lá bột",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "clcn",
        title: "CLCN",
    }),

    buildNumberColumn<SalesTarget>({
        accessorKey: "bon_la_long",
        title: "Bón lá lỏng",
    }),

    buildActionsColumn<SalesTarget>({
        renderActions: (_, row) => <SalesTargetRowActions row={row} />,
    }),
]