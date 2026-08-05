import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { getMyPermissions } from "@/api/auth/permission"
import { useQuery } from "@tanstack/react-query"
import { useReturns } from "./returns-provider"

export function CreateReturnButton() {
    const { openCreate } = useReturns()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canCreateReturn = permissions.some(
        (permission) =>
            permission.module === "sales.returns" && permission.action === "create"
    )

    if (!canCreateReturn) return null

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
