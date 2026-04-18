
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useRegions } from "./regions-provider"

export function CreateRegionButton() {
    const { openCreate } = useRegions()

    return (
        <CrudCreateButton label="Tạo mới" onClick={openCreate} />
    )
}
