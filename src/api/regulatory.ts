import { apiDelete, apiDownload, apiGet, apiPost, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"
import type { CirculationDecision, CirculationProduct } from "@/features/regulatory/data/schema"

export type CirculationDecisionListParams = {
    page: number
    size: number
    keyword?: string
    validity?: string
    source_type?: string
    decision_no?: string
    source_keywords?: string
    issued_date_from?: string
    issued_date_to?: string
    expired_date_from?: string
    expired_date_to?: string
    sort_field?: "issued_date" | "expired_date"
    sort_direction?: "asc" | "desc"
}

export type CirculationProductListParams = {
    page: number
    size: number
    keyword?: string
    decision_id?: number
    active_only?: boolean
    effective_date?: string
}

export type UpsertDecisionRequest = Partial<CirculationDecision>
export type UpsertCirculationProductRequest = Partial<CirculationProduct>

export function listCirculationDecisions(params: CirculationDecisionListParams) {
    return apiGet<PagedResult<CirculationDecision>>("/regulatory/circulation-decisions", { ...params, limit: params.size })
}

export function getCirculationDecision(id: number) {
    return apiGet<CirculationDecision>(`/regulatory/circulation-decisions/${id}`)
}

export function createCirculationDecision(body: UpsertDecisionRequest) {
    return apiPost<CirculationDecision>("/regulatory/circulation-decisions", body)
}

export function updateCirculationDecision(id: number, body: UpsertDecisionRequest) {
    return apiPut<CirculationDecision>(`/regulatory/circulation-decisions/${id}`, body)
}

export function deleteCirculationDecision(id: number) {
    return apiDelete<string>(`/regulatory/circulation-decisions/${id}`, { id })
}

export function uploadCirculationDecisionPdf(id: number, file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<CirculationDecision>(`/regulatory/circulation-decisions/${id}/pdf`, formData)
}

export function uploadCirculationDecisionAuthorizationFile(id: number, file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<CirculationDecision>(`/regulatory/circulation-decisions/${id}/authorization-files`, formData)
}

export function deleteCirculationDecisionAuthorizationFile(id: number, index: number) {
    return apiDelete<CirculationDecision>(`/regulatory/circulation-decisions/${id}/authorization-files/${index}`, { id, index })
}

export function listCirculationProducts(params: CirculationProductListParams) {
    return apiGet<PagedResult<CirculationProduct>>("/regulatory/circulation-decisions/products", { ...params, limit: params.size })
}

export function createCirculationProduct(decisionId: number, body: UpsertCirculationProductRequest) {
    return apiPost<CirculationProduct>(`/regulatory/circulation-decisions/${decisionId}/products`, body)
}

export function updateCirculationProduct(id: number, body: UpsertCirculationProductRequest) {
    return apiPut<CirculationProduct>(`/regulatory/circulation-decisions/products/${id}`, body)
}

export function deleteCirculationProduct(id: number) {
    return apiDelete<string>(`/regulatory/circulation-decisions/products/${id}`, { id })
}

export async function downloadCirculationDecisionPdf(id: number, fallbackFileName?: string) {
    return downloadBlob(await apiDownload(`/regulatory/circulation-decisions/${id}/pdf`), fallbackFileName)
}

export async function downloadCirculationDecisionAuthorizationFile(id: number, index: number, fallbackFileName?: string) {
    return downloadBlob(await apiDownload(`/regulatory/circulation-decisions/${id}/authorization-files/${index}`), fallbackFileName)
}

function downloadBlob(result: { blob: Blob; fileName: string }, fallbackFileName?: string) {
    const url = URL.createObjectURL(result.blob)
    const link = document.createElement("a")
    link.href = url
    link.download = result.fileName === "download" && fallbackFileName ? fallbackFileName : result.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}