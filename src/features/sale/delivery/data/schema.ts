import type { Company } from "@/features/company/data/schema"
import type { Product } from "@/features/product/data/schema"
import type { Warehouse } from "@/features/warehouse/data/schema"
import type { Order } from "../../order/data/schema"

export type Delivery = {
    id: number

    delivery_no: string
    order_id: number

    delivery_date: string

    warehouse_id?: number
    company_id?: number

    delivery_address?: string

    status: string
    note?: string

    created_at?: string
    updated_at?: string

    warehouse?: Warehouse
    company?: Company
    order?: Order

    items?: DeliveryItem[]

    total_amount?: number
}

export type DeliveryItem = {
    id?: number

    product_id: number
    product?: Product

    quantity: number
    note?: string
}