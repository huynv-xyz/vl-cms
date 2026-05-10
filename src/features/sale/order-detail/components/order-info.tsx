import { formatCurrency } from "@/lib/utils"
import { updateOrderStatus } from "@/api/sale/order"
import { InlineStatus } from "@/components/inline-status"

export function OrderInfo({ order }: any) {
    const statusOptions = [
        { value: "NEW", label: "Mới" },
        { value: "CONFIRMED", label: "Xác nhận" },
        { value: "DONE", label: "Hoàn thành" },
        { value: "CANCELLED", label: "Huỷ" },
    ]
    return (
        <div className="rounded-xl border bg-white p-5 shadow-sm">

            {/* GRID 2 ROW */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">

                <Info label="Mã đơn" value={
                    <span className="text-primary font-semibold text-lg">
                        {order.order_no}
                    </span>
                } />

                <Info label="Ngày" value={order.order_date} />

                <Info
                    label="Trạng thái"
                    value={
                        <InlineStatus
                            row={order}
                            value={order.status}
                            options={statusOptions}
                            queryKey={["order-detail", order.id]}
                            mutationFn={updateOrderStatus}
                            getId={(x) => x.id}
                        />
                    }
                />

                <Info label="Khách hàng" value={
                    <div className="line-clamp-2">
                        {order.customer?.name ?? "-"}
                    </div>
                } />

                <Info label="Sales" value={order.employee?.name ?? "-"} />

                <Info label="Tổng tiền" value={
                    <span className="text-xl font-bold text-primary">
                        {formatCurrency(order.total_amount)}
                    </span>
                } />

            </div>

        </div>
    )
}

function Info({ label, value }: any) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    )
}