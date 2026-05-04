import { createCrudApi } from "@/api/crud"
import type { Receipt } from "@/features/sale/receipt/data/schema"

export type ReceiptListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
    customer_id?: number
    status?: string
}

const receiptApi = createCrudApi<
    Receipt,
    Partial<Receipt>,
    Receipt,
    ReceiptListParams
>("/sales/receipts")

export const listReceipts = receiptApi.list
export const getReceipt = receiptApi.detail
export const createReceipt = receiptApi.create
export const updateReceipt = receiptApi.update
export const deleteReceipt = receiptApi.delete