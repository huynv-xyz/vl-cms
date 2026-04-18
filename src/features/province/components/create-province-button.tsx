
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProvinces } from "./provinces-provider"

export function CreateProvinceButton() {
    const { openCreate } = useProvinces()

    return (
        <CrudCreateButton label="Tạo mới" onClick={openCreate} />
    )
}
