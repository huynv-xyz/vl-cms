import { type ColumnDef } from "@tanstack/react-table"

import type { VipPointRule } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { VipPointRuleRowActions } from "./vip-point-rule-row-actions"

export const vipPointRuleColumns: ColumnDef<VipPointRule>[] = [
    buildIndexColumn<VipPointRule>(),

    buildTextColumn<VipPointRule>({
        accessorKey: "vthh_con",
        title: "VTHH Con",
        width: 180,
        maxWidth: 180,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "group_code",
        title: "Mã chung",
        width: 130,
        maxWidth: 130,
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "unit",
        title: "ĐVT",
        width: 80,
        maxWidth: 80,
    }),

    buildNumberColumn<VipPointRule>({
        accessorKey: "from_value",
        title: "Từ giá trị",
        width: 120,
    }),

    buildNumberColumn<VipPointRule>({
        accessorKey: "to_value",
        title: "Đến giá trị",
        width: 120,
    }),

    buildNumberColumn<VipPointRule>({
        accessorKey: "he_so_mb",
        title: "Hệ số MB",
        width: 110,
    }),

    buildNumberColumn<VipPointRule>({
        accessorKey: "he_so_mn",
        title: "Hệ số MN",
        width: 110,
    }),

    buildBadgeColumn<VipPointRule>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 110,
        mapValueToLabel: (v) => v === 1 ? "Hoạt động" : "Tắt",
        mapValueToVariant: (v) => v === 1 ? "default" : "outline",
    }),

    buildTruncateColumn<VipPointRule>({
        accessorKey: "description",
        header: "Diễn giải",
        width: 200,
    }),

    buildTruncateColumn<VipPointRule>({
        accessorKey: "note",
        header: "Ghi chú",
        width: 180,
    }),

    buildActionsColumn<VipPointRule>({
        renderActions: (_, row) => <VipPointRuleRowActions row={row} />,
    }),
]
