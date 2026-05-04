import { createFileRoute } from "@tanstack/react-router"
import InventoryLedgerPage from "@/features/inventory/ledger"

export const Route = createFileRoute("/_authenticated/inventory/ledgers/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string"
                ? search.keyword
                : "",

        product_id:
            search.product_id !== undefined && !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        warehouse_id:
            search.warehouse_id !== undefined && !isNaN(Number(search.warehouse_id))
                ? Number(search.warehouse_id)
                : undefined,

        doc_type:
            typeof search.doc_type === "string"
                ? search.doc_type
                : undefined,

        from_date:
            typeof search.from_date === "string"
                ? search.from_date
                : undefined,

        to_date:
            typeof search.to_date === "string"
                ? search.to_date
                : undefined,
    }),
    component: InventoryLedgerPage,
})