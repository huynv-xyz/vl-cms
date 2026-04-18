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

        product_id:
            search.product_id !== undefined &&
                !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        supplier_id:
            search.supplier_id !== undefined &&
                !isNaN(Number(search.supplier_id))
                ? Number(search.supplier_id)
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