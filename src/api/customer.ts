import { createCrudApi } from "@/api/crud"
import type { Customer } from "@/features/customer/data/schema"

export type CustomerListParams = {
    page: number
    size: number
    keyword?: string
    type?: string
    region?: string
    status?: string
}

export type CreateCustomerRequest = {
    code: string
    name: string
    type: string
    region: string
    status?: number
    note?: string
}

export type UpdateCustomerRequest = {
    id: number
    code: string
    name: string
    type: string
    region: string
    status?: number
    note?: string
}

const customerApi = createCrudApi<
    Customer,
    CreateCustomerRequest,
    UpdateCustomerRequest,
    CustomerListParams
>("/customers")

export const listCustomers = customerApi.list
export const getCustomer = customerApi.detail
export const createCustomer = customerApi.create
export const updateCustomer = customerApi.update
export const deleteCustomer = customerApi.delete