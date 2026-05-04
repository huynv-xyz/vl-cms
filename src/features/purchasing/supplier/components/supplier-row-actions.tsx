import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useSuppliers } from "./suppliers-provider"
import type { Supplier } from "../data/schema"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deleteSupplier } from "@/api/purchasing/supplier"

export function SupplierRowActions({ row }: { row: Row<Supplier> }) {
    const { openEdit } = useSuppliers()
    const { deleteById } = useCrudDelete(
        deleteSupplier,
        ["suppliers"]
    )

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)}
            onDelete={(r) => deleteById(r.id)} />
    )
}