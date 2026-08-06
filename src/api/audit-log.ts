import { apiGet } from "@/api/client"
import type { PagedResult } from "@/api/client"

export type AuditLog = {
    id: number
    module: string
    entity_type: string
    entity_id: string
    action: string
    old_values: Record<string, unknown> | string
    new_values: Record<string, unknown> | string
    changed_fields: string[] | string
    changed_by: number
    changed_by_name: string
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
    changed_by?: string
    from_date?: string
    to_date?: string
    keyword?: string
}

export type AuditLogOptions = {
    modules: string[]
    entity_types: string[]
}

export const searchAuditLogs = (params: AuditLogFilters) =>
    apiGet<PagedResult<AuditLog>>("/audit-logs", params)

export const getAuditLogOptions = () =>
    apiGet<AuditLogOptions>("/audit-logs/options")
