import { type ColumnDef } from "@tanstack/react-table"

import type { VipTier } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { UpdateVipTierDialog } from "./update-vip-tier-dialog"
import { DeleteVipTierButton } from "./delete-vip-tier-button"
import { VipTierRowActions } from "./vip-tier-row-actions"

export const vipTierColumns: ColumnDef<VipTier>[] = [
    buildIndexColumn<VipTier>(),

    buildTextColumn<VipTier>({
        accessorKey: "name",
        title: "Tên hạng",
        width: 180,
        maxWidth: 180,
        textClassName: "font-medium text-sm",
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "mb_b2b_point",
        title: "MB B2B Point",
        width: 140,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "mb_b2b_reward",
        title: "MB B2B Reward",
        width: 150,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2c_point",
        title: "B2C Point",
        width: 120,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2c_reward",
        title: "B2C Reward",
        width: 130,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2b_point",
        title: "B2B Point",
        width: 120,
    }),

    buildNumberColumn<VipTier>({
        accessorKey: "b2b_reward",
        title: "B2B Reward",
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