import { createFileRoute } from "@tanstack/react-router"
import InventoryAccountConfigPage from "@/features/inventory/account-config"

export const Route = createFileRoute("/_authenticated/inventory/account-config/")({
    component: InventoryAccountConfigPage,
})
