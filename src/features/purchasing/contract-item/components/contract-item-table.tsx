import { CrudTable } from "@/components/crud/crud-table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { contractItemColumns } from "./contract-item-columns"
import { ContractItem } from "../data/schema"

export function ContractItemTable(props: any) {
    const data = (props.data ?? []) as ContractItem[]
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    const totalAmount = data.reduce((sum, item) => sum + getTotalAmount(item), 0)
    const totalAmountVnd = data.reduce((sum, item) => sum + getTotalAmountVnd(item), 0)

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
                <Summary label="Số dòng hàng" value={formatNumber(data.length)} />
                <Summary label="Tổng SL hợp đồng" value={formatNumber(totalQuantity)} />
                <Summary label="Tổng tiền" value={formatCurrency(totalAmount)} />
                <Summary label="Tổng VNĐ" value={formatCurrency(totalAmountVnd)} />
            </div>

            <CrudTable<ContractItem>
                {...props}
                columns={contractItemColumns}
                entityName="hàng hóa"
                searchPlaceholder="Tìm theo mã hoặc tên hàng..."
            />
        </div>
    )
}

function getTotalAmount(item: ContractItem) {
    const quantity = item.quantity ?? 0
    const inputPrice = item.input_price ?? item.price_before_tax

    if (inputPrice != null && inputPrice > 0) {
        return quantity * inputPrice
    }

    if (item.total_amount != null) return item.total_amount

    const unitPrice = Math.max((item.unit_price ?? 0) - (item.discount_amount ?? 0), 0)

    return quantity * unitPrice
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

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-5 py-4">
            <div className="text-base font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
    )
}
