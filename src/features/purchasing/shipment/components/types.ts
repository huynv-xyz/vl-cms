import type { ShipmentStatus } from "../data/shipment-status"
export type { ShipmentStatus }

export type ShipmentFormItem = {
    product_id?: number

    product?: {
        id: number
        code: string
        name: string
        unit?: string
    }

    selected?: boolean

    quantity?: number
    defect_quantity: number
    unit_price?: number


    packaging_price?: number
    freight_price?: number

    note?: string
}

export type ShipmentHeaderFormValues = {
    code: string

    etd?: string
    eta?: string
    ata?: string
    warehouse_at?: string
    warehouse_id?: number

    container_no?: string
    destination_port_id?: number

    exchange_rate?: number
    status?: ShipmentStatus
    note?: string
}