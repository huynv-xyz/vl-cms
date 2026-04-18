import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useSuppliers } from "./suppliers-provider"
import type { Supplier } from "../data/schema"

export function SupplierRowActions({ row }: { row: Row<Supplier> }) {
    const { openEdit } = useSuppliers()

    return (
        <CrudRowActions onEdit={() => openEdit(row.original)} />
    )
}