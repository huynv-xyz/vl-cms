import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import type { ContractItem } from "../data/schema"
import { ContractItemRowActions } from "./contract-item-row-actions"

export const contractItemColumns: ColumnDef<ContractItem>[] = [
    buildIndexColumn(),
    {
        id: "product",
        header: "Hàng hóa",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[280px] space-y-1 text-base">
                    <div className="font-semibold">{item.product?.code ?? "-"}</div>
                    <div className="max-w-[420px] truncate text-base text-muted-foreground">
                        {item.product?.name ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        ĐVT: {item.product?.unit ?? "-"}
                    </div>
                </div>
            )
        },
    },
    quantityColumn("quantity", "SL hợp đồng", (item) => item.quantity, "font-semibold"),
    quantityColumn("shipped_quantity", "Đã đi", (item) => item.shipped_quantity),
    quantityColumn(
        "remaining_quantity",
        "Còn lại",
        (item) => item.remaining_quantity ?? Math.max((item.quantity ?? 0) - (item.shipped_quantity ?? 0), 0),
        "font-semibold text-amber-700"
    ),
    {
        id: "price",
        header: "Đơn giá",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[170px] space-y-1 text-base">
                    <MoneyLine label="Gốc" value={item.unit_price} />
                    <MoneyLine label="CK" value={item.discount_amount} />
                    <MoneyLine label="Sau CK" value={item.base_price ?? calcBasePrice(item)} strong />
                </div>
            )
        },
    },
    {
        id: "cost",
        header: "Chi phí",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[160px] space-y-1 text-base">
                    <MoneyLine label="Bao bì" value={item.packaging_price} />
                    <MoneyLine label="Vận chuyển" value={item.freight_price} />
                    <MoneyLine label="Làm hàng" value={item.handling_fee} />
                    <div className="flex gap-1 pt-1">
                        <Badge variant="outline" className="text-sm">
                            NK {formatNumber(item.import_tax_rate ?? 0)}%
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                            VAT {formatNumber(item.vat_rate ?? 0)}%
                        </Badge>
                    </div>
                </div>
            )
        },
    },
    {
        id: "amount",
        header: "Thành tiền",
        cell: ({ row }) => {
            const item = row.original
            const totalAmount = getTotalAmount(item)
            const totalAmountVnd = getTotalAmountVnd(item)

            return (
                <div className="min-w-[170px] text-right text-base">
                    <div className="font-semibold">{formatCurrency(totalAmount)}</div>
                    <div className="text-sm text-muted-foreground">
                        Đầu vào ngoại tệ/ĐV: {formatCurrency(item.input_price ?? item.price_before_tax ?? 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Đầu vào VNĐ/ĐV: {formatCurrency(item.input_price_vnd ?? item.price_before_tax_vnd ?? 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        TG {formatNumber(item.exchange_rate ?? 1)}
                    </div>
                    <div className="pt-1 text-sm font-medium text-muted-foreground">
                        VNĐ {formatCurrency(totalAmountVnd)}
                    </div>
                </div>
            )
        },
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    },
    buildActionsColumn({
        renderActions: (_, row) => <ContractItemRowActions row={row} />,
    }),
]

function quantityColumn(
    id: string,
    header: string,
    getValue: (item: ContractItem) => number | undefined,
    className = "font-medium"
): ColumnDef<ContractItem> {
    return {
        id,
        header,
        cell: ({ row }) => (
            <div className={`min-w-[110px] text-right text-base tabular-nums ${className}`}>
                {formatNumber(getValue(row.original) ?? 0)}
                <div className="text-xs font-normal text-muted-foreground">
                    {row.original.product?.unit ?? ""}
                </div>
            </div>
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    }
}

function MoneyLine({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className={strong ? "font-semibold" : "font-medium"}>{formatCurrency(value ?? 0)}</span>
        </div>
    )
}

function calcBasePrice(item: ContractItem) {
    return Math.max((item.unit_price ?? 0) - (item.discount_amount ?? 0), 0)
}

function calcTotal(item: ContractItem) {
    const quantity = item.quantity ?? 0
    const price = item.input_price ?? item.price_before_tax ?? calcBasePrice(item)
    return quantity * price
}

function getTotalAmount(item: ContractItem) {
    return item.total_amount ?? calcTotal(item)
}

function getTotalAmountVnd(item: ContractItem) {
    if (item.total_amount_vnd != null && item.total_amount_vnd > 0) {
        return item.total_amount_vnd
    }

    const quantity = item.quantity ?? 0
    const inputPriceVnd = item.input_price_vnd ?? item.price_before_tax_vnd

    if (inputPriceVnd != null && inputPriceVnd > 0) {
        return quantity * inputPriceVnd
    }

    return getTotalAmount(item) * (item.exchange_rate ?? 1)
}
