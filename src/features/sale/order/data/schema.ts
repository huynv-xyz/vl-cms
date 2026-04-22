import { Customer } from "@/features/customer/data/schema"
import { Employee } from "@/features/employee/data/schema"
import { Product } from "@/features/product/data/schema"
import { Delivery } from "../../delivery/data/schema"

// ========================
// ITEM
// ========================
export type OrderItem = {
    product_id: number
    product?: Product

    product_name?: string

    quantity: number
    exported_quantity: number
}

// ========================
// EXPORT
// ========================
export type ExportItem = {
    product_id: number
    product_name?: string
    quantity: number
}

export type Export = {
    id: number
    export_no: string
    status: string
    items: ExportItem[]
}

// ========================
// AR SUMMARY
// ========================
export type ArSummary = {
    total: number
    paid: number
    remain: number
}

// ========================
// ORDER BASE
// ========================
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

    customer?: Customer
    employee?: Employee

    total_amount?: number

    items: OrderItem[]

}

// ========================
// ORDER DETAIL
// ========================
export type OrderDetail = Order & {

    deliveries: Delivery[]

    exports: Export[]

    ar_summary: ArSummary
}