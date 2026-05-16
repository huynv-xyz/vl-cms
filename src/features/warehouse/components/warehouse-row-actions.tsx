
import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useWarehouses } from "./warehouses-provider"
import type { Warehouse } from "../data/schema"

export function WarehouseRowActions({ row }: { row: Row<Warehouse> }) {
    const { openEdit } = useWarehouses()

    return (
        <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
    )
}
