import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProductions } from "./productions-provider"

export function CreateProductionButton() {
    const { openCreate } = useProductions()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}