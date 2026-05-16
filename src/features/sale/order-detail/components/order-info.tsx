import { formatCurrency } from "@/lib/utils"
import { updateOrderStatus } from "@/api/sale/order"
import { InlineStatus } from "@/components/inline-status"
import { Badge } from "@/components/ui/badge"
import { getOrderStatusMeta, ORDER_STATUSES } from "../../order/components/order-status"
import { CalendarDays, Clock, UserRound, UsersRound } from "lucide-react"

export function OrderInfo({ order }: any) {
    const statusMeta = getOrderStatusMeta(order.status)

    return (
        <div className="rounded-md border bg-background">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-bold">
                            {order.order_no}
                        </h2>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Ngày đặt {formatDate(order.order_date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Tạo lúc {formatDateTime(order.created_at)}
                        </span>
                    </div>
                </div>

                <div className="min-w-[160px]">
                    <InlineStatus
                        row={order}
                        value={order.status}
                        options={[...ORDER_STATUSES]}
                        queryKey={["order-detail", order.id]}
                        mutationFn={updateOrderStatus}
                        getId={(x) => x.id}
                    />
                </div>
            </div>

            <div className="grid gap-3 px-5 py-4 md:grid-cols-4">
                <Info
                    icon={<UsersRound className="h-4 w-4" />}
                    label="Khách hàng"
                    value={order.customer?.name ?? "-"}
                />
                <Info
                    icon={<UserRound className="h-4 w-4" />}
                    label="Nhân viên bán"
                    value={order.employee?.name ?? "-"}
                />
                <Info
                    label="Tổng tiền"
                    value={<span className="text-base font-bold">{formatCurrency(order.total_amount || 0)}</span>}
                />
                <Info label="Ghi chú" value={order.note || "-"} />
            </div>
        </div>
    )
}

function Info({ icon, label, value }: any) {
    return (
        <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-1 min-h-5 font-semibold">{value}</div>
        </div>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3) {
        return parts[0].length === 4
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return date
}

function formatDateTime(value?: string) {
    if (!value) return "-"
    return value.replace("T", " ").slice(0, 16)
}
