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
    birth_date: string
    gender: string
    permanent_address: string
    identity_no: string
    identity_issue_date: string
    identity_issue_place: string
    dependent_count: number
    insurance_base: number
    basic_salary: number
    allowance_salary: number
    is_union_member: number
    status?: number
}

export type UpdateEmployeeRequest = {
    id: number
    code: string
    name: string
    gender?: string
    birth_date?: string
    permanent_address?: string
    identity_no?: string
    identity_issue_date?: string
    identity_issue_place?: string
    dependent_count?: number
    insurance_base?: number
    basic_salary?: number
    allowance_salary?: number
    is_union_member?: number
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