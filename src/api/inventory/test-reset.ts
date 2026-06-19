import { apiPost } from "@/api/client"

export type InventoryTestResetResult = {
    deleted: Record<string, number>
}

export function clearInventoryProductionTestData() {
    return apiPost<InventoryTestResetResult>("/inventory/test-reset/clear-all", {})
}
