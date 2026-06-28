import { Product } from "@/features/product/data/schema"
import { Customer } from "@/features/customer/data/schema"
import { Warehouse } from "@/features/warehouse/data/schema"
import { Export } from "../../export/data/schema"
import { Order } from "../../order/data/schema"

export type ReturnItem = {
    id: number
    return_id: number
    product_id: number
    product?: Product
    warehouse_id?: number
    warehouse?: Warehouse
    quantity: number
    unit_price?: number
    note?: string
}

export type Return = {
    id: number
    return_no: string

    order_id: number
    order?: Order
    customer?: Customer
    customer_id?: number
    return_type?: "FROM_EXPORT" | "MANUAL"

    export_id: number
    export?: Export

    status: string
    reason?: string
    return_date?: string
    created_at?: string | number[]
    updated_at?: string | number[]

    items?: ReturnItem[]
}
