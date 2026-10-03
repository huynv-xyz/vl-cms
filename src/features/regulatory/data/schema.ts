import type { Company } from "@/features/company/data/schema"

export type CirculationDecision = {
    id: number
    decision_no: string
    issued_date?: string
    expired_date?: string
    source_type?: "INTERNAL" | "EXTERNAL_AUTHORIZED" | string
    source_company_id?: number
    source_company_name?: string
    source_company?: Company
    authorization_valid_from?: string
    authorization_valid_to?: string
    authorization_files_json?: string
    authorization_files?: CirculationDecisionAuthorizationFile[]
    pdf_file_name?: string
    pdf_file_path?: string
    note?: string
    validity_status?: "ACTIVE" | "EXPIRED"
    products?: CirculationProduct[]
    created_at?: string
    updated_at?: string
}

export type CirculationDecisionAuthorizationFile = {
    file_name: string
    file_path?: string
    uploaded_at?: string
}

export type CirculationProduct = {
    id: number
    decision_id: number
    product_type?: string
    product_name: string
    circulation_code: string
    note?: string
    active?: boolean
    decision?: CirculationDecision
    created_at?: string
    updated_at?: string
}