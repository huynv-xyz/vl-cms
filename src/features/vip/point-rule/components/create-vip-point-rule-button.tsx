import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipPointRules } from "./vip-point-rules-provider"

export function CreateVipPointRuleButton() {
    const { openCreate } = useVipPointRules()

    return (
        <CrudCreateButton
            onClick={openCreate}
        />
    )
}