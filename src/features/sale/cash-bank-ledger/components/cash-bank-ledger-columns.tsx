import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { CashBankLedger } from "../data/schema"

export const cashBankLedgerColumns: ColumnDef<CashBankLedger>[] = [

    // STT
    buildIndexColumn(),

    // Ngày chứng từ
    buildTextColumn({
        accessorKey: "doc_date",
        title: "Ngày CT",
    }),

    // Số chứng từ
    buildTextColumn({
        accessorKey: "doc_no",
        title: "Số CT",
    }),

    // Khách hàng
    buildTextColumn({
        accessorKey: "customer_name",
        title: "Khách hàng",
    }),

    // Diễn giải
    buildTextColumn({
        accessorKey: "description",
        title: "Diễn giải",
    }),

    // TK đối ứng
    buildTextColumn({
        accessorKey: "account_code",
        title: "TK đối ứng",
    }),

    // Thu
    buildTextColumn({
        accessorKey: "debit_amount",
        title: "Thu",
        className: "text-right",
        textClassName: "text-sm text-right text-green-600",
        render: (row) =>
            row.debit_amount
                ? row.debit_amount.toLocaleString()
                : "",
    }),

    // Chi
    buildTextColumn({
        accessorKey: "credit_amount",
        title: "Chi",
        className: "text-right",
        textClassName: "text-sm text-right text-red-600",
        render: (row) =>
            row.credit_amount
                ? row.credit_amount.toLocaleString()
                : "",
    }),
]