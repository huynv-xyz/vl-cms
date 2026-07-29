import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { getMyPermissions } from "@/api/auth/permission"
import { useQuery } from "@tanstack/react-query"
import { useDeliveries } from "./deliverys-provider"

export function CreateDeliveryButton() {
    const { openCreate } = useDeliveries()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canCreate = permissions.some(
        (permission: any) => permission.module === "sales.deliveries" && permission.action === "create"
    )

    if (!canCreate) return null

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
