import { Customer } from "@/features/customer/data/schema"
import { Employee } from "@/features/employee/data/schema"
import { Product } from "@/features/product/data/schema"
import { Delivery } from "../../delivery/data/schema"
import { Export } from "../../export/data/schema"
import { Receipt } from "../../receipt/data/schema"
import { Return } from "../../return/data/schema"

// ========================
// ITEM
// ========================
export type OrderItem = {
    product_id: number
    product?: Product

    product_name?: string
    description?: string

    quantity: number
    unit_price?: number
    discount?: number
    line_type?: string
    line_total?: number
    exported_quantity: number
    stock_quantity?: number
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

    receipts?: Receipt[]
    returns?: Return[]

    ar_summary: ArSummary
}
