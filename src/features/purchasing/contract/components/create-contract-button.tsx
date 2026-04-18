import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useContracts } from "./contracts-provider"

export function CreateContractButton() {
    const { openCreate } = useContracts()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}