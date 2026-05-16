import type { Row } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"

import { deleteProductBom } from "@/api/production/bom"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { ProductBom } from "../data/schema"
import { useProductBoms } from "./boms-provider"

export function ProductBomRowActions({ row }: { row: Row<ProductBom> }) {
    const queryClient = useQueryClient()
    const { openDetail, openEdit } = useProductBoms()
    const { deleteById } = useCrudDelete((id) => deleteProductBom(Number(id)), ["product-boms"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            extraActions={(bom) => (
                <DropdownMenuItem onClick={() => openDetail(bom)}>
                    Chi tiết định mức
                </DropdownMenuItem>
            )}
            onDelete={async (bom) => {
                await deleteById(bom.id)
                void queryClient.invalidateQueries({ queryKey: ["product-boms"] })
            }}
        />
    )
}
