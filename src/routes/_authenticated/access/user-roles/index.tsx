import { createFileRoute } from "@tanstack/react-router"
import UserRolePage from "@/features/access/user-role"

export const Route = createFileRoute("/_authenticated/access/user-roles/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: UserRolePage,
})
