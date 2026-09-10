import { createFileRoute } from "@tanstack/react-router"
import TransactionPage from "@/features/transactions"

export const Route = createFileRoute("/_authenticated/transactions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),

        keyword:
            typeof search.keyword === "string" ? search.keyword : "",

        customer_type:
            typeof search.customer_type === "string"
                ? search.customer_type
                : undefined,

        is_gift:
            typeof search.is_gift === "string"
                ? search.is_gift
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

        product_group_name:
            typeof search.product_group_name === "string"
                ? search.product_group_name
                : undefined,

        sale_user_name:
            typeof search.sale_user_name === "string"
                ? search.sale_user_name
                : undefined,

        unit:
            typeof search.unit === "string"
                ? search.unit
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

        time_sort:
            search.time_sort === "asc" ? "asc" : "desc",

        document_date_from:
            typeof search.document_date_from === "string"
                ? search.document_date_from
                : undefined,

        document_date_to:
            typeof search.document_date_to === "string"
                ? search.document_date_to
                : undefined,

        sale_qty_op: normalizeNumberOp(search.sale_qty_op),
        sale_qty_value: typeof search.sale_qty_value === "string" ? search.sale_qty_value : undefined,
        unit_price_op: normalizeNumberOp(search.unit_price_op),
        unit_price_value: typeof search.unit_price_value === "string" ? search.unit_price_value : undefined,
        sale_revenue_op: normalizeNumberOp(search.sale_revenue_op),
        sale_revenue_value: typeof search.sale_revenue_value === "string" ? search.sale_revenue_value : undefined,
        return_revenue_op: normalizeNumberOp(search.return_revenue_op),
        return_revenue_value: typeof search.return_revenue_value === "string" ? search.return_revenue_value : undefined,
        actual_revenue_op: normalizeNumberOp(search.actual_revenue_op),
        actual_revenue_value: typeof search.actual_revenue_value === "string" ? search.actual_revenue_value : undefined,
        return_qty_op: normalizeNumberOp(search.return_qty_op),
        return_qty_value: typeof search.return_qty_value === "string" ? search.return_qty_value : undefined,
        actual_qty_op: normalizeNumberOp(search.actual_qty_op),
        actual_qty_value: typeof search.actual_qty_value === "string" ? search.actual_qty_value : undefined,
    }),
    component: TransactionPage,
})

function normalizeNumberOp(value: unknown) {
    return typeof value === "string" && ["eq", "ne", "lt", "lte", "gt", "gte"].includes(value)
        ? value
        : undefined
}
