import { createFileRoute } from "@tanstack/react-router"

import ToolsPage from "@/features/tools"

export const Route = createFileRoute("/_authenticated/tools/")({
    component: ToolsPage,
})
