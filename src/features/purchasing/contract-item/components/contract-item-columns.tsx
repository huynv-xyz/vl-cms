import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { ContractItemRowActions } from "./contract-item-row-actions"
import { ContractItem } from "../data/schema"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { buildCurrencyColumn } from "@/components/crud/build-currency-column"

export const contractItemColumns: ColumnDef<any>[] = [
    buildIndexColumn(),

    buildTextColumn({
        id: "product_code",
        title: "Mã SP",
        accessorFn: (row) => row.product?.code,
    }),

    buildTextColumn({
        id: "product_name",
        title: "Tên SP",
        accessorFn: (row) => row.product?.name,
    }),

    buildTextColumn({
        id: "product_unit",
        title: "Đơn vị",
        accessorFn: (row) => row.product?.unit,
    }),

    buildCurrencyColumn({
        accessorKey: "quantity",
        title: "SL mua",
    }),

    buildCurrencyColumn({
        accessorKey: "shipped_quantity",
        title: "SL đi",
    }),

    buildCurrencyColumn({
        accessorKey: "remaining_quantity",
        title: "Còn lại",
    }),

    buildCurrencyColumn({
        accessorKey: "unit_price",
        title: "Đơn giá gốc",
    }),

    buildCurrencyColumn({
        accessorKey: "discount_amount",
        title: "Chiết khấu",
    }),

    buildCurrencyColumn({
        accessorKey: "base_price",
        title: "Giá sau CK",
    }),

    buildCurrencyColumn({
        accessorKey: "packaging_price",
        title: "Giá bao bì",
    }),

    buildCurrencyColumn({
        accessorKey: "freight_price",
        title: "Giá vận chuyển",
    }),

    buildTextColumn({
        id: "import_tax_rate",
        title: "Thuế NK",
        accessorFn: (row) =>
            row.import_tax_rate != null
                ? `${formatNumber(row.import_tax_rate)}%`
                : "-",
    }),

    buildTextColumn({
        id: "vat_rate",
        title: "VAT",
        accessorFn: (row) =>
            row.vat_rate != null
                ? `${formatNumber(row.vat_rate)}%`
                : "-",
    }),

    buildCurrencyColumn({
        accessorKey: "total_amount",
        title: "Thành tiền",
        meta: {
            footer: (rows: ContractItem[]) => {
                const total = rows.reduce(
                    (sum, r) => sum + (r.total_amount ?? 0),
                    0
                )
                return formatCurrency(total)
            },
        },
    }),

    buildActionsColumn({
        renderActions: (_, row) => <ContractItemRowActions row={row} />,
    }),
]