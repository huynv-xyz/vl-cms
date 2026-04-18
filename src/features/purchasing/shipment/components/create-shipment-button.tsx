import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useShipments } from "./shipments-provider"

export function CreateShipmentButton() {
    const { openCreate } = useShipments()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}