import { createFileRoute } from "@tanstack/react-router"
import PurchasingApSummaryPage from "@/features/purchasing/ap-summary"

export const Route = createFileRoute("/_authenticated/purchasing/ap-summary/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string" ? search.keyword : "",

        supplier_ids:
            typeof search.supplier_ids === "string"
                ? search.supplier_ids
                : undefined,

        payment_status:
            typeof search.payment_status === "string"
                ? search.payment_status
                : undefined,

        signed_date_from:
            typeof search.signed_date_from === "string"
                ? search.signed_date_from
                : undefined,

        signed_date_to:
            typeof search.signed_date_to === "string"
                ? search.signed_date_to
                : undefined,
    }),
    component: PurchasingApSummaryPage,
})
