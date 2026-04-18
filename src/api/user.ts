import { createCrudApi } from "@/api/crud"
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
    status?: number
}

export type UpdateUserRequest = {
    id: number
    email: string
    password?: string
    name: string
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