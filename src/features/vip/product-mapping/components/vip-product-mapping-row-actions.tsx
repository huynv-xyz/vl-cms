import { type Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"

import type { VipProductMapping } from "../data/schema"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useVipProductMappings } from "./vip-product-mapping-provider"
import { deleteVipProductMapping } from "@/api/vip-product-mapping"

type Props = {
    row: Row<VipProductMapping>
}

export function VipProductMappingRowActions({ row }: Props) {
    const queryClient = useQueryClient()
    const { openEdit } = useVipProductMappings()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={async () => {
                await deleteVipProductMapping(row.original.id)
                await queryClient.invalidateQueries({
                    queryKey: ["vip-product-mapping"],
                })
            }}
        />
    )
}
