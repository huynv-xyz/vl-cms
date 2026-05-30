import { Warehouse } from "@/features/warehouse/data/schema"
import { Port } from "../../port/data/schema"
import { ShipmentItem } from "../../shipment-item/data/schema"
import type { Supplier } from "../../supplier/data/schema"
import type { ShipmentStatus } from "./shipment-status"

export type { ShipmentStatus }

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

    // Backend đã enrich từ contract.supplier_id (kèm nation) khi list shipment-items
    supplier?: Supplier

    exchange_rate?: number
    total_amount?: number

    note?: string

    items: ShipmentItem[]

    created_at?: string
    created_by?: number
    updated_at?: string
    updated_by?: number
}