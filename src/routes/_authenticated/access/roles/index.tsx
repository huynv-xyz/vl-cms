import { createFileRoute } from "@tanstack/react-router"
import AccessRolePage from "@/features/access/role"

export const Route = createFileRoute("/_authenticated/access/roles/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: AccessRolePage,
})
