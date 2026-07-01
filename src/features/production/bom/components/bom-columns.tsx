import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Layers3 } from "lucide-react"

import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Button } from "@/components/ui/button"
import type { ProductBom } from "../data/schema"
import { ProductBomRowActions } from "./bom-row-actions"
import { useProductBoms } from "./boms-provider"

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}

function productLabel(bom: ProductBom) {
    if (!bom.product) return bom.product_id ? `#${bom.product_id}` : "-"
    return `${bom.product.code} - ${bom.product.name}`
}

export const productBomColumns: ColumnDef<ProductBom>[] = [
    buildIndexColumn(),

    buildTextColumn<ProductBom>({
        title: "Thành phẩm",
        width: 420,
        render: (bom) => <ProductCell bom={bom} />,
    }),

    buildTextColumn<ProductBom>({
        accessorKey: "version",
        title: "Phiên bản",
        width: 190,
    }),

    buildTextColumn<ProductBom>({
        title: "Hiệu lực",
        width: 220,
        render: (bom) => `${formatDate(bom.valid_from)} - ${formatDate(bom.valid_to)}`,
    }),

    buildTextColumn<ProductBom>({
        title: "Dòng vật tư",
        width: 120,
        render: (bom) => <BomItemsCountButton bom={bom} />,
    }),

    buildActionsColumn({
        renderActions: (_, row) => <ProductBomRowActions row={row} />,
    }),
]

function BomItemsCountButton({ bom }: { bom: ProductBom }) {
    const { openDetail } = useProductBoms()
    const count = bom.items?.length ?? 0

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => openDetail(bom)}
        >
            <Eye className="mr-2 h-4 w-4" />
            {count} dòng
        </Button>
    )
}

function ProductCell({ bom }: { bom: ProductBom }) {
    const { openDetail } = useProductBoms()

    return (
        <button
            type="button"
            className="flex w-full min-w-0 items-center gap-2 rounded-md text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetail(bom)}
        >
            <Layers3 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
                <span className="block truncate font-medium">
                    {productLabel(bom)}
                </span>
                {bom.note && (
                    <span className="block truncate text-xs text-muted-foreground">
                        {bom.note}
                    </span>
                )}
            </span>
        </button>
    )
}
