import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useSalesTargets } from "./sales-targets-provider"

export function CreateSalesTargetButton() {
    const { openCreate } = useSalesTargets()

    return (
        <CrudCreateButton
            label="Tạo mới"
            onClick={openCreate}
        />
    )
}