import { apiGet, apiPut } from "@/api/client"

type TablePreferenceResponse = {
    table_key?: string
    tableKey?: string
    preference_json?: string | null
    preferenceJson?: string | null
}

export async function getTablePreference<T>(tableKey: string): Promise<T | null> {
    const response = await apiGet<TablePreferenceResponse>(`/ui/preferences/table/${encodeURIComponent(tableKey)}`)
    const json = response.preference_json ?? response.preferenceJson
    if (!json) return null
    try {
        return JSON.parse(json) as T
    } catch {
        return null
    }
}

export async function saveTablePreference<T>(tableKey: string, preference: T): Promise<T> {
    const response = await apiPut<TablePreferenceResponse>(`/ui/preferences/table/${encodeURIComponent(tableKey)}`, {
        preference_json: JSON.stringify(preference),
    })
    const json = response.preference_json ?? response.preferenceJson
    return json ? JSON.parse(json) as T : preference
}
