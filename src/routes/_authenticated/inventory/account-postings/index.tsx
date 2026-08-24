import { createFileRoute } from "@tanstack/react-router"
import InventoryAccountPostingsPage from "@/features/inventory/account-postings"

export const Route = createFileRoute("/_authenticated/inventory/account-postings/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),
        from_date: typeof search.from_date === "string" ? search.from_date : undefined,
        to_date: typeof search.to_date === "string" ? search.to_date : todayYmd(),
        account: typeof search.account === "string" ? search.account : "",
    }),
    component: InventoryAccountPostingsPage,
})

function todayYmd() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
