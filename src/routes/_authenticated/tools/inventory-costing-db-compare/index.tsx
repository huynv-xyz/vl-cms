import { createFileRoute } from "@tanstack/react-router"
import InventoryCostingDbCompareToolPage from "@/features/inventory-costing-db-compare-tool"

export const Route = createFileRoute("/_authenticated/tools/inventory-costing-db-compare/")({ component: InventoryCostingDbCompareToolPage })
