import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { ShipmentItem } from "../data/schema"
import { useShipments } from "../../shipment/components/shipments-provider"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deleteShipmentItem } from "@/api/purchasing/shipment_items"

export function ShipmentItemRowActions({ row }: { row: Row<ShipmentItem> }) {
    const { openEditById } = useShipments()


    const { deleteById } = useCrudDelete(
        deleteShipmentItem,
        ["shipment-items"]
    )

    return (
        <CrudRowActions
            row={row.original}
            getId={(r) => r.shipment?.id || 0}
            onEditById={(id) => openEditById(id)}
            onDelete={(r) => deleteById(r.id)}
        />
    )
}