import { apiGet } from "@/api/client"
import { createCrudApi } from "@/api/crud"

export type Permission = {
    module: string
    action: string
    name?: string
}

export function getMyPermissions() {
    return apiGet<Permission[]>("/auth/me/permissions")
}

// CRUD permission

export type PermissionItem = {
    id: number
    module: string
    action: string
    name?: string
}

export type PermissionListParams = {
    page: number
    size: number
    module?: string
    action?: string
}

export type CreatePermissionRequest = {
    module: string
    action: string
    name?: string
}

export type UpdatePermissionRequest = {
    id: number
    module: string
    action: string
    name?: string
}

const permissionApi = createCrudApi<
    PermissionItem,
    CreatePermissionRequest,
    UpdatePermissionRequest,
    PermissionListParams
>("/auth/permissions")

export const listPermissions = permissionApi.list
export const getPermission = permissionApi.detail
export const createPermission = permissionApi.create
export const updatePermission = permissionApi.update
export const deletePermission = permissionApi.delete
