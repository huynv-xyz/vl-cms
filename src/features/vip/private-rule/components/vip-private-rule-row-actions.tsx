import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"

import type { VipPrivateRule } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipPrivateRules } from "./vip-private-rules-provider"
import { deleteVipPrivateRule } from "@/api/vip-private-rule"

type Props = {
    row: Row<VipPrivateRule>
}

export function VipPrivateRuleRowActions({ row }: Props) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipPrivateRules()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipPrivateRule(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-private-rule"],
                })
            }}
            deleteSuccessMessage="Xoá VIP Private Rule thành công"
            deleteErrorMessage="Xoá VIP Private Rule thất bại"
            confirmDeleteMessage={`Bạn có chắc muốn xoá rule "${row.original.name}" không?`}
        />
    )
}