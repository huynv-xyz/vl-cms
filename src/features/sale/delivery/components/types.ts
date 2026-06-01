import { Product } from "@/features/product/data/schema"

export type DeliveryFormValues = {
    order_id: number
    delivery_date: string
    company_id?: number
    delivery_address?: string
    status?: string
    note?: string
}

export type DeliveryFormItem = {
    order_item_id: number
    product_id: number
    product?: Product

    selected: boolean
    quantity: number
    remain_quantity?: number
    warehouse_id?: number
    note?: string
}
