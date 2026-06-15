import { apiPostMultipart } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import type { Customer } from "@/features/customer/data/schema"

export type CustomerListParams = {
    page: number
    size: number
    keyword?: string
    keyword_scope?: "code_name"
    type?: string
    region?: string
    status?: string
}

export type CreateCustomerRequest = {
    code: string
    name: string
    address?: string
    type: string
    region: string
    employee_id?: number
    status?: number
    note?: string
    invoice_alias_code?: string
    invoice_alias_name?: string
    invoice_tax_code?: string
    invoice_address?: string
    bank_account?: string
    bank_account_name?: string
    bank_name?: string
}

export type UpdateCustomerRequest = {
    id: number
    code: string
    name: string
    address?: string
    type: string
    region: string
    employee_id?: number
    status?: number
    note?: string
    invoice_alias_code?: string
    invoice_alias_name?: string
    invoice_tax_code?: string
    invoice_address?: string
    bank_account?: string
    bank_account_name?: string
    bank_name?: string
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

export async function importCustomersExcel(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>("/customers/import-excel", formData)
}
