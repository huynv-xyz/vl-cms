import { createFileRoute } from "@tanstack/react-router"
import InventoryVoucherPage from "@/features/inventory/voucher"

export const Route = createFileRoute("/_authenticated/inventory/vouchers/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        type: typeof search.type === "string" ? search.type : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
        warehouse_id: search.warehouse_id !== undefined && !Number.isNaN(Number(search.warehouse_id)) ? Number(search.warehouse_id) : undefined,
        warehouse_ids: typeof search.warehouse_ids === "string"
            ? search.warehouse_ids.split(",").map(Number).filter(Number.isFinite)
            : undefined,
        from: typeof search.from === "string" ? search.from : undefined,
        to: typeof search.to === "string" ? search.to : undefined,
    }),
    component: InventoryVoucherPage,
})
