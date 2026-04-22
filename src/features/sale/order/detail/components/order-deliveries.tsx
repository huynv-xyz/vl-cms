import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function OrderDeliveries({ deliveries }) {
    return (
        <Card>

            <CardHeader className="bg-gray-50 border-b px-5 py-3">
                <CardTitle className="text-sm">Lịch giao hàng</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

                {deliveries.map(d => (
                    <div key={d.id} className="border rounded p-3 bg-gray-50">

                        <div className="flex justify-between text-sm font-medium">
                            <span>{d.delivery_no}</span>
                            <span>{d.status}</span>
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                            {d.items?.map(i => (
                                <div key={i.product_id}>
                                    {i.product_name} - {i.quantity}
                                </div>
                            ))}
                        </div>

                    </div>
                ))}

            </CardContent>

        </Card>
    )
}