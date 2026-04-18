import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useCustomers } from "./customers-provider"

export function CreateCustomerButton() {
    const { openCreate } = useCustomers()

    return (
        <CrudCreateButton
            label="Tạo khách hàng"
            onClick={openCreate}
        />
    )
}