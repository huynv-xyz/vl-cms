import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipTiers } from "./vip-tiers-provider"

export function CreateVipTierButton() {
    const { openCreate } = useVipTiers()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}