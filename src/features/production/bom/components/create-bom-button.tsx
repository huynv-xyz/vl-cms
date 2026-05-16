import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProductBoms } from "./boms-provider"

export function CreateBomButton() {
    const { openCreate } = useProductBoms()

    return (
        <CrudCreateButton
            label="Tạo BOM"
            onClick={openCreate}
        />
    )
}
