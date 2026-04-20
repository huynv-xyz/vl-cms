import { Product } from "@/features/product/data/schema"

export type OrderItem = {
    product_id: number
    product: Product
    quantity: number // SL đặt
}

export type Order = {
    id: number

    order_no: string

    customer_id: number
    employee_id?: number

    order_date: string
    status: string

    note?: string

    created_at?: string
    updated_at?: string

    customer?: any
    employee?: any
    items?: any[]

    total_amount?: number
}

