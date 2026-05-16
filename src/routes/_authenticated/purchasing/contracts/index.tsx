import { createFileRoute } from "@tanstack/react-router"
import ContractPage from "@/features/purchasing/contract"

export const Route = createFileRoute("/_authenticated/purchasing/contracts/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string"
                ? search.keyword
                : "",

        status:
            typeof search.status === "string"
                ? search.status
                : undefined,

        product_ids:
            typeof search.product_ids === "string"
                ? search.product_ids
                : undefined,

        supplier_ids:
            typeof search.supplier_ids === "string"
                ? search.supplier_ids
                : undefined,

        nation_ids:
            typeof search.nation_ids === "string"
                ? search.nation_ids
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
    component: ContractPage,
})
