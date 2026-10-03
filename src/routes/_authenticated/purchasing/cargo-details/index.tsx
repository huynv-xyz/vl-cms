import { createFileRoute } from "@tanstack/react-router"
import CargoDetailsPage from "@/features/purchasing/cargo-details"
import { CARGO_DATE_FIELDS, CARGO_DATE_RANGE_KEYS, type CargoDateRangeKey } from "@/api/purchasing/cargo-details"

export const Route = createFileRoute("/_authenticated/purchasing/cargo-details/")({
    validateSearch: (search: Record<string, unknown>) => {
        const text = (key: string) => typeof search[key] === "string" ? search[key] as string : undefined
        const dates = Object.fromEntries(CARGO_DATE_RANGE_KEYS.map(key => [key, text(key)])) as Record<CargoDateRangeKey, string | undefined>
        // Preserve previously shared URLs without creating a default date filter.
        const legacyField = { ETD: "etd", ETA: "eta", ATA: "ata", WAREHOUSE_AT: "warehouse_at" }[text("date_type") ?? ""]
        if (legacyField) {
            for (const suffix of ["from", "to"] as const) {
                const key = `${legacyField}_${suffix}` as CargoDateRangeKey
                dates[key] ??= text(`date_${suffix}`)
            }
        }
        const sortField = text("sort_field")
        const sortDirection = text("sort_direction")
        const validSort = CARGO_DATE_FIELDS.some(field => field === sortField) && (sortDirection === "asc" || sortDirection === "desc")
        return {
            page: Math.max(1, Number(search.page) || 1),
            size: Math.min(200, Math.max(1, Number(search.size) || 20)),
            keyword: text("keyword") ?? "",
            product_ids: text("product_ids"),
            supplier_ids: text("supplier_ids"),
            port_ids: text("port_ids"),
            warehouse_ids: text("warehouse_ids"),
            natures: text("natures"),
            status: text("status"),
            ...dates,
            sort_field: validSort ? sortField : undefined,
            sort_direction: validSort ? sortDirection : undefined,
        }
    },
    component: CargoDetailsPage,
})
