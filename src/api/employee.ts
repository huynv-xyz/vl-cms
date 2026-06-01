import { createCrudApi } from "@/api/crud"
import type { Employee } from "@/features/employee/data/schema"

export type EmployeeListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
}

export type CreateEmployeeRequest = {
    code: string
    name: string
    birth_date?: string | null
    permanent_address?: string
    identity_no?: string
    identity_issue_date?: string | null
    identity_issue_place?: string
    status?: number
}

export type UpdateEmployeeRequest = {
    id: number
    code: string
    name: string
    birth_date?: string | null
    permanent_address?: string
    identity_no?: string
    identity_issue_date?: string | null
    identity_issue_place?: string
    status?: number
}

const employeeApi = createCrudApi<
    Employee,
    CreateEmployeeRequest,
    UpdateEmployeeRequest,
    EmployeeListParams
>("/employees")

export const listEmployees = employeeApi.list
export const getEmployee = employeeApi.detail
export const createEmployee = employeeApi.create
export const updateEmployee = employeeApi.update
export const deleteEmployee = employeeApi.delete
