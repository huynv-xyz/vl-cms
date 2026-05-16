import { apiGet, apiPut } from "@/api/client"

export type UserRoles = {
    user_id: number
    role_ids: number[]
}

export function getUserRoles(userId: number) {
    return apiGet<UserRoles>(`/users/${userId}/roles`)
}

export function updateUserRoles(userId: number, roleIds: number[]) {
    return apiPut<UserRoles>(`/users/${userId}/roles`, {
        role_ids: roleIds,
    })
}
