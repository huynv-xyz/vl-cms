import { apiDelete, apiDownload, apiGet, apiPost, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"
import type {
    Seminar,
    SeminarDocument,
    SeminarProduct,
} from "@/features/seminar/data/schema"

export type SeminarListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
    from_date?: string
    to_date?: string
}

export type UpsertSeminarRequest = Partial<Seminar>

export function listSeminars(params: SeminarListParams) {
    return apiGet<PagedResult<Seminar>>("/seminars", { ...params, limit: params.size })
}

export function getSeminar(id: number) {
    return apiGet<Seminar>(`/seminars/${id}`)
}

export function createSeminar(body: UpsertSeminarRequest) {
    return apiPost<Seminar>("/seminars", body)
}

export function updateSeminar(id: number, body: UpsertSeminarRequest) {
    return apiPut<Seminar>(`/seminars/${id}`, body)
}

export function deleteSeminar(id: number) {
    return apiDelete<string>(`/seminars/${id}`, { id })
}

export function replaceSeminarProducts(id: number, circulationProductIds: number[]) {
    return apiPut<SeminarProduct[]>(`/seminars/${id}/products`, {
        circulation_product_ids: circulationProductIds,
    })
}

export function generateSeminarDocument(id: number, type: "permit" | "invitation") {
    const suffix = type === "permit" ? "permit-application" : "invitation"
    return apiPost<SeminarDocument>(`/seminars/${id}/documents/${suffix}`, {})
}

export function listSeminarDocuments(id: number) {
    return apiGet<SeminarDocument[]>(`/seminars/${id}/documents`)
}

export function uploadSeminarTemplate(templateCode: "permit_application" | "invitation", file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<{ template_code: string; file_path: string }>(`/seminars/templates/${templateCode}`, formData)
}

export async function downloadSeminarTemplate(templateCode: "permit_application" | "invitation") {
    return downloadBlob(await apiDownload(`/seminars/templates/${templateCode}/download`))
}

export async function downloadSeminarDocument(id: number) {
    return downloadBlob(await apiDownload(`/seminars/documents/${id}/download`))
}

export async function downloadSeminarCirculationDecisionFiles(id: number, fallbackFileName?: string) {
    return downloadBlob(await apiDownload(`/seminars/${id}/circulation-decision-files`), fallbackFileName)
}

export async function downloadSeminarCirculationDecisionFilesWithAuthorizations(id: number, fallbackFileName?: string) {
    return downloadBlob(await apiDownload(`/seminars/${id}/circulation-decision-files`, { include_authorizations: true }), fallbackFileName)
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
