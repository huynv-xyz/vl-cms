import type { ColumnDef } from "@tanstack/react-table"

import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { Product } from "../data/schema"
import { formatProductNature } from "./product-nature"
import { ProductRowActions } from "./product-row-actions"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

export const productColumns: ColumnDef<Product>[] = [
    {
        ...buildIndexColumn<Product>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<Product>({
        accessorKey: "code",
        title: "Mã sản phẩm",
        width: 170,
        className: `w-[170px] whitespace-nowrap ${centerCell}`,
        textClassName: "font-mono text-sm font-semibold",
    }),

    buildTextColumn<Product>({
        accessorKey: "name",
        title: "Tên sản phẩm",
        width: 340,
        className: `w-[340px] ${gridCell}`,
        textClassName: "text-sm font-medium",
    }),

    buildTextColumn<Product>({
        title: "Tính chất",
        width: 150,
        className: `w-[150px] whitespace-nowrap ${centerCell}`,
        render: (product) => formatProductNature(product.nature),
    }),

    buildTextColumn<Product>({
        title: "Nhóm sản phẩm",
        width: 220,
        className: `w-[220px] ${centerCell}`,
        render: (product) => (
            <div className="min-w-0 text-center">
                <div className="truncate font-medium">{product.group?.name || product.group_name || "-"}</div>
                {(product.group?.code || product.group_code) && (
                    <div className="truncate text-xs text-muted-foreground">
                        {product.group?.code || product.group_code}
                    </div>
                )}
            </div>
        ),
    }),

    buildTextColumn<Product>({
        title: "Báo giá XNK",
        width: 220,
        className: `w-[220px] ${centerCell}`,
        render: (product) => (
            <div className="min-w-0 text-center">
                <div className="truncate font-medium">{product.quote_code || "-"}</div>
                <div className="truncate text-xs text-muted-foreground">
                    {product.quote_name || "-"}
                </div>
            </div>
        ),
    }),

    buildTextColumn<Product>({
        title: "ĐVT",
        width: 90,
        className: `w-[90px] whitespace-nowrap ${centerCell}`,
        render: (product) => product.unit || "-",
    }),

    buildTextColumn<Product>({
        title: "Kho ngầm định",
        width: 180,
        className: `w-[180px] ${centerCell}`,
        render: (product) =>
            product.default_warehouse?.name ||
            (product.default_warehouse_id ? `#${product.default_warehouse_id}` : "-"),
    }),

    buildTextColumn<Product>({
        title: "TK kho",
        width: 110,
        className: `w-[110px] whitespace-nowrap ${centerCell}`,
        render: (product) => product.inventory_account_code || "-",
    }),

    {
        ...buildBadgeColumn<Product>({
            accessorKey: "status",
            title: "Trạng thái",
            mapValueToLabel: (v) => (Number(v) === 1 ? "Hoạt động" : "Ngừng"),
            width: 120,
        }),
        meta: {
            thClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[120px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        enableHiding: false,
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center gap-2">
                <ProductRowActions row={row} />
            </div>
        ),
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
        },
    },
]
