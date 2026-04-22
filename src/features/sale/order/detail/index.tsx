import { getOrder } from "@/api/sale/order"
import { useQuery } from "@tanstack/react-query"

import { OrderHeader } from "./components/order-header"
import { OrderCustomer } from "./components/order-customer"
import { OrderSummary } from "./components/order-summary"
import { OrderDeliveries } from "./components/order-deliveries"
import { OrderExports } from "./components/order-export"
import { OrderItems } from "./components/order-items"

type Props = { id: number }

export default function OrderDetailPage({ id }: Props) {

    const { data, isLoading } = useQuery({
        queryKey: ["order-detail", id],
        queryFn: () => getOrder(id),
    })

    if (isLoading) return <div className="p-4">Loading...</div>
    if (!data) return <div className="p-4">No data</div>

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-4">

            <OrderHeader order={data} />

            <OrderCustomer order={data} />

            <OrderItems items={data.items} />

            <OrderSummary order={data} ar={data.ar_summary} />

            <OrderDeliveries deliveries={data.deliveries} />

            <OrderExports exports={data.exports} />

        </div>
    )
}