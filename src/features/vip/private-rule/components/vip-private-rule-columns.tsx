import { type ColumnDef } from "@tanstack/react-table"

import type { VipPrivateRule } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { VipPrivateRuleRowActions } from "./vip-private-rule-row-actions"

export const vipPrivateRuleColumns: ColumnDef<VipPrivateRule>[] = [
    buildIndexColumn<VipPrivateRule>(),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "id",
        title: "Mã ID",
        width: 100,
        maxWidth: 100,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "code",
        title: "Code",
        width: 140,
        maxWidth: 140,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "name",
        title: "Tên",
        width: 180,
        maxWidth: 180,
    }),

    buildNumberColumn<VipPrivateRule>({
        accessorKey: "amount",
        title: "Số tiền",
        width: 140,
    }),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "unit",
        title: "ĐVT",
        width: 80,
        maxWidth: 80,
    }),

    buildTruncateColumn<VipPrivateRule>({
        accessorKey: "note",
        header: "Ghi chú",
        width: 220,
    }),

    buildActionsColumn<VipPrivateRule>({
        renderActions: (_, row) => (
            <VipPrivateRuleRowActions row={row} />
        ),
    }),
]
