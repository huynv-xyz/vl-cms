import { apiGet, type PagedResult } from "@/api/client"

export type CargoRow = {
    id: number
    shipment_id: number
    contract_item_id: number | null
    product_id: number
    lot_no: string | null
    product_code: string | null
    product_name: string | null
    nature: string | null
    unit: string | null
    etd: string | null
    eta: string | null
    ata: string | null
    port_name: string | null
    warehouse_at: string | null
    warehouse_name: string | null
    status: string | null
    container_no: string | null
    quantity: number
    defect_quantity: number
    real_quantity: number
    production_date: string | null
    expiry_date: string | null
    form: null
    origin: string | null
    supplier_name: string | null
    importer: null
    note: string | null
}

export const CARGO_DATE_FIELDS = ["etd", "eta", "ata", "warehouse_at", "production_date", "expiry_date"] as const
export type CargoDateField = typeof CARGO_DATE_FIELDS[number]
export type CargoDateRangeKey = `${CargoDateField}_from` | `${CargoDateField}_to`
export const CARGO_DATE_RANGE_KEYS = CARGO_DATE_FIELDS.flatMap(field => [`${field}_from`, `${field}_to`] as CargoDateRangeKey[])

export type CargoFilters = Partial<Record<CargoDateRangeKey, string>> & {
    keyword?: string
    product_ids?: string
    supplier_ids?: string
    port_ids?: string
    warehouse_ids?: string
    natures?: string
    status?: string
    sort_field?: string
    sort_direction?: string
}

export type CargoOption = { value: string | number; label: string }
export type CargoOptionKind = "product_ids" | "supplier_ids" | "port_ids" | "warehouse_ids"

export function listCargoDetails(params: CargoFilters & { page: number; size: number }) {
    return apiGet<PagedResult<CargoRow>>("/purchasing/cargo-details", params)
}

export function cargoOptionSource(kind: CargoOptionKind) {
    return {
        getList: (params: { keyword?: string }) =>
            apiGet<{ items: CargoOption[] }>("/purchasing/cargo-details/options", { kind, keyword: params.keyword }),
        getById: async (id: string | number) => {
            const result = await apiGet<{ items: CargoOption[] }>("/purchasing/cargo-details/options", { kind, id })
            return result.items[0] ?? { value: id, label: String(id) }
        },
    }
}
