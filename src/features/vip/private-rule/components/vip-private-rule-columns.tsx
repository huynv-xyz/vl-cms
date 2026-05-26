import { type ColumnDef } from "@tanstack/react-table"

import type { VipPrivateRule } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { VipPrivateRuleRowActions } from "./vip-private-rule-row-actions"
import { formatCurrency } from "@/lib/utils"
import { DataTableColumnHeader } from "@/components/table/column-header"

export const vipPrivateRuleColumns: ColumnDef<VipPrivateRule>[] = [
    buildIndexColumn<VipPrivateRule>(),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "code",
        title: "Mã",
        width: 140,
        maxWidth: 140,
        textClassName: "font-semibold text-sm",
    }),

    buildTextColumn<VipPrivateRule>({
        accessorKey: "name",
        title: "Tên quy tắc",
        width: 220,
        maxWidth: 300,
    }),

    {
        accessorKey: "amount",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Thưởng" />
        ),
        cell: ({ row }) => {
            const amount = Number(row.getValue("amount") ?? 0)
            const unit = row.original.unit
            return (
                <div className="text-right">
                    <span className="font-semibold tabular-nums text-sm">
                        {formatCurrency(amount)}
                    </span>
                    {unit && (
                        <span className="ml-1 text-xs text-muted-foreground">/{unit}</span>
                    )}
                </div>
            )
        },
        size: 160,
        meta: { className: "text-right", tdClassName: "text-right" },
    },

    buildBadgeColumn<VipPrivateRule>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 110,
        mapValueToLabel: (v) => v === 1 ? "Hoạt động" : "Tắt",
        mapValueToVariant: (v) => v === 1 ? "default" : "outline",
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
