import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { usePayments } from "./payment-provider"

export function CreatePaymentButton() {
    const { openCreate } = usePayments()

    return (
        <CrudCreateButton
            label="Tạo mới"
            onClick={openCreate}
        />
    )
}