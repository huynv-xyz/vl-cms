import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import type { Contract } from "../data/schema"
import { ContractRowActions } from "./contract-row-actions"

export const contractColumns: ColumnDef<Contract>[] = [
    buildIndexColumn(),
    {
        id: "contract",
        header: "Hợp đồng",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[220px] space-y-1">
                    <Link
                        to="/purchasing/contracts/$id"
                        params={{ id: String(item.id) }}
                        className="font-semibold text-primary hover:underline"
                    >
                        {item.code || `#${item.id}`}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                        Ngày ký {item.signed_date}
                    </div>
                </div>
            )
        },
    },
    {
        id: "supplier",
        header: "Nhà cung cấp",
        cell: ({ row }) => {
            const supplier = row.original.supplier

            return (
                <div className="min-w-[240px] space-y-1">
                    <div className="font-medium">{supplier?.name ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">
                        {supplier?.code ? `${supplier.code} · ` : ""}
                        {supplier?.nation?.name ?? "Chưa có quốc gia"}
                    </div>
                </div>
            )
        },
    },
    {
        id: "products",
        header: "Sản phẩm",
        cell: ({ row }) => {
            const items = ((row.original as any).items ?? []) as any[]
            const preview = items.slice(0, 2)

            if (!preview.length) {
                return (
                    <div className="min-w-[240px] text-sm text-muted-foreground">
                        Chưa có sản phẩm
                    </div>
                )
            }

            return (
                <div className="min-w-[280px] max-w-[360px] space-y-1">
                    {preview.map((item) => (
                        <div key={item.id ?? item.product_id} className="truncate text-sm">
                            <span className="font-medium">{item.product?.code ?? "-"}</span>
                            <span className="text-muted-foreground">
                                {" - "}
                                {item.product?.name ?? "-"}
                            </span>
                        </div>
                    ))}
                    {items.length > preview.length ? (
                        <div className="text-xs text-muted-foreground">
                            +{items.length - preview.length} sản phẩm khác, xem trong chi tiết HĐ
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            Xem đủ trong chi tiết HĐ
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        id: "terms",
        header: "Điều kiện",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[190px] space-y-1 text-sm">
                    <div>
                        <span className="text-muted-foreground">TT: </span>
                        <span className="font-medium">{formatPaymentMethod(item.payment_method)}</span>
                    </div>
                    <div className="text-muted-foreground">
                        Term {item.term || "-"} · Cọc {formatNumber(item.deposit_rate ?? 0)}%
                    </div>
                </div>
            )
        },
    },
    {
        id: "quantity",
        header: "Số lượng",
        cell: ({ row }) => (
            <div className="text-sm">
                <div className="font-semibold">{formatNumber(row.original.total_quantity ?? 0)}</div>
                <div className="text-xs text-muted-foreground">SL hợp đồng</div>
            </div>
        ),
    },
    {
        id: "amount",
        header: "Giá trị",
        cell: ({ row }) => {
            const item = row.original
            const totalAmount = item.total_amount ?? 0
            const exchangeRate = item.exchange_rate ?? item.currency?.exchange_rate ?? 1
            const totalAmountVnd =
                item.total_amount_vnd != null && item.total_amount_vnd > 0
                    ? item.total_amount_vnd
                    : totalAmount * exchangeRate

            return (
                <div className="min-w-[150px] space-y-1 text-right">
                    <div className="font-semibold">{formatCurrency(totalAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.currency?.code ?? "-"} · TG {formatNumber(exchangeRate)}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        VNĐ {formatCurrency(totalAmountVnd)}
                    </div>
                </div>
            )
        },
        meta: {
            thClassName: "text-right",
        },
    },
    {
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    buildActionsColumn({
        renderActions: (_, row) => <ContractRowActions row={row} />,
    }),
]

function StatusBadge({ status }: { status?: string }) {
    const label = formatStatus(status)
    const className =
        status === "DONE"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "SIGNED"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : status === "CANCELLED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    )
}

function formatStatus(status?: string) {
    switch (status) {
        case "DRAFT":
            return "Nháp"
        case "SIGNED":
            return "Đã ký"
        case "DONE":
            return "Hoàn tất"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "-"
    }
}

function formatPaymentMethod(method?: string) {
    switch (method) {
        case "TT":
            return "TT"
        case "LC_IMMEDIATE":
            return "LC trả ngay"
        case "LC_60_BL":
            return "LC 60 ngày BL"
        case "DA":
            return "D/A"
        case "DP":
            return "D/P"
        default:
            return method || "-"
    }
}
