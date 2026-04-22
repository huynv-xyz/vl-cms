import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function OrderExports({ exports }) {
    return (
        <Card>

            <CardHeader className="bg-gray-50 border-b px-5 py-3">
                <CardTitle className="text-sm">Phiếu xuất kho</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

                {exports.map(e => (
                    <div key={e.id} className="border rounded p-3">

                        <div className="flex justify-between text-sm font-medium">
                            <span>{e.export_no}</span>
                            <span>{e.status}</span>
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                            {e.items.map(i => (
                                <div key={i.product_id}>
                                    {i.product?.name} - {i.quantity}
                                </div>
                            ))}
                        </div>

                    </div>
                ))}

            </CardContent>

        </Card>
    )
}