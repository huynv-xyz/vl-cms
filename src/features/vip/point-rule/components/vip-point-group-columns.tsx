import { type ColumnDef } from "@tanstack/react-table"

import type { VipPointGroup } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { VipPointGroupRowActions } from "./vip-point-group-row-actions"

export const vipPointGroupColumns: ColumnDef<VipPointGroup>[] = [
    buildIndexColumn<VipPointGroup>(),

    buildTextColumn<VipPointGroup>({
        accessorKey: "group_code",
        title: "Mã nhóm",
        width: 150,
        maxWidth: 170,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPointGroup>({
        accessorKey: "group_name",
        title: "Tên nhóm",
        width: 220,
        maxWidth: 260,
    }),

    buildTextColumn<VipPointGroup>({
        accessorKey: "unit",
        title: "ĐVT",
        width: 80,
        maxWidth: 80,
    }),

    buildNumberColumn<VipPointGroup>({
        accessorKey: "he_so_mb",
        title: "Hệ số MB",
        width: 110,
    }),

    buildNumberColumn<VipPointGroup>({
        accessorKey: "he_so_mn",
        title: "Hệ số MN",
        width: 110,
    }),

    buildBadgeColumn<VipPointGroup>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 110,
        mapValueToLabel: (v) => v === 1 ? "Hoạt động" : "Tắt",
        mapValueToVariant: (v) => v === 1 ? "default" : "outline",
    }),

    buildTruncateColumn<VipPointGroup>({
        accessorKey: "description",
        header: "Diễn giải",
        width: 260,
    }),

    buildActionsColumn<VipPointGroup>({
        renderActions: (_, row) => <VipPointGroupRowActions row={row} />,
    }),
]
