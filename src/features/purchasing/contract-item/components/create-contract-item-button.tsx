import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useContractItems } from "./contract-items-provider"

export function CreateContractItemButton() {
    const { openCreate } = useContractItems()

    return (
        <CrudCreateButton
            label="Tạo mới"
            onClick={openCreate}
        />
    )
}