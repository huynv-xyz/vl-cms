import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import type { VipPointGroup } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipPointGroups } from "./vip-point-groups-provider"
import { deleteVipPointGroup } from "@/api/vip-point-group"

type VipPointGroupRowActionsProps = {
    row: Row<VipPointGroup>
}

export function VipPointGroupRowActions({ row }: VipPointGroupRowActionsProps) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipPointGroups()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipPointGroup(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-point-group"],
                })
            }}
        />
    )
}
