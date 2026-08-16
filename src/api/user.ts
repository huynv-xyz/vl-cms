import { createCrudApi } from "@/api/crud"
import { apiPut } from "@/api/client"
import type { User } from "@/features/user/data/schema"

export type UserListParams = {
    page: number
    size: number
    email?: string
    name?: string
    status?: string
}

export type CreateUserRequest = {
    email: string
    password: string
    name: string
    employee_id?: number
    status?: number
}

export type UpdateUserRequest = {
    id: number
    email: string
    password?: string
    name: string
    employee_id?: number
    status?: number
}

const userApi = createCrudApi<
    User,
    CreateUserRequest,
    UpdateUserRequest,
    UserListParams
>("/users")

export const listUsers = userApi.list
export const createUser = userApi.create
export const updateUser = userApi.update
export const deleteUser = userApi.delete

export const changeUserPassword = (id: number, password: string) =>
    apiPut<User>(`/users/${id}/password`, { password })
