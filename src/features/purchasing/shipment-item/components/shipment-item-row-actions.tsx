import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { ShipmentItem } from "../data/schema"
import { useShipments } from "../../shipment/components/shipments-provider"

export function ShipmentItemRowActions({ row }: { row: Row<ShipmentItem> }) {
    const { openEditById } = useShipments()

    return (
        <CrudRowActions
            row={row.original}
            getId={(r) => r.shipment?.id || 0}
            onEditById={(id) => openEditById(id)}
        />
    )
}