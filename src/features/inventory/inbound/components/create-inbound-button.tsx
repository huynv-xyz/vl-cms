import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useInventoryInbounds } from "./inbounds-provider"

export function CreateInboundButton() {
    const { openCreate } = useInventoryInbounds()

    return <CrudCreateButton onClick={openCreate} />
}