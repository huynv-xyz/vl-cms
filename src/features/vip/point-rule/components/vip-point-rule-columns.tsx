import { type ColumnDef } from "@tanstack/react-table"

import type { VipPointRule } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { VipPointRuleRowActions } from "./vip-point-rule-row-actions"

export const vipPointRuleColumns: ColumnDef<VipPointRule>[] = [
    buildIndexColumn<VipPointRule>(),

    buildTextColumn<VipPointRule>({
        accessorKey: "id",
        title: "Mã",
        width: 100,
        maxWidth: 100,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "vthh_con",
        title: "VTHH Con",
        width: 180,
        maxWidth: 180,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "from_value",
        title: "Từ giá trị",
        width: 140,
        maxWidth: 140,
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "to_value",
        title: "Đến giá trị",
        width: 140,
        maxWidth: 140,
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "he_so_mb",
        title: "Hệ số MB",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<VipPointRule>({
        accessorKey: "he_so_mn",
        title: "Hệ số MN",
        width: 120,
        maxWidth: 120,
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