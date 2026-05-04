import { formatCurrency } from "@/lib/utils"

export function OrderSummary({ order, ar }: any) {
    return (
        <div className="grid grid-cols-3 gap-4">

            <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground">Tổng tiền</div>
                <div className="text-lg font-semibold">
                    {formatCurrency(order.total_amount)}
                </div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground">Đã thu</div>
                <div className="text-lg text-green-600 font-semibold">
                    {formatCurrency(ar?.paid || 0)}
                </div>
            </div>

            <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground">Còn lại</div>
                <div className="text-lg text-red-500 font-semibold">
                    {formatCurrency(ar?.remain || 0)}
                </div>
            </div>

        </div>
    )
}