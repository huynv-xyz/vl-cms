import { createFileRoute } from "@tanstack/react-router"
import InventoryCostingPage from "@/features/inventory/costing"

export const Route = createFileRoute("/_authenticated/inventory/costing/")({
    component: InventoryCostingPage,
})
