
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useOrders } from "./orders-provider"

export function CreateOrderButton() {
    const { openCreate } = useOrders()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
