import { apiPostMultipart } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import type { Customer } from "@/features/customer/data/schema"

export type CustomerAlias = {
    id: number
    customer_id: number
    customer?: Customer
    alias_code?: string
    alias_name: string
    tax_code?: string
    bank_account?: string
    bank_account_name?: string
    bank_name?: string
    type?: "TAX" | "BANK" | "OTHER" | string
    is_default?: number
    status?: number
    note?: string
    created_at?: string
    updated_at?: string
}

export type CustomerAliasListParams = {
    page: number
    size: number
    keyword?: string
    customer_id?: number
    type?: string
    status?: number
}

const api = createCrudApi<
    CustomerAlias,
    Partial<CustomerAlias>,
    CustomerAlias,
    CustomerAliasListParams
>("/customer-aliases")

export const listCustomerAliases = api.list
export const getCustomerAlias = api.detail
export const createCustomerAlias = api.create
export const updateCustomerAlias = api.update
export const deleteCustomerAlias = api.delete

export async function importInvoiceCustomerAliasesExcel(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>("/customer-aliases/import-invoice-excel", formData)
}
