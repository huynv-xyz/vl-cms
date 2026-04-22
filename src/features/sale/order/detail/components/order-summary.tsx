import { Card, CardContent } from "@/components/ui/card"

export function OrderSummary({ order, ar }) {
    return (
        <div className="grid grid-cols-3 gap-4">

            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-gray-400">Tổng tiền</div>
                    <div className="text-lg font-semibold">
                        {Number(order.total_amount).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-gray-400">Đã thu</div>
                    <div className="text-lg text-green-600 font-semibold">
                        {Number(ar?.paid || 0).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="text-xs text-gray-400">Còn lại</div>
                    <div className="text-lg text-red-500 font-semibold">
                        {Number(ar?.remain || 0).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}