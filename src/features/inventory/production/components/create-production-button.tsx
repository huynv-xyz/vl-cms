import { useProductions } from "./productions-provider"
import { CrudCreateButton } from "@/components/crud/crud-create-button"

export function CreateProductionButton() {
    const { openCreate } = useProductions()

    return <CrudCreateButton onClick={openCreate} />
}