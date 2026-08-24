import { createFileRoute } from "@tanstack/react-router"
import PriceQuotePage from "@/features/sale/price-quote"

export const Route = createFileRoute("/_authenticated/sales/price-quotes/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),
        sheetType: typeof search.sheetType === "string" ? search.sheetType : "KHO_DL",
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        productGroupCode: typeof search.productGroupCode === "string" ? search.productGroupCode : "",
        productGroupName: typeof search.productGroupName === "string" ? search.productGroupName : "",
        minCashPrice: typeof search.minCashPrice === "string" ? search.minCashPrice : "",
        maxCashPrice: typeof search.maxCashPrice === "string" ? search.maxCashPrice : "",
    }),
    component: PriceQuotePage,
})
