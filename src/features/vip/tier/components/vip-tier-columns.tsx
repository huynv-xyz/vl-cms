import { type ColumnDef } from "@tanstack/react-table"

import type { VipTier } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { VipTierRowActions } from "./vip-tier-row-actions"
import { formatCurrency } from "@/lib/utils"
import { DataTableColumnHeader } from "@/components/table/column-header"

function buildCurrencyColumn<T>(opts: {
    accessorKey: keyof T & string
    title: string
    width?: number
}): ColumnDef<T> {
    return {
        accessorKey: opts.accessorKey,
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={opts.title} />
        ),
        cell: ({ row }) => {
            const value = row.getValue(opts.accessorKey)
            return (
                <span className="block text-right tabular-nums text-sm">
                    {formatCurrency(Number(value ?? 0))}
                </span>
            )
        },
        size: opts.width ?? 140,
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    }
}

export const vipTierColumns: ColumnDef<VipTier>[] = [
    buildIndexColumn<VipTier>(),

    buildTextColumn<VipTier>({
        accessorKey: "name",
        title: "Tên hạng",
        width: 180,
        maxWidth: 180,
        textClassName: "font-semibold text-sm",
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "mb_b2b_point",
        title: "Điểm MB B2B",
        width: 130,
    }),

    buildCurrencyColumn<VipTier>({
        accessorKey: "mb_b2b_reward",
        title: "Thưởng MB B2B",
        width: 150,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2c_point",
        title: "Điểm B2C",
        width: 110,
    }),

    buildCurrencyColumn<VipTier>({
        accessorKey: "b2c_reward",
        title: "Thưởng B2C",
        width: 130,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2b_point",
        title: "Điểm B2B",
        width: 110,
    }),

    buildCurrencyColumn<VipTier>({
        accessorKey: "b2b_reward",
        title: "Thưởng B2B",
        width: 130,
    }),

    buildTruncateColumn<VipTier>({
        accessorKey: "note",
        header: "Ghi chú",
        width: 200,
    }),

    buildActionsColumn<VipTier>({
        renderActions: (_, row) => <VipTierRowActions row={row} />,
    }),
]
