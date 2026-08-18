import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProductBomPermissions } from "../hooks/use-product-bom-permissions"
import { useProductBoms } from "./boms-provider"

export function CreateBomButton() {
    const { openCreate } = useProductBoms()
    const permissions = useProductBomPermissions()

    if (!permissions.canCreate) {
        return null
    }

    return (
        <CrudCreateButton
            label="Tạo BOM"
            onClick={openCreate}
        />
    )
}
