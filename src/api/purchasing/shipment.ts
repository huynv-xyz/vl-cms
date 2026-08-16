import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"
import { Shipment } from "@/features/purchasing/shipment/data/schema"

type Id = number | string

export type ShipmentListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
    contract_id?: number
    date_type?: string
    date_from?: string
    date_to?: string
    eta_from?: string
    eta_to?: string
}

export type ShipmentItemPayload = {
    id?: number
    contract_item_id: number
    product_id?: number
    quantity: number
    defect_quantity?: number
    unit_price?: number
    packaging_price?: number
    freight_price?: number
    note?: string
}

export type CreateShipmentRequest = {
    contract_id: number
    code: string
    etd?: string
    eta?: string
    ata?: string
    warehouse_at?: string
    warehouse_id: number
    container_no?: string
    destination_port_id?: number
    exchange_rate?: number
    status?: string
    note?: string
    items: ShipmentItemPayload[]
}

export type UpdateShipmentRequest = CreateShipmentRequest & {
    id: Id
}

export function listShipments(params: ShipmentListParams) {
    return apiGet<PagedResult<Shipment>>("/purchasing/shipments", params)
}

export function getShipment(id: Id): any {
    return apiGet<Shipment>(`/purchasing/shipments/${id}`)
}

export function createShipment(body: CreateShipmentRequest) {
    return apiPost<Shipment>("/purchasing/shipments", body)
}

export function updateShipment(body: UpdateShipmentRequest) {
    return apiPut<Shipment>(`/purchasing/shipments/${body.id}`, body)
}

export function deleteShipment(id: Id) {
    return apiDelete<boolean>(`/purchasing/shipments/${id}`, { id })
}
