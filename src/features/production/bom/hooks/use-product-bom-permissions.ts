import { useQuery } from "@tanstack/react-query"
import { getMyPermissions, type Permission } from "@/api/auth/permission"

export type ProductBomPermissions = {
    canCreate: boolean
    canUpdate: boolean
    canDelete: boolean
    canImport: boolean
    canActivate: boolean
    isLoading: boolean
}

const MODULE = "production.boms"

function has(permissions: Permission[], action: string) {
    return permissions.some(
        (p) =>
            (p.module === MODULE || p.module === "*") &&
            (p.action === action || p.action === "*"),
    )
}

export function useProductBomPermissions(): ProductBomPermissions {
    const { data: permissions = [], isLoading } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
        staleTime: 5 * 60 * 1000,
    })

    return {
        canCreate: has(permissions, "create"),
        canUpdate: has(permissions, "update"),
        canDelete: has(permissions, "delete"),
        canImport: has(permissions, "import"),
        canActivate: has(permissions, "activate"),
        isLoading,
    }
}
