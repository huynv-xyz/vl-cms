import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useReceipts } from "./receipts-provider"

export function CreateReceiptButton() {
    const { openCreate } = useReceipts()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}