import { createFileRoute } from "@tanstack/react-router"
import AccessPermissionPage from "@/features/access/permission"

export const Route = createFileRoute("/_authenticated/access/permissions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: AccessPermissionPage,
})
