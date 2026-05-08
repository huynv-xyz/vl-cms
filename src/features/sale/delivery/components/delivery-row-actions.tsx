import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useDeliveries } from "./deliverys-provider"

export function DeliveryRowActions({ row }) {
    const { openEdit } = useDeliveries()
    const data = row.original


    return (
        <>
            <CrudRowActions
                row={data}
                onEdit={() => openEdit(data)}
            />
        </>
    )
}