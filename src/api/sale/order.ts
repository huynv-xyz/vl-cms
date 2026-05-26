import { createCrudApi } from "@/api/crud"
import { Order, OrderDetail } from "@/features/sale/order/data/schema"
import { apiGet, apiPost, apiDelete, apiPut } from "@/api/client"

export type OrderListParams = {
    page: number
    size: number
    keyword?: string
    customer_id?: number
    employee_id?: number
    status?: string
    from_date?: string
    to_date?: string
}

export type CreateOrderRequest = Partial<Order>
export type UpdateOrderRequest = Order

export type CreateOrderItemRequest = {
    product_id: number
    quantity: number
    unit_price: number
    discount?: number
    line_type?: string
    description?: string
}

const orderApi = createCrudApi<
    Order,
    CreateOrderRequest,
    UpdateOrderRequest,
    OrderListParams
>("/sales/orders")

export const listOrders = orderApi.list
export const createOrder = orderApi.create
export const updateOrder = orderApi.update
export const deleteOrder = orderApi.delete

export const getOrder = (id: number) =>
    apiGet<OrderDetail>(`/sales/orders/${id}`)

export const createOrderItem = (
    orderId: number,
    data: CreateOrderItemRequest
) =>
    apiPost(`/sales/orders/${orderId}/items`, data)

export const updateOrderItem = (
    id: number,
    data: {
        quantity: number
        unit_price: number
        discount?: number
        line_type?: string
        description?: string
    }
) =>
    apiPut(`/sales/orders/items/${id}`, data)

export const deleteOrderItem = (id: number) =>
    apiDelete(`/sales/orders/items/${id}`)

export const updateOrderStatus = (id: number, status: string) =>
    apiPut(`/sales/orders/${id}/status`, { status })
