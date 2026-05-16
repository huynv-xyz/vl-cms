import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useProducts } from "./products-provider"
import type { Product } from "../data/schema"

export function ProductRowActions({ row }: { row: Row<Product> }) {
    const { openDetail, openEdit } = useProducts()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            extraActions={(product) => (
                <DropdownMenuItem onClick={() => openDetail(product)}>
                    Xem chi tiết
                </DropdownMenuItem>
            )}
        />
    )
}
