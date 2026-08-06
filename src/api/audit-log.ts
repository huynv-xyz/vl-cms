import { apiGet } from "@/api/client"

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
    return apiGet<AuditLog[]>("/audit-logs", {
        entity_type: entityType,
        entity_id: entityId,
    })
}
