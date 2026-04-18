import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useProducts } from "./products-provider"
import type { Product } from "../data/schema"

export function ProductRowActions({ row }: { row: Row<Product> }) {
    const { openEdit } = useProducts()

    return (
        <CrudRowActions onEdit={() => openEdit(row.original)} />
    )
}