import { PaymentMethod } from "../data/schema"

export type ContractFormValues = {
    code: string

    supplier_id?: number

    signed_date: string

    currency_id?: number

    payment_method?: PaymentMethod
    term?: string

    deposit_rate?: number

    deposit_date?: string

    vat_rate?: number
    import_tax_rate?: number
}