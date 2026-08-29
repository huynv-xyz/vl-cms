import { apiGet } from "@/api/client"
import type { PagedResult } from "@/api/client"

export type AuditLog = {
    id: number
    module: string
    entity_type: string
    entity_id: string
    action: string
    source_type?: string | null
    result_status?: string | null
    summary?: string | null
    old_values: Record<string, unknown> | string
    new_values: Record<string, unknown> | string
    changed_fields: string[] | string
    changed_by: number | null
    changed_by_name: string
    request_method?: string | null
    request_path?: string | null
    ip_address?: string | null
    user_agent?: string | null
    request_id?: string | null
    detail_ref_type?: string | null
    detail_ref_id?: string | null
    changed_at: string
}

export function listAuditLogs(entityType: string, entityId: number | string) {
    return apiGet<PagedResult<AuditLog>>("/audit-logs", {
        entity_type: entityType,
        entity_id: entityId,
        page: 1,
        size: 100,
    })
}

export type AuditLogFilters = {
    page?: number
    size?: number
    module?: string
    entity_type?: string
    entity_id?: string
    action?: string
    source_type?: string
    result_status?: string
    changed_by?: string
    from_date?: string
    to_date?: string
    keyword?: string
}

export type AuditLogOption = {
    value: string
    label: string
    module?: string
    order?: number
    count?: number
    available?: boolean
    uncataloged?: boolean
}

export type AuditLogOptions = {
    modules: AuditLogOption[]
    entity_types: AuditLogOption[]
    actions?: AuditLogOption[]
    source_types?: AuditLogOption[]
    result_statuses?: AuditLogOption[]
    changed_users?: { id: number; name: string; count?: number }[]
}

export const searchAuditLogs = (params: AuditLogFilters) =>
    apiGet<PagedResult<AuditLog>>("/audit-logs", params)

export const getAuditLogOptions = (params?: AuditLogFilters) =>
    apiGet<AuditLogOptions>("/audit-logs/options", params)
