import { createCrudApi } from "@/api/crud"
import type { Return } from "@/features/sale/return/data/schema"
import { apiPut } from "../client"

export type ReturnListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
    export_id?: number
    customer_id?: number
    from_date?: string
    to_date?: string
    status?: string
}

const returnApi = createCrudApi<
    Return,
    Partial<Return>,
    Return,
    ReturnListParams
>("/sales/returns")

export const listReturns = returnApi.list
export const getReturn = returnApi.detail
export const createReturn = returnApi.create
export const updateReturn = returnApi.update
export const deleteReturn = returnApi.delete

export function updateReturnStatus(id: number, status: string) {
    return apiPut(`/sales/returns/${id}/status`, { status })
}
