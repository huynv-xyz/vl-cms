import { useState } from "react"
import { ExportDetailDialog } from "../../export/components/export-detail-dialog"

export function OrderExports({ exports }: any) {
    const [selectedId, setSelectedId] = useState<number | null>(null)

    if (!exports?.length) {
        return (
            <div className="text-sm text-muted-foreground">
                Chưa có xuất kho
            </div>
        )
    }



    return (
        <>
            <div className="border rounded-lg overflow-hidden">

                {/* HEADER */}
                <div className="px-4 py-3 border-b bg-white">
                    <h2 className="font-semibold">Xuất kho</h2>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-muted text-xs uppercase">
                        <tr>
                            <th className="w-[70px] text-center">#</th>
                            <th className="p-2 text-left">Mã xuất</th>
                            <th className="p-2 text-left">Ngày</th>
                            <th className="p-2 text-left">Kho</th>
                            <th className="p-2 text-left">Trạng thái</th>
                        </tr>
                    </thead>

                    <tbody>
                        {exports.map((e: any, idx: number) => (
                            <>
                                {/* HEADER ROW */}
                                <tr key={e.id} className="border-t bg-muted/20">

                                    {/* STT BIG */}
                                    <td className="text-center align-top">
                                        <div className="flex flex-col items-center justify-center py-3">
                                            <span className="text-2xl font-bold text-primary">
                                                #{idx + 1}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-2 font-medium">
                                        <span
                                            className="text-primary cursor-pointer hover:underline"
                                            onClick={() => setSelectedId(e.id)}
                                        >
                                            {e.export_no}
                                        </span>
                                    </td>

                                    <td className="p-2 text-muted-foreground">
                                        {e.export_date}
                                    </td>

                                    <td className="p-2 text-muted-foreground">
                                        {e.warehouse?.name ?? "-"}
                                    </td>

                                    <td className="p-2 font-medium">
                                        {e.status}
                                    </td>
                                </tr>

                                {/* ITEMS */}
                                <tr>
                                    <td /> {/* empty cho align STT */}
                                    <td colSpan={4}>
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/30">
                                                <tr>
                                                    <th className="p-2 text-left">Mã sản phẩm</th>
                                                    <th className="p-2 text-left">Tên sản phẩm</th>
                                                    <th className="p-2 w-[120px] text-right">SL</th>
                                                    <th className="p-2 w-[120px] text-right">ĐVT</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {e.items?.map((i: any) => (
                                                    <tr key={i.product_id} className="border-t">
                                                        <td className="p-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                {i.product?.code ?? ""}
                                                            </div>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                {i.product?.code ?? ""}
                                                            </div>
                                                        </td>

                                                        <td className="p-2 text-right font-medium">
                                                            {i.quantity}
                                                        </td>
                                                        <td className="p-2 text-right text-muted-foreground">
                                                            {i.product?.unit}
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
            <ExportDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        </>
    )
}