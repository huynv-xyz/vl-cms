import { createCrudApi } from "@/api/crud"
import { Order } from "@/features/sale/order/data/schema"

export type OrderListParams = {
    page: number
    size: number
    keyword?: string
    customer_id?: number
    employee_id?: number
    from_date?: string
    to_date?: string
}

export type CreateOrderRequest = Partial<Order>
export type UpdateOrderRequest = Order

const orderApi = createCrudApi<
    Order,
    CreateOrderRequest,
    UpdateOrderRequest,
    OrderListParams
>("/sales/orders")

export const listOrders = orderApi.list
export const getOrder = orderApi.detail
export const createOrder = orderApi.create
export const updateOrder = orderApi.update
export const deleteOrder = orderApi.delete