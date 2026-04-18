import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { Shipment } from "../data/schema"
import { useShipments } from "./shipments-provider"

export function ShipmentRowActions({ row }: { row: Row<Shipment> }) {
    const { openEditById } = useShipments()

    return (
        <CrudRowActions
            row={row.original}
            getId={(r) => r.id}
            onEditById={(id) => openEditById(id)}
        />
    )
}