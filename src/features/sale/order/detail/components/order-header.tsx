import { Card, CardHeader } from "@/components/ui/card"

export function OrderHeader({ order }) {
    return (
        <Card>
            <CardHeader className="bg-gray-50 border-b px-5 py-3 flex justify-between">

                <div>
                    <div className="text-base font-semibold text-gray-900">
                        {order.order_no}
                    </div>
                    <div className="text-xs text-gray-500">
                        {order.order_date}
                    </div>
                </div>

                <span className="px-2 py-1 text-xs rounded bg-gray-100">
                    {order.status}
                </span>

            </CardHeader>
        </Card>
    )
}