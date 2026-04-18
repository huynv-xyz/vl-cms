import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useSuppliers } from "./suppliers-provider"

export function CreateSupplierButton() {
    const { openCreate } = useSuppliers()

    return (
        <CrudCreateButton
            label="Tạo mới"
            onClick={openCreate}
        />
    )
}