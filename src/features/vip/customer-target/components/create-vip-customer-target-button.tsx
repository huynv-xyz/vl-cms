import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipCustomerTargets } from "./vip-customer-target-provider"

export function CreateVipCustomerTargetButton() {
    const { openCreate } = useVipCustomerTargets()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
