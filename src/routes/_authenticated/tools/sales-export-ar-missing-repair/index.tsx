import { createFileRoute } from "@tanstack/react-router"

import SalesExportArMissingRepairToolPage from "@/features/sales-export-ar-missing-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-export-ar-missing-repair/")({
    component: SalesExportArMissingRepairToolPage,
})
