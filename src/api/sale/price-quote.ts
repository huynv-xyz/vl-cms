import { apiGet, apiPostMultipart, type PagedResult } from "@/api/client"
import type {
    SalesPriceQuoteFooter,
    SalesPriceQuoteHeader,
    SalesPriceQuoteImport,
    SalesPriceQuoteRow,
} from "@/features/sale/price-quote/data/schema"

export type PriceQuoteListParams = {
    page: number
    size: number
    sheetType?: string
    keyword?: string
    productGroupCode?: string
    productGroupName?: string
    minCashPrice?: string
    maxCashPrice?: string
}

export type PriceQuoteMetadata = {
    latest_import: SalesPriceQuoteImport | null
    groups: { product_group_name?: string | null }[]
    headers: SalesPriceQuoteHeader[]
    footers: SalesPriceQuoteFooter[]
}

export function listPriceQuotes(params: PriceQuoteListParams) {
    return apiGet<PagedResult<SalesPriceQuoteRow>>("/sales/price-quotes", {
        ...params,
        limit: params.size,
    })
}

export function listPriceQuoteExportRows(params: Omit<PriceQuoteListParams, "page" | "size">) {
    return apiGet<SalesPriceQuoteRow[]>("/sales/price-quotes/export-rows", params)
}

export function getPriceQuoteMetadata() {
    return apiGet<PriceQuoteMetadata>("/sales/price-quotes/metadata")
}

export async function importPriceQuoteWorkbook(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<{ affected: number; latest_import: SalesPriceQuoteImport }>(
        "/sales/price-quotes/import-excel",
        formData
    )
}
