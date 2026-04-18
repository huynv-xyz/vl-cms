import { createCrudApi } from "@/api/crud"
import type { Currency } from "@/features/purchasing/currency/data/schema"

export type CurrencyListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateCurrencyRequest = Partial<Currency>
export type UpdateCurrencyRequest = Currency

const currencyApi = createCrudApi<
    Currency,
    CreateCurrencyRequest,
    UpdateCurrencyRequest,
    CurrencyListParams
>("/purchasing/currencies")

export const listCurrencies = currencyApi.list
export const getCurrency = currencyApi.detail
export const createCurrency = currencyApi.create
export const updateCurrency = currencyApi.update
export const deleteCurrency = currencyApi.delete