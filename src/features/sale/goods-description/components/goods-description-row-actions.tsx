import type { Row } from "@tanstack/react-table"
import { deleteGoodsDescription } from "@/api/sale/goods-description"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { GoodsDescription } from "../data/schema"
import { useGoodsDescriptions } from "./goods-descriptions-provider"

export function GoodsDescriptionRowActions({ row }: { row: Row<GoodsDescription> }) {
    const { openEdit } = useGoodsDescriptions()
    const { deleteById } = useCrudDelete(deleteGoodsDescription, ["goods-descriptions"])

    return (
        <CrudRowActions
            row={row.original}
            onEdit={(item) => openEdit(item)}
            onDelete={(item) => deleteById(item.id)}
        />
    )
}
