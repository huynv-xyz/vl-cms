import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"
import { ShipmentItem } from "@/features/purchasing/shipment-item/data/schema"

type Id = number | string

export type ShipmentItemListParams = {
    page: number
    size: number
    keyword?: string
    shipment_id?: number
    contract_id?: number
    product_id?: number
}

export type ShipmentItemPayload = {
    id?: number
    shipment_id: number
    contract_item_id: number
    product_id: number
    quantity_shipped: number
    quantity_received?: number
    purchase_price_per_unit?: number
    note?: string
}

export type CreateShipmentItemRequest = ShipmentItemPayload

export type UpdateShipmentItemRequest = ShipmentItemPayload & {
    id: Id
}

export function listShipmentItems(params: ShipmentItemListParams) {
    return apiGet<PagedResult<ShipmentItem>>(
        "/purchasing/shipment-items",
        params
    )
}

export function getShipmentItem(id: Id) {
    return apiGet<ShipmentItem>(
        `/purchasing/shipment-items/${id}`
    )
}

export function createShipmentItem(body: CreateShipmentItemRequest) {
    return apiPost<ShipmentItem>(
        "/purchasing/shipment-items",
        body
    )
}

export function updateShipmentItem(body: UpdateShipmentItemRequest) {
    return apiPut<ShipmentItem>(
        `/purchasing/shipment-items/${body.id}`,
        body
    )
}

export function deleteShipmentItem(id: Id) {
    return apiDelete<boolean>(
        `/purchasing/shipment-items/${id}`,
        { id }
    )
}