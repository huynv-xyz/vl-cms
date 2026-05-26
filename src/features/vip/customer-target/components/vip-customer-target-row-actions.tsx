import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"

import type { VipCustomerTarget } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipCustomerTargets } from "./vip-customer-target-provider"
import { deleteVipCustomerTarget } from "@/api/vip-customer-target"

type Props = {
    row: Row<VipCustomerTarget>
}

export function VipCustomerTargetRowActions({ row }: Props) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipCustomerTargets()

    return (
        <CrudRowActions
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipCustomerTarget(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-customer-target"],
                })
            }}
        />
    )
}
