import { createCrudApi } from "@/api/crud"
import type { Delivery } from "@/features/sale/delivery/data/schema"

// ========================
// LIST PARAMS
// ========================
export type DeliveryListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
}

// ========================
// REQUEST TYPES (QUAN TRỌNG)
// ========================
export type DeliveryItemRequest = {
    product_id: number
    quantity: number
    note?: string
}

export type CreateDeliveryRequest = {
    order_id: number
    delivery_date: string

    warehouse_id?: number
    company_id?: number

    delivery_address?: string

    status?: string
    note?: string

    items: DeliveryItemRequest[]
}

export type UpdateDeliveryRequest = CreateDeliveryRequest & {
    id: number
}

// ========================
// API
// ========================
const deliveryApi = createCrudApi<
    Delivery,
    CreateDeliveryRequest,
    UpdateDeliveryRequest,
    DeliveryListParams
>("/sales/deliveries")

export const listDeliveries = deliveryApi.list
export const getDelivery = deliveryApi.detail
export const createDelivery = deliveryApi.create
export const updateDelivery = deliveryApi.update
export const deleteDelivery = deliveryApi.delete