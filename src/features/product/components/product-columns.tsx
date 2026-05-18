import type { ColumnDef } from "@tanstack/react-table"
import { Box, Eye } from "lucide-react"

import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { Product } from "../data/schema"
import { ProductRowActions } from "./product-row-actions"
import { useProducts } from "./products-provider"

export const productColumns: ColumnDef<Product>[] = [
    buildIndexColumn(),

    buildTextColumn<Product>({
        title: "Sản phẩm",
        render: (product) => <ProductCell product={product} />,
    }),

    buildTextColumn<Product>({
        title: "Tính chất",
        width: 150,
        render: (product) => product.nature || "-",
    }),

    buildTextColumn<Product>({
        title: "Nhóm sản phẩm",
        width: 220,
        render: (product) => (
            <div className="min-w-[180px]">
                <div className="font-medium">{product.group?.name || product.group_name || "-"}</div>
                {(product.group?.code || product.group_code) && (
                    <div className="text-xs text-muted-foreground">
                        {product.group?.code || product.group_code}
                    </div>
                )}
            </div>
        ),
    }),

    buildTextColumn<Product>({
        title: "ĐVT",
        width: 90,
        render: (product) => product.unit || "-",
    }),

    buildTextColumn<Product>({
        title: "Kho ngầm định",
        width: 180,
        render: (product) =>
            product.default_warehouse?.name ||
            (product.default_warehouse_id ? `#${product.default_warehouse_id}` : "-"),
    }),

    buildTextColumn<Product>({
        title: "TK kho",
        width: 110,
        render: (product) => product.inventory_account_code || "-",
    }),

    buildBadgeColumn<Product>({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Hoạt động" : "Ngừng"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <ProductRowActions row={row} />,
    }),
]

function ProductCell({ product }: { product: Product }) {
    const { openDetail } = useProducts()

    return (
        <button
            type="button"
            className="flex min-w-[320px] max-w-full items-start gap-3 rounded-md text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetail(product)}
        >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <Box className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0">
                <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{product.code}</span>
                    <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                    {product.name}
                </span>
            </span>
        </button>
    )
}
