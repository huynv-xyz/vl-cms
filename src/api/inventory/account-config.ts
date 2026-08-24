import { apiGet, apiPut } from "@/api/client"

export type InventoryAccountConfig = {
    id: number
    code: string
    name: string
    direction?: "I" | "O" | string
    source?: string | null
    prefix?: string | null
    tk_no?: string | null
    tk_co?: string | null
    account_rules?: InventoryAccountRule[]
    active?: number
    allow_manual_create?: number
    allow_system_create?: number
    allow_import?: number
    manual_sort_order?: number | null
}

export type InventoryAccountRule = {
    id?: number
    voucher_type_code?: string
    movement_side: "DEFAULT" | "OUTBOUND" | "INBOUND" | string
    tk_no?: string | null
    tk_co?: string | null
}

export type UpdateInventoryAccountConfigRequest = {
    tk_no?: string | null
    tk_co?: string | null
    account_rules?: Array<{
        movement_side: string
        tk_no?: string | null
        tk_co?: string | null
    }>
}

export function listInventoryAccountConfigs() {
    return apiGet<InventoryAccountConfig[]>("/inventory/account-config")
}

export function updateInventoryAccountConfig(id: number, body: UpdateInventoryAccountConfigRequest) {
    return apiPut<InventoryAccountConfig>(`/inventory/account-config/${id}`, body)
}
