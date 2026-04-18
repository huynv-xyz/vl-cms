export function routeTemplate({ Entity, entity }) {
    return `
import { createFileRoute } from "@tanstack/react-router"
import ${Entity}Page from "@/features/${entity}"

export const Route = createFileRoute("/_authenticated/${entity}/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    component: ${Entity}Page,
})
`
}