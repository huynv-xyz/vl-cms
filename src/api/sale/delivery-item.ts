import { createCrudApi } from "@/api/crud"
import { DeliveryItem } from "@/features/sale/delivery/data/schema"

export type DeliveryItemListParams = {
    page: number
    size: number
    delivery_id?: number
}

export type CreateDeliveryItemRequest = {
    delivery_id: number
    product_id: number
    quantity: number
    unit_price: number
}

export type UpdateDeliveryItemRequest = {
    id: number
    quantity?: number
    unit_price?: number
}

const deliveryItemApi = createCrudApi<
    DeliveryItem,
    CreateDeliveryItemRequest,
    UpdateDeliveryItemRequest,
    DeliveryItemListParams
>("/sales/delivery-items")

export const listDeliveryItems = deliveryItemApi.list
export const getDeliveryItem = deliveryItemApi.detail
export const createDeliveryItem = deliveryItemApi.create
export const updateDeliveryItem = deliveryItemApi.update
export const deleteDeliveryItem = deliveryItemApi.delete