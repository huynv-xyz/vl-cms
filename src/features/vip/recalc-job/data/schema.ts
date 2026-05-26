export type VipRecalcJob = {
    id: number
    job_type: string
    calc_year?: number
    from_process_month?: number
    to_process_month?: number
    trigger_source?: string
    status: string
    retry_count: number
    error_message?: string
    created_at?: string
    updated_at?: string
    started_at?: string
    finished_at?: string
}
