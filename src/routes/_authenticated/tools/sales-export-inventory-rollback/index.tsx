import { createFileRoute } from "@tanstack/react-router"

import SalesExportInventoryRollbackToolPage from "@/features/sales-export-inventory-rollback-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-export-inventory-rollback/")({
    component: SalesExportInventoryRollbackToolPage,
})
