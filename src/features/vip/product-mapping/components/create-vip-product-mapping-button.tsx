import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipProductMappings } from "./vip-product-mapping-provider"

export function CreateVipProductMappingButton() {
    const { openCreate } = useVipProductMappings()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
