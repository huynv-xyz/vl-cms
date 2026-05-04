export function OrderExports({ exports }: any) {
    if (!exports?.length) {
        return <div className="text-sm text-muted-foreground">Chưa có xuất kho</div>
    }

    return (
        <div className="border rounded-lg p-4 space-y-4">
            <h2 className="font-semibold">Xuất kho</h2>

            {exports.map((e: any) => (
                <div key={e.id} className="border rounded-md">

                    <div className="bg-gray-50 px-4 py-2 flex justify-between text-sm">

                        <div className="flex gap-6 items-center">
                            <span className="font-medium">{e.export_no}</span>

                            <span className="text-gray-500">
                                {e.export_date}
                            </span>

                            <span className="text-gray-500">
                                {e.warehouse?.name}
                            </span>
                        </div>

                        <span className="font-medium">
                            {e.status}
                        </span>

                    </div>

                    {/* ITEMS */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-t border-b text-left bg-gray-50">
                                <th className="py-2 px-4">Sản phẩm</th>
                                <th>SL</th>
                            </tr>
                        </thead>

                        <tbody>
                            {e.items?.map((i: any) => (
                                <tr key={i.product_id} className="border-b">
                                    <td className="py-2 px-4">
                                        {i.product?.name}
                                    </td>
                                    <td>{i.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            ))}

        </div>
    )
}