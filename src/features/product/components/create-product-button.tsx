import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useProducts } from "./products-provider"

export function CreateProductButton() {
    const { openCreate } = useProducts()

    return (
        <CrudCreateButton
            label="Tạo sản phẩm"
            onClick={openCreate}
        />
    )
}
