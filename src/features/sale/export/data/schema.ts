import { Warehouse } from "@/features/warehouse/data/schema"
import { Delivery } from "../../delivery/data/schema"
import { Order } from "../../order/data/schema"
import { Product } from "@/features/product/data/schema"

export type ExportItem = {
    id: number
    export_id: number
    export?: Export
    order_item_id?: number
    order_item?: any
    product_id: number
    product?: Product
    warehouse_id?: number
    warehouse?: Warehouse
    lot_code?: string
    lot_no?: string
    lot_nos?: string
    quantity: number
    unit_price?: number
    returned_quantity?: number
}

export type Export = {
    id: number
    export_no: string
    export_date: string

    delivery_id: number
    delivery?: Delivery

    order_id: number
    order?: Order
    warehouse_id: number
    warehouse?: Warehouse

    status: string
    note?: string
    created_at?: string
    updated_at?: string

    items?: ExportItem[]
}
