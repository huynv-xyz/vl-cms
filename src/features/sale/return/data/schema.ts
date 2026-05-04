import { Product } from "@/features/product/data/schema"
import { Export } from "../../export/data/schema"
import { Order } from "../../order/data/schema"

export type ReturnItem = {
    id: number
    return_id: number
    product_id: number
    product?: Product
    quantity: number
}

export type Return = {
    id: number
    return_no: string

    order_id: number
    order?: Order

    export_id: number
    export?: Export

    status: string
    reason?: string

    items?: ReturnItem[]
}