import { apiGet, apiPut } from "@/api/client"
import { createCrudApi } from "@/api/crud"

export type AccessRole = {
    id: number
    code: string
    name: string
    created_at?: string
    updated_at?: string
}

export type AccessRoleListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateAccessRoleRequest = {
    code: string
    name: string
}

export type UpdateAccessRoleRequest = {
    id: number
    code: string
    name: string
}

const roleApi = createCrudApi<
    AccessRole,
    CreateAccessRoleRequest,
    UpdateAccessRoleRequest,
    AccessRoleListParams
>("/auth/roles")

export const listAccessRoles = roleApi.list
export const getAccessRole = roleApi.detail
export const createAccessRole = roleApi.create
export const updateAccessRole = roleApi.update
export const deleteAccessRole = roleApi.delete

// Role <-> Permission

export type RolePermissions = {
    role_id: number
    permission_ids: number[]
}

export function getRolePermissions(roleId: number) {
    return apiGet<RolePermissions>(`/auth/roles/${roleId}/permissions`)
}

export function updateRolePermissions(roleId: number, permissionIds: number[]) {
    return apiPut<RolePermissions>(`/auth/roles/${roleId}/permissions`, {
        permission_ids: permissionIds,
    })
}
