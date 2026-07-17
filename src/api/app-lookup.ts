import { apiGet, type PagedResult } from "@/api/client"

export type AppLookup = {
    id: number
    type_code: string
    code: string
    name: string
    description?: string
    sort_order?: number
    status: string
}

export type AppLookupListParams = {
    page: number
    size: number
    type_code?: string
    keyword?: string
    status?: string
}

export const listAppLookups = (params: AppLookupListParams) =>
    apiGet<PagedResult<AppLookup>>("/app-lookups", {
        ...params,
        limit: params.size,
    })

export const getAppLookupByCode = (typeCode: string, code: string) =>
    apiGet<AppLookup>("/app-lookups/by-code", {
        type_code: typeCode,
        code,
    })

export const listProductNatureLookups = (params: Omit<AppLookupListParams, "type_code">) =>
    listAppLookups({
        ...params,
        type_code: "PRODUCT_NATURE",
        status: params.status ?? "ACTIVE",
    })

export const getProductNatureLookup = (code: string) =>
    getAppLookupByCode("PRODUCT_NATURE", code)
