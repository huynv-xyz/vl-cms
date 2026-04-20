import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Delivery } from "../data/schema"
import { useDeliveries } from "./deliverys-provider"

export function DeliveryRowActions({ row }: { row: Row<Delivery> }) {
    const { openEdit } = useDeliveries()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
        />
    )
}