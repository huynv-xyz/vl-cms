import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import type { VipPointRule } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipPointRules } from "./vip-point-rules-provider"
import { deleteVipPointRule } from "@/api/vip-point-rule"

type VipPointRuleRowActionsProps = {
    row: Row<VipPointRule>
}

export function VipPointRuleRowActions({ row }: VipPointRuleRowActionsProps) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipPointRules()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipPointRule(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-point-rule"],
                })
            }}
        />
    )
}