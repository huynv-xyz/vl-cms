import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipPrivateRules } from "./vip-private-rules-provider"

export function CreateVipPrivateRuleButton() {
    const { openCreate } = useVipPrivateRules()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}