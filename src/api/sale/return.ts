import { createCrudApi } from "@/api/crud"
import type { Return } from "@/features/sale/return/data/schema"

export type ReturnListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
    export_id?: number
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