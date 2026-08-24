import { createFileRoute } from "@tanstack/react-router"

import InventoryAccountOverSyncRepairToolPage from "@/features/inventory-account-over-sync-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/inventory-account-over-sync-repair/")({
    component: InventoryAccountOverSyncRepairToolPage,
})
