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

const normalizeLookupCode = (value: unknown) => {
    if (typeof value === "string" || typeof value === "number") return String(value).trim()
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>
        const candidate = record.code ?? record.value ?? record.id
        return candidate == null ? "" : String(candidate).trim()
    }
    return ""
}

export const getAppLookupByCode = (typeCode: string, code: unknown) => {
    const normalizedCode = normalizeLookupCode(code)
    if (!normalizedCode) return Promise.resolve(null)

    return apiGet<AppLookup>("/app-lookups/by-code", {
        type_code: typeCode,
        code: normalizedCode,
    })
}

export const listProductNatureLookups = (params: Omit<AppLookupListParams, "type_code">) =>
    listAppLookups({
        ...params,
        type_code: "PRODUCT_NATURE",
        status: params.status ?? "ACTIVE",
    })

export const listProductUnitLookups = (params: Omit<AppLookupListParams, "type_code">) =>
    listAppLookups({
        ...params,
        type_code: "PRODUCT_UNIT",
        status: params.status ?? "ACTIVE",
    })

export const getProductNatureLookup = (code: unknown) =>
    getAppLookupByCode("PRODUCT_NATURE", code)
