import { CrudTable } from "@/components/crud/crud-table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { paymentColumns } from "./payment-columns"
import { Payment } from "../data/schema"

export function PaymentTable(props: any) {
    const data = (props.data ?? []) as Payment[]
    const totalAmount = data.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const totalVnd = data.reduce(
        (sum, item) => sum + (item.amount ?? 0) * (item.exchange_rate ?? 1),
        0
    )

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
                <Summary label="Số lần thanh toán" value={formatNumber(data.length)} />
                <Summary label="Tổng nguyên tệ" value={formatCurrency(totalAmount)} />
                <Summary label="Tổng quy đổi" value={formatCurrency(totalVnd)} />
            </div>

            <CrudTable<Payment>
                {...props}
                columns={paymentColumns}
                entityName="thanh toán"
                searchPlaceholder="Tìm theo mã lô hoặc ghi chú..."
            />
        </div>
    )
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-5 py-4">
            <div className="text-base font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
    )
}
