import { apiDelete, apiGet, apiPost, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"
import type {
    CreateProductBomRequest,
    ProductBom,
} from "@/features/production/bom/data/schema"

export type ProductBomListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    active?: boolean
}

export function listProductBoms(params: ProductBomListParams) {
    return apiGet<PagedResult<ProductBom>>("/productions/boms", {
        page: params.page,
        limit: params.size,
        keyword: params.keyword,
        product_id: params.product_id,
        active: params.active,
    })
}

export function createProductBom(body: CreateProductBomRequest) {
    return apiPost<ProductBom>("/productions/boms", body)
}

export function updateProductBom(id: number, body: CreateProductBomRequest) {
    return apiPut<ProductBom>(`/productions/boms/${id}`, body)
}

export function deleteProductBom(id: number) {
    return apiDelete<boolean>(`/productions/boms/${id}`, { id })
}

export function getEffectiveProductBom(productId: number, date: string) {
    return apiGet<ProductBom>("/productions/boms/effective", {
        product_id: productId,
        date,
    })
}

export type ImportVthhBomResult = {
    total_products: number
    totalProducts?: number
    created_products: number
    createdProducts?: number
    updated_products: number
    updatedProducts?: number
    touched_warehouses: number
    touchedWarehouses?: number
    imported_boms: number
    importedBoms?: number
    imported_bom_items: number
    importedBomItems?: number
    deleted_old_boms: number
    deletedOldBoms?: number
    deleted_old_bom_items: number
    deletedOldBomItems?: number
    version: string
    valid_from: string
    validFrom?: string
    skipped_rows?: number[]
    skippedRows?: number[]
}

export function importVthhBoms(file: File, options?: {
    version?: string
    valid_from?: string
    replace?: boolean
}) {
    const formData = new FormData()
    formData.append("file", file)

    const query = new URLSearchParams()
    if (options?.version) query.set("version", options.version)
    if (options?.valid_from) query.set("valid_from", options.valid_from)
    if (options?.replace !== undefined) query.set("replace", String(options.replace))

    const suffix = query.toString() ? `?${query.toString()}` : ""

    return apiPostMultipart<ImportVthhBomResult>(
        `/productions/boms/import-vthh${suffix}`,
        formData
    )
}
