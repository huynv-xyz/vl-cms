import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function OrderItems({ items }) {
    return (
        <Card>

            <CardHeader className="bg-gray-50 border-b px-5 py-3">
                <CardTitle className="text-sm">Danh sách hàng hóa</CardTitle>
            </CardHeader>

            <CardContent>

                <table className="w-full text-sm">

                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-2 text-left">Sản phẩm</th>
                            <th className="p-2 text-right">SL</th>
                            <th className="p-2 text-right">Đã xuất</th>
                            <th className="p-2 text-right">Còn</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map(i => (
                            <tr key={i.product_id} className="border-t">

                                <td className="p-2">
                                    {i.product?.name}
                                </td>

                                <td className="p-2 text-right">
                                    {i.quantity}
                                </td>

                                <td className="p-2 text-right">
                                    {i.exported_quantity}
                                </td>

                                <td className="p-2 text-right font-semibold text-orange-500">
                                    {i.remain_quantity}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>

            </CardContent>

        </Card>
    )
}