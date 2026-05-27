import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { ArLedger } from "../data/schema"

export const arLedgerColumns: ColumnDef<ArLedger>[] = [
    buildIndexColumn(),

    {
        accessorKey: "doc_no",
        header: "Chứng từ",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[190px]">
                    <div className="font-semibold text-primary">
                        {item.doc_no || `#${item.id}`}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Hạch toán {formatDate(item.posting_date)}
                    </div>
                    {item.doc_date && item.doc_date !== item.posting_date && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            Ngày chứng từ {formatDate(item.doc_date)}
                        </div>
                    )}
                </div>
            )
        },
    },

    {
        id: "customer",
        header: "Khách hàng",
        cell: ({ row }) => {
            const customer = row.original.customer
            const name = customer?.name || row.original.customer_name || "-"
            const code = customer?.code

            return (
                <div className="min-w-[240px]">
                    <div className="font-medium">{name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {code || row.original.customer_id ? `Mã KH: ${code || `#${row.original.customer_id}`}` : "Chưa gắn khách hàng"}
                    </div>
                </div>
            )
        },
    },

    {
        accessorKey: "source_type",
        header: "Nghiệp vụ",
        cell: ({ row }) => {
            const meta = getSourceTypeMeta(row.original.source_type)

            return (
                <div className="min-w-[130px]">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {row.original.account_code && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            TK {row.original.account_code}
                        </div>
                    )}
                </div>
            )
        },
    },

    {
        accessorKey: "debit_amount",
        header: () => <div className="text-right">Phát sinh Nợ</div>,
        cell: ({ row }) => (
            <MoneyCell
                value={row.original.debit_amount}
                className="text-rose-600"
                emptyClassName="text-muted-foreground"
            />
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: ArLedger[]) => (
                <div className="text-right font-bold text-rose-600">
                    {formatCurrency(sumBy(rows, "debit_amount"))}
                </div>
            ),
        },
    },

    {
        accessorKey: "credit_amount",
        header: () => <div className="text-right">Phát sinh Có</div>,
        cell: ({ row }) => (
            <MoneyCell
                value={row.original.credit_amount}
                className="text-emerald-600"
                emptyClassName="text-muted-foreground"
            />
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: ArLedger[]) => (
                <div className="text-right font-bold text-emerald-600">
                    {formatCurrency(sumBy(rows, "credit_amount"))}
                </div>
            ),
        },
    },

    {
        id: "net",
        header: () => <div className="text-right">Chênh lệch</div>,
        cell: ({ row }) => {
            const net = Number(row.original.debit_amount || 0) - Number(row.original.credit_amount || 0)

            return (
                <div className={net >= 0 ? "text-right font-semibold text-amber-600" : "text-right font-semibold text-emerald-600"}>
                    {formatCurrency(Math.abs(net))}
                </div>
            )
        },
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: ArLedger[]) => {
                const net = sumBy(rows, "debit_amount") - sumBy(rows, "credit_amount")

                return (
                    <div className={net >= 0 ? "text-right font-bold text-amber-600" : "text-right font-bold text-emerald-600"}>
                        {formatCurrency(Math.abs(net))}
                    </div>
                )
            },
        },
    },

    {
        accessorKey: "description",
        header: "Diễn giải",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="max-w-[360px]">
                    <div className="line-clamp-2 text-sm">
                        {item.description || "-"}
                    </div>
                    {item.order_id ? (
                        <Link
                            to="/sales/orders/$id"
                            params={{ id: String(item.order_id) }}
                            className="mt-1 block text-xs font-medium text-primary hover:underline"
                        >
                            Đơn hàng #{item.order_id}
                        </Link>
                    ) : item.source_id ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                            Nguồn #{item.source_id}
                        </div>
                    ) : null}
                </div>
            )
        },
    },
]

export const AR_SOURCE_TYPES = [
    { value: "EXPORT", label: "Bán hàng" },
    { value: "RECEIPT", label: "Thu tiền" },
    { value: "BANK", label: "Ngân hàng" },
    { value: "RETURN", label: "Trả hàng" },
    { value: "ADJUST", label: "Điều chỉnh" },
    { value: "OPENING", label: "Nợ đầu kỳ" },
    { value: "IMPORT", label: "Import" },
] as const

export function getSourceTypeMeta(sourceType?: string) {
    switch (String(sourceType ?? "").toUpperCase()) {
        case "EXPORT":
            return { label: "Bán hàng", variant: "default" as const }
        case "RECEIPT":
            return { label: "Thu tiền", variant: "secondary" as const }
        case "BANK":
            return { label: "Ngân hàng", variant: "secondary" as const }
        case "RETURN":
            return { label: "Trả hàng", variant: "outline" as const }
        case "ADJUST":
            return { label: "Điều chỉnh", variant: "outline" as const }
        case "OPENING":
            return { label: "Nợ đầu kỳ", variant: "outline" as const }
        case "IMPORT":
            return { label: "Import", variant: "secondary" as const }
        default:
            return { label: sourceType || "-", variant: "outline" as const }
    }
}

function MoneyCell({
    value,
    className,
    emptyClassName,
}: {
    value?: number
    className: string
    emptyClassName: string
}) {
    const amount = Number(value || 0)

    if (!amount) {
        return <div className={`text-right ${emptyClassName}`}>-</div>
    }

    return (
        <div className={`text-right font-semibold ${className}`}>
            {formatCurrency(amount)}
        </div>
    )
}

function sumBy(rows: ArLedger[], field: "debit_amount" | "credit_amount") {
    return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0)
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}
