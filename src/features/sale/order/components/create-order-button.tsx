
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { getMyPermissions } from "@/api/auth/permission"
import { useQuery } from "@tanstack/react-query"
import { useOrders } from "./orders-provider"

export function CreateOrderButton() {
    const { openCreate } = useOrders()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canCreate = permissions.some(
        (permission: any) => permission.module === "sales.orders" && permission.action === "create"
    )

    if (!canCreate) return null

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
