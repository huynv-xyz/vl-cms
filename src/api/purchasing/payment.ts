import { createCrudApi } from "@/api/crud"
import { Payment } from "@/features/purchasing/payment/data/schema"

export type PaymentListParams = {
    page: number
    size: number
    keyword?: string
    contract_id?: number
}

export type CreatePaymentRequest = Partial<Payment>
export type UpdatePaymentRequest = Payment

const paymentApi = createCrudApi<
    Payment,
    CreatePaymentRequest,
    UpdatePaymentRequest,
    PaymentListParams
>("/purchasing/payments")

export const listPayments = paymentApi.list
export const getPayment = paymentApi.detail
export const createPayment = paymentApi.create
export const updatePayment = paymentApi.update
export const deletePayment = paymentApi.delete