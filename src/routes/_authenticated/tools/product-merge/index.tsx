import { createFileRoute } from "@tanstack/react-router"

import ProductMergeToolPage from "@/features/product-merge-tool"

export const Route = createFileRoute("/_authenticated/tools/product-merge/")({
    component: ProductMergeToolPage,
})
