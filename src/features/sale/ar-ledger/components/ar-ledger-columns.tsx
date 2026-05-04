// components/ar-ledger-columns.ts
import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import type { ArLedger } from "../data/schema"
import { buildCurrencyColumn } from "@/components/crud/build-currency-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"

export const arLedgerColumns: ColumnDef<ArLedger>[] = [

    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "posting_date",
        title: "Ngày",
    }),

    buildTextColumn({
        accessorKey: "doc_no",
        title: "Chứng từ",
    }),

    buildTextColumn({
        accessorKey: "customer_id",
        title: "Khách hàng",
        render: (row) => row.customer?.name,
    }),

    buildTextColumn({
        accessorKey: "order_id",
        title: "Đơn hàng",
        render: (row) => row.order?.order_no,
    }),

    buildTextColumn({
        accessorKey: "product_id",
        title: "Sản phẩm",
        render: (row) => row.product?.name,
    }),

    buildNumberColumn({
        accessorKey: "quantity",
        title: "SL",
    }),

    buildCurrencyColumn({
        accessorKey: "debit_amount",
        title: "Phát sinh Nợ",
    }),

    buildCurrencyColumn({
        accessorKey: "credit_amount",
        title: "Phát sinh Có",
    }),

    buildBadgeColumn({
        accessorKey: "doc_type",
        title: "Loại",
        mapValueToLabel: (v: unknown): string => {
            const value = String(v ?? "-")

            switch (value) {
                case "BAN_HANG": return "Bán hàng"
                case "THU_TIEN": return "Thu tiền"
                default: return value
            }
        },
    }),
]