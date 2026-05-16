import { Product } from "@/features/product/data/schema"

export type DeliveryFormValues = {
    order_id: number
    delivery_date: string
    warehouse_id?: number
    company_id?: number
    delivery_address?: string
    status?: string
    note?: string
}

export type DeliveryFormItem = {
    product_id: number
    product?: Product

    selected: boolean
    quantity: number
    remain_quantity?: number
    note?: string
}
