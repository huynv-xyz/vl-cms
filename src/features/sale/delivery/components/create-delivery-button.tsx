import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useDeliveries } from "./deliverys-provider"

export function CreateDeliveryButton() {
    const { openCreate } = useDeliveries()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}