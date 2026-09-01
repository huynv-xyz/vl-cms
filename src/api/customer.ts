import { apiPost, apiPostMultipart } from "@/api/client"
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
    phone?: string
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
    address?: string | null
    phone?: string | null
    type: string
    region: string
    employee_id?: number
    status?: number
    note?: string
    invoice_alias_code?: string
    invoice_alias_name?: string
    invoice_tax_code?: string | null
    invoice_address?: string | null
    bank_account?: string | null
    bank_account_name?: string | null
    bank_name?: string | null
    sync_historical_data?: boolean
}

export type CustomerHistoricalSyncSample = {
    record_id: number
    customer_id?: number | null
    customer_code?: string | null
    expected_name?: string | null
    current_name?: string | null
}

export type CustomerHistoricalSyncTable = {
    table: string
    label: string
    syncable_count: number
    unknown_code_count: number
    samples: CustomerHistoricalSyncSample[]
    unknown_samples: CustomerHistoricalSyncSample[]
}

export type CustomerUnknownCodeGroup = {
    customer_code: string
    row_count: number
    tables: string
    current_names?: string | null
}

export type CustomerHistoricalSyncCheckResult = {
    syncable_count: number
    unknown_code_count: number
    total_issue_count: number
    unknown_codes: CustomerUnknownCodeGroup[]
    tables: CustomerHistoricalSyncTable[]
}

export type CustomerHistoricalSyncApplyResult = {
    updated: Record<string, number>
    remaining: CustomerHistoricalSyncCheckResult
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

export function checkCustomerHistoricalSync() {
    return apiPost<CustomerHistoricalSyncCheckResult>("/customers/historical-sync/check")
}

export function applyCustomerHistoricalSync() {
    return apiPost<CustomerHistoricalSyncApplyResult>("/customers/historical-sync/apply")
}

export function applyCustomerHistoricalSyncMappings(mappings: Array<{ old_code: string; customer_id: number }>) {
    return apiPost<CustomerHistoricalSyncApplyResult>("/customers/historical-sync/apply-mappings", { mappings })
}
