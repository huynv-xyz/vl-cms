import type { Customer } from "@/features/customer/data/schema"
import type { Employee } from "@/features/employee/data/schema"

export type CirculationDecision = {
    id: number
    decision_no: string
    issued_date?: string
    expired_date?: string
    pdf_file_name?: string
    pdf_file_path?: string
    note?: string
    validity_status?: "ACTIVE" | "EXPIRED"
    products?: CirculationProduct[]
    created_at?: string
    updated_at?: string
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

export type SeminarProduct = {
    id: number
    seminar_id: number
    circulation_product_id: number
    display_order?: number
    product_type?: string
    product_name: string
    circulation_code: string
    decision_no: string
    issued_date?: string
    expired_date?: string
    note?: string
}

export type SeminarDocument = {
    id: number
    seminar_id: number
    document_type: "PERMIT_APPLICATION" | "INVITATION" | string
    source_id?: number
    file_name: string
    file_path: string
    template_code?: string
    generated_at?: string
}

export type Seminar = {
    id: number
    code: string
    name: string
    customer_id: number
    customer_code?: string
    customer?: Customer
    dealer_name: string
    dealer_address?: string
    dealer_contact_name?: string
    dealer_contact_phone?: string
    permission_authority?: string
    permit_application_date?: string
    seminar_date: string
    start_time?: string
    venue_address?: string
    contact_name?: string
    contact_phone?: string
    reporter_employee_id?: number
    reporter_employee_code?: string
    reporter_employee_name?: string
    reporter_employee?: Employee
    attendee_count?: number
    status: "PLANNED" | "ONGOING" | "DONE" | "CANCELLED" | string
    note?: string
    product_count?: number
    products?: SeminarProduct[]
    documents?: SeminarDocument[]
    created_at?: string
    updated_at?: string
}
