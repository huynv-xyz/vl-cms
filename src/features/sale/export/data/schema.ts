import { Warehouse } from "@/features/warehouse/data/schema"
import { Delivery } from "../../delivery/data/schema"
import { Order } from "../../order/data/schema"
import { Product } from "@/features/product/data/schema"

export type ExportItem = {
    id: number
    export_id: number
    export?: Export
    product_id: number
    product?: Product
    warehouse_id?: number
    warehouse?: Warehouse
    quantity: number
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

    items?: ExportItem[]
}
