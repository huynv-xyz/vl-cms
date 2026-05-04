import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getOrder } from "@/api/sale/order"
import { Button } from "@/components/ui/button"

import { OrderHeader } from "./components/order-header"
import { OrderCustomer } from "./components/order-customer"
import { OrderSummary } from "./components/order-summary"
import { OrderDeliveries } from "./components/order-deliveries"
import { OrderExports } from "./components/order-export"
import { OrderItems } from "./components/order-items"
import { OrderReceipts } from "./components/order-receipts"
import { UpdateOrderDialog } from "../order/components/update-order-dialog"
import { CreateDeliveryDialog } from "../delivery/components/create-delivery-dialog"
import { CreateReceiptDialog } from "../receipt/components/create-receipt-dialog"

type Props = { id: number }

export default function OrderDetailPage({ id }: Props) {
    const { data, isLoading } = useQuery({
        queryKey: ["order-detail", id],
        queryFn: () => getOrder(id),
    })

    if (isLoading) return <div className="p-6">Đang tải...</div>
    if (!data) return <div className="p-6">Không có dữ liệu</div>

    return (
        <div className="mx-auto max-w-7xl p-6 space-y-6">
            <OrderHeader order={data} />
            <OrderCustomer order={data} />
            <OrderItems items={data.items || []} />
            <OrderSummary order={data} ar={data.ar_summary} />

            <OrderDeliveries order={data} deliveries={data.deliveries || []} />
            <OrderExports exports={data.exports || []} />
            <OrderReceipts order={data} receipts={data.receipts || []} />
        </div>
    )
}