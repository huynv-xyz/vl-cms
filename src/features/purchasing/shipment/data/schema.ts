import { Warehouse } from "@/features/warehouse/data/schema"
import { Port } from "../../port/data/schema"
import { ShipmentItem } from "../../shipment-item/data/schema"

export type ShipmentStatus =
    | "IN_TRANSIT"
    | "ARRIVED_PORT"
    | "IN_WAREHOUSE"
    | "DONE"
    | "CANCELLED"

export type Shipment = {
    id: number

    contract_id?: number
    warehouse_id?: number
    warehouse?: Warehouse

    code?: string
    status?: ShipmentStatus

    etd?: string
    eta?: string
    ata?: string
    warehouse_at?: string

    container_no?: string
    destination_port_id?: number

    destination_port?: Port

    exchange_rate?: number
    total_amount?: number

    note?: string

    items: ShipmentItem[]

    created_at?: string
    created_by?: number
    updated_at?: string
    updated_by?: number
}