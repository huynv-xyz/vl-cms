import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProductionPermissions } from "../hooks/use-production-permissions"
import { useProductions } from "./productions-provider"

export function CreateProductionButton() {
    const { openCreate } = useProductions()
    const permissions = useProductionPermissions()

    if (!permissions.canCreate) {
        return null
    }

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}
