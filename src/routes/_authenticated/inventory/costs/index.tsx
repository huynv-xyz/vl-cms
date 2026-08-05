import { createFileRoute } from "@tanstack/react-router"
import InventoryCostsPage from "@/features/inventory/costs"

export const Route = createFileRoute("/_authenticated/inventory/costs/")({
    component: InventoryCostsPage,
})
