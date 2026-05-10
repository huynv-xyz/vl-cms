import { useQuery } from "@tanstack/react-query"
import { getOrder } from "@/api/sale/order"
import { OrderDeliveries } from "./components/order-deliveries"
import { OrderExports } from "./components/order-export"
import { OrderItems } from "./components/order-items"
import { OrderReturns } from "./components/order-returns"
import { OrderInfo } from "./components/order-info"

type Props = { id: number }

export default function OrderDetailPage({ id }: Props) {
    const { data, isLoading } = useQuery({
        queryKey: ["order-detail", id],
        queryFn: () => getOrder(id),
    })

    if (isLoading) return <div className="p-6">Đang tải...</div>
    if (!data) return <div className="p-6">Không có dữ liệu</div>

    const isEditable = data.status === "CONFIRMED"

    return (
        <div className="mx-auto max-w-7xl p-6 space-y-6">
            <OrderInfo order={data} />

            <OrderItems
                order={data}
                items={data.items || []}
                disabled={!isEditable}
            />

            <OrderDeliveries
                order={data}
                deliveries={data.deliveries || []}
                disabled={!isEditable}
            />

            <OrderExports
                exports={data.exports || []}
                disabled={!isEditable}
            />

            <OrderReturns
                order={data}
                returns={data.returns || []}
                disabled={!isEditable}
            />
        </div>
    )
}