
import { createFileRoute } from "@tanstack/react-router"
import ProductPage from "@/features/product"

export const Route = createFileRoute("/_authenticated/products/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
        nature: typeof search.nature === "string" ? search.nature : undefined,
        group_code: typeof search.group_code === "string" ? search.group_code : undefined,
        default_warehouse_id:
            typeof search.default_warehouse_id === "string"
                ? search.default_warehouse_id
                : undefined,
        inventory_account_code:
            typeof search.inventory_account_code === "string"
                ? search.inventory_account_code
                : undefined,
    }),
    component: ProductPage,
})
