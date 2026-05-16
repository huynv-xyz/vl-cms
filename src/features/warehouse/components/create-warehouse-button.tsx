
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useWarehouses } from "./warehouses-provider"

export function CreateWarehouseButton() {
    const { openCreate } = useWarehouses()

    return (
        <CrudCreateButton label="Tạo mới" onClick={openCreate} />
    )
}
