import { createFileRoute } from "@tanstack/react-router"
import InventoryLedgerPage from "@/features/inventory/ledger"

export const Route = createFileRoute("/_authenticated/inventory/ledgers/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),

        keyword:
            typeof search.keyword === "string"
                ? search.keyword
                : "",

        warehouse_id:
            search.warehouse_id !== undefined && !isNaN(Number(search.warehouse_id))
                ? Number(search.warehouse_id)
                : undefined,
        warehouse_ids: typeof search.warehouse_ids === "string" ? search.warehouse_ids : undefined,
        product_ids: typeof search.product_ids === "string" ? search.product_ids : undefined,

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
                : todayYmd(),

        doc_text: typeof search.doc_text === "string" ? search.doc_text : undefined,
        doc_text_op: typeof search.doc_text_op === "string" ? search.doc_text_op : undefined,
        description_text: typeof search.description_text === "string" ? search.description_text : undefined,
        description_text_op: typeof search.description_text_op === "string" ? search.description_text_op : undefined,
        supplier_text: typeof search.supplier_text === "string" ? search.supplier_text : undefined,
        supplier_text_op: typeof search.supplier_text_op === "string" ? search.supplier_text_op : undefined,
        product_text: typeof search.product_text === "string" ? search.product_text : undefined,
        product_text_op: typeof search.product_text_op === "string" ? search.product_text_op : undefined,
        product_code_text: typeof search.product_code_text === "string" ? search.product_code_text : undefined,
        product_code_text_op: typeof search.product_code_text_op === "string" ? search.product_code_text_op : undefined,
        product_name_text: typeof search.product_name_text === "string" ? search.product_name_text : undefined,
        product_name_text_op: typeof search.product_name_text_op === "string" ? search.product_name_text_op : undefined,
        warehouse_code_text: typeof search.warehouse_code_text === "string" ? search.warehouse_code_text : undefined,
        warehouse_code_text_op: typeof search.warehouse_code_text_op === "string" ? search.warehouse_code_text_op : undefined,
        warehouse_name_text: typeof search.warehouse_name_text === "string" ? search.warehouse_name_text : undefined,
        warehouse_name_text_op: typeof search.warehouse_name_text_op === "string" ? search.warehouse_name_text_op : undefined,
        unit: typeof search.unit === "string" ? search.unit : undefined,
        lot_text: typeof search.lot_text === "string" ? search.lot_text : undefined,
        lot_text_op: typeof search.lot_text_op === "string" ? search.lot_text_op : undefined,
        tk_no: typeof search.tk_no === "string" ? search.tk_no : undefined,
        tk_co: typeof search.tk_co === "string" ? search.tk_co : undefined,
        unit_price_op: normalizeNumberOp(search.unit_price_op),
        unit_price_value: normalizeNumberValue(search.unit_price_value),
        opening_quantity_op: normalizeNumberOp(search.opening_quantity_op),
        opening_quantity_value: normalizeNumberValue(search.opening_quantity_value),
        opening_value_op: normalizeNumberOp(search.opening_value_op),
        opening_value_value: normalizeNumberValue(search.opening_value_value),
        inbound_quantity_op: normalizeNumberOp(search.inbound_quantity_op),
        inbound_quantity_value: normalizeNumberValue(search.inbound_quantity_value),
        inbound_value_op: normalizeNumberOp(search.inbound_value_op),
        inbound_value_value: normalizeNumberValue(search.inbound_value_value),
        outbound_quantity_op: normalizeNumberOp(search.outbound_quantity_op),
        outbound_quantity_value: normalizeNumberValue(search.outbound_quantity_value),
        outbound_value_op: normalizeNumberOp(search.outbound_value_op),
        outbound_value_value: normalizeNumberValue(search.outbound_value_value),
        closing_quantity_op: normalizeNumberOp(search.closing_quantity_op),
        closing_quantity_value: normalizeNumberValue(search.closing_quantity_value),
        closing_value_op: normalizeNumberOp(search.closing_value_op),
        closing_value_value: normalizeNumberValue(search.closing_value_value),
        time_sort: search.time_sort === "desc" ? "desc" : "asc",
    }),
    component: InventoryLedgerPage,
})

function todayYmd() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function normalizeNumberOp(value: unknown) {
    return typeof value === "string" &&
        ["eq", "ne", "lt", "lte", "gt", "gte"].includes(value)
        ? value
        : undefined
}

function normalizeNumberValue(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined
    const text = String(value).trim()
    return Number.isFinite(Number(text)) ? text : undefined
}
