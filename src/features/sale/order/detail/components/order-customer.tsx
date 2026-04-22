import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function OrderCustomer({ order }) {
    return (
        <Card>

            <CardHeader className="bg-gray-50 border-b px-5 py-3">
                <CardTitle className="text-sm">Thông tin khách hàng</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-4 text-sm">

                <div>
                    <div className="text-gray-400">Khách hàng</div>
                    <div className="font-medium">{order.customer?.name}</div>
                </div>

                <div>
                    <div className="text-gray-400">Nhân viên</div>
                    <div className="font-medium">{order.employee?.name}</div>
                </div>

            </CardContent>

        </Card>
    )
}