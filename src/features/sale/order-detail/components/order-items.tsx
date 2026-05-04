import { formatCurrency } from "@/lib/utils"

export function OrderItems({ items }: any) {
    if (!items?.length) {
        return <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
    }

    return (
        <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Danh sách hàng</h2>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left">
                        <th className="py-2">Sản phẩm</th>
                        <th>SL</th>
                        <th>Đã xuất</th>
                        <th>Còn</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((i: any) => (
                        <tr key={i.product_id} className="border-b">
                            <td className="py-2">{i.product?.name}</td>
                            <td>{i.quantity}</td>
                            <td>{i.exported_quantity}</td>
                            <td className="text-orange-500 font-medium">
                                {i.remain_quantity}
                            </td>
                            <td>{formatCurrency(i.unit_price)}</td>
                            <td className="font-medium">
                                {formatCurrency(i.line_total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}