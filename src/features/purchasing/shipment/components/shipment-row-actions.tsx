import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useShipments } from "./shipments-provider"
import { deleteShipment } from "@/api/purchasing/shipment"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import type { Shipment } from "../data/schema"

type Props = {
    row: Shipment
}

export function ShipmentRowActions({ row }: Props) {

    const { openEditById } = useShipments()

    const { deleteById } = useCrudDelete(
        deleteShipment,
        ["shipments"]
    )

    return (
        <CrudRowActions
            row={row}
            getId={(r) => r.id}
            onEditById={(id) => openEditById(id)}
            onDelete={(r) => deleteById(r.id)}
        />
    )
}