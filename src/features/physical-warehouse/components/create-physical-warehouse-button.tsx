import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { usePhysicalWarehouses } from "./physical-warehouses-provider"

export function CreatePhysicalWarehouseButton() {
    const { openCreate } = usePhysicalWarehouses()

    return <CrudCreateButton label="Tạo mới" onClick={openCreate} />
}
