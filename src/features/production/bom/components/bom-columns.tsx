import type { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, Eye } from "lucide-react"

import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ProductBom } from "../data/schema"
import { ProductBomRowActions } from "./bom-row-actions"
import { useProductBoms } from "./boms-provider"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-")
    if (year && month && day) return `${day}/${month}/${year}`
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN")
}

function productLabel(bom: ProductBom) {
    if (!bom.product) return bom.product_id ? `#${bom.product_id}` : "-"
    return `${bom.product.code} - ${bom.product.name}`
}

function TruncatedText({ value, className }: { value: unknown; className?: string }) {
    const display = value === null || value === undefined || value === "" ? "-" : String(value)
    return <span className={`block min-w-0 truncate ${className ?? ""}`}>{display}</span>
}

export const productBomColumns: ColumnDef<ProductBom>[] = [
    {
        ...buildIndexColumn<ProductBom>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<ProductBom>({
        title: "Mã BOM",
        width: 110,
        className: `w-[110px] whitespace-nowrap ${centerCell}`,
        render: (bom) => (
            <TruncatedText value={`#${bom.id}`} className="text-center font-mono text-sm font-semibold" />
        ),
    }),

    buildTextColumn<ProductBom>({
        title: "Thành phẩm",
        width: 420,
        className: `w-[420px] ${gridCell}`,
        render: (bom) => <ProductCell bom={bom} />,
    }),

    buildTextColumn<ProductBom>({
        accessorKey: "version",
        title: "Phiên bản",
        width: 220,
        className: `w-[220px] ${centerCell}`,
        render: (bom) => <TruncatedText value={bom.version} className="text-center font-medium" />,
    }),

    buildTextColumn<ProductBom>({
        title: "Hiệu lực từ",
        width: 130,
        className: `w-[130px] whitespace-nowrap ${centerCell}`,
        render: (bom) => <TruncatedText value={formatDate(bom.valid_from)} className="text-center" />,
    }),

    buildTextColumn<ProductBom>({
        title: "Hiệu lực đến",
        width: 130,
        className: `w-[130px] whitespace-nowrap ${centerCell}`,
        render: (bom) => <TruncatedText value={formatDate(bom.valid_to)} className="text-center" />,
    }),

    {
        id: "active",
        header: "Trạng thái",
        size: 130,
        cell: ({ row }) => (
            <div className="flex justify-center">
                {activeOf(row.original) ? (
                    <Badge className="rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Đang dùng</Badge>
                ) : (
                    <Badge variant="outline" className="rounded-md text-muted-foreground">Ngưng dùng</Badge>
                )}
            </div>
        ),
        enableSorting: false,
        meta: {
            thClassName: `w-[130px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[130px] whitespace-nowrap ${centerCell}`,
        },
    },

    {
        id: "items",
        header: "Dòng vật tư",
        size: 150,
        cell: ({ row }) => <BomItemsCountButton bom={row.original} />,
        enableSorting: false,
        meta: {
            thClassName: `w-[150px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[150px] whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<ProductBom>({
        accessorKey: "note",
        title: "Ghi chú",
        width: 260,
        className: `w-[260px] ${gridCell}`,
        render: (bom) => <TruncatedText value={bom.note} />,
    }),

    {
        id: "actions",
        header: "Thao tác",
        size: 90,
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <ProductBomRowActions row={row} />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
        },
    },
]

function BomItemsCountButton({ bom }: { bom: ProductBom }) {
    const { openDetail } = useProductBoms()
    const count = bom.items?.length ?? 0
    const empty = count === 0

    return (
        <Button
            type="button"
            variant={empty ? "destructive" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => openDetail(bom)}
            title={empty ? "BOM chưa có dòng vật tư/bao bì" : "Xem dòng vật tư"}
        >
            {empty ? <AlertTriangle className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {count} dòng
        </Button>
    )
}

function ProductCell({ bom }: { bom: ProductBom }) {
    const { openDetail } = useProductBoms()

    return (
        <button
            type="button"
            className="block w-full min-w-0 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetail(bom)}
        >
            <TruncatedText value={productLabel(bom)} className="font-medium" />
            {bom.product?.code ? (
                <TruncatedText value={bom.product.code} className="text-xs text-muted-foreground" />
            ) : null}
        </button>
    )
}
