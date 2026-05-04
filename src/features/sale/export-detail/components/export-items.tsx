import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function ExportItems({ items }: any) {

    const total = items.reduce(
        (sum: number, i: any) => sum + Number(i.quantity ?? 0),
        0
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách hàng xuất</CardTitle>
            </CardHeader>

            <CardContent className="p-0">

                <table className="w-full text-sm">

                    <thead className="bg-muted border-b">
                        <tr>
                            <th className="p-3 text-left w-[60px]">#</th>
                            <th className="p-3 text-left w-[60px]">Mã sản phẩm</th>
                            <th className="p-3 text-left">Tên sản phẩm</th>
                            <th className="p-3 text-center w-[120px]">ĐVT</th>
                            <th className="p-3 text-right w-[120px]">Số lượng</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((i: any, idx: number) => (
                            <tr key={i.id} className="border-b">
                                <td className="p-3">{idx + 1}</td>

                                <td className="p-3 font-medium">
                                    {i.product?.code}
                                </td>

                                <td className="p-3 font-medium">
                                    {i.product?.name}
                                </td>

                                <td className="p-3 text-center">
                                    {i.product?.unit}
                                </td>

                                <td className="p-3 text-right font-semibold">
                                    {i.quantity}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot>
                        <tr className="bg-muted font-semibold">
                            <td colSpan={4} className="p-3 text-right">

                            </td>
                            <td className="p-3 text-right">
                                {total}
                            </td>
                        </tr>
                    </tfoot>

                </table>

            </CardContent>
        </Card>
    )
}