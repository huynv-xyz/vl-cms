import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useGoodsDescriptions } from "./goods-descriptions-provider"

export function CreateGoodsDescriptionButton() {
    const { openCreate } = useGoodsDescriptions()

    return <CrudCreateButton onClick={openCreate} />
}
