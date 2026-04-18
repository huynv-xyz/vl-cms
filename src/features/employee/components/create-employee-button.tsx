import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useEmployees } from "./employees-provider"

export function CreateEmployeeButton() {
    const { openCreate } = useEmployees()

    return (
        <CrudCreateButton
            label="Tạo mới"
            onClick={openCreate}
        />
    )
}