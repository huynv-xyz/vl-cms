
import { createFileRoute } from "@tanstack/react-router"
import PortPage from "@/features/purchasing/port"

export const Route = createFileRoute("/_authenticated/purchasing/ports/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    component: PortPage,
})
