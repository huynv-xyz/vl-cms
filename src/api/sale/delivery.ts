import { createCrudApi } from "@/api/crud"
import type { Delivery } from "@/features/sale/delivery/data/schema"
import { apiPost } from "../client"

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
// ITEM
// ========================
export type DeliveryItemRequest = {
    product_id: number
    quantity: number
    note?: string
}

// ========================
// CREATE
// ========================
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

export type UpdateDeliveryRequest = {
    id: number
} & CreateDeliveryRequest

type ConfirmDeliveryResponse = {
    status: string
}

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

export function confirmDelivery(id: number) {
    return apiPost<ConfirmDeliveryResponse>(
        `/sales/deliveries/${id}/confirm`
    )
}