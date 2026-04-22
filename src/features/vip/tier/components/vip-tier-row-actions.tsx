import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"

import type { VipTier } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipTiers } from "./vip-tiers-provider"
import { deleteVipTier } from "@/api/vip-tier"

type Props = {
    row: Row<VipTier>
}

export function VipTierRowActions({ row }: Props) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipTiers()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipTier(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-tier"],
                })
            }}
        />
    )
}