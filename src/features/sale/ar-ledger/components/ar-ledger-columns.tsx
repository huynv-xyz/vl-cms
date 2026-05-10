import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { ArLedger } from "../data/schema"
import { formatCurrency } from "@/lib/utils"

export const arLedgerColumns: ColumnDef<ArLedger>[] = [

    // STT
    buildIndexColumn(),

    // Ngày
    buildTextColumn({
        accessorKey: "posting_date",
        title: "Ngày chứng từ",
    }),

    // Chứng từ
    buildTextColumn({
        accessorKey: "doc_no",
        title: "Chứng từ",
    }),

    // Khách hàng
    buildTextColumn({
        id: "customer_code",
        title: "Mã khách hàng",
        render: (row) => row.customer?.code
    }),

    buildTextColumn({
        id: "customer_name",
        title: "Tên khách hàng",
        render: (row) => row.customer?.name
    }),

    // TK
    buildTextColumn({
        accessorKey: "account_code",
        title: "TK",
    }),

    // Nợ
    buildTextColumn({
        accessorKey: "debit_amount",
        title: "Nợ",
        className: "text-right",
        textClassName: "text-sm text-right text-red-600",
        render: (row) => <b>{formatCurrency(row.debit_amount)}</b>,
    }),

    // Có
    buildTextColumn({
        accessorKey: "credit_amount",
        title: "Có",
        className: "text-right",
        textClassName: "text-sm text-right text-green-600",
        render: (row) => <b>{formatCurrency(row.credit_amount)}</b>,
    }),

    // Loại nghiệp vụ
    buildTextColumn({
        accessorKey: "source_type",
        title: "Loại",
        render: (row) => {
            switch (row.source_type) {
                case "RETURN":
                    return "Trả hàng"
                case "EXPORT":
                    return "Bán hàng"
                case "RECEIPT":
                    return "Thu tiền"
                case "ADJUST":
                    return "Điều chỉnh"
                case "IMPORT":
                    return "Import"
                default:
                    return row.source_type ?? "-"
            }
        },
    }),

    // Diễn giải
    buildTextColumn({
        accessorKey: "description",
        title: "Diễn giải",
    }),
]