import { createFileRoute } from "@tanstack/react-router"
import TransactionPage from "@/features/transactions"

export const Route = createFileRoute("/_authenticated/transactions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string" ? search.keyword : "",

        customer_type:
            typeof search.customer_type === "string"
                ? search.customer_type
                : undefined,

        customer_code:
            typeof search.customer_code === "string"
                ? search.customer_code
                : undefined,

        customer_name:
            typeof search.customer_name === "string"
                ? search.customer_name
                : undefined,

        product_code:
            typeof search.product_code === "string"
                ? search.product_code
                : undefined,

        product_name:
            typeof search.product_name === "string"
                ? search.product_name
                : undefined,

        vthh_con:
            typeof search.vthh_con === "string"
                ? search.vthh_con
                : undefined,

        npp:
            typeof search.npp === "string" ? search.npp : undefined,

        process_month:
            typeof search.process_month === "string"
                ? search.process_month
                : undefined,

        hdn_status:
            typeof search.hdn_status === "string"
                ? search.hdn_status
                : undefined,

        region:
            typeof search.region === "string" ? search.region : undefined,

        document_date_from:
            typeof search.document_date_from === "string"
                ? search.document_date_from
                : undefined,

        document_date_to:
            typeof search.document_date_to === "string"
                ? search.document_date_to
                : undefined,
    }),
    component: TransactionPage,
})
