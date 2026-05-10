import { getReturn } from "@/api/sale/return"
import { BaseDetailDialog } from "@/components/base-detail-dialog"

export function ReturnDetailDialog({ open, id, onClose }: any) {
    return (
        <BaseDetailDialog
            open={open}
            id={id}
            onClose={onClose}
            queryKey={["return-detail"]}
            queryFn={getReturn}
            title="Chi tiết phiếu trả"
            render={(data) => (
                <div className="space-y-3 text-sm">

                    <div><b>Mã trả:</b> {data.return_no}</div>
                    <div><b>Lý do:</b> {data.reason}</div>
                    <div><b>Trạng thái:</b> {data.status}</div>

                    <table className="w-full mt-3 text-sm border">
                        <thead>
                            <tr>
                                <th className="p-2 text-left">Mã SP</th>
                                <th className="p-2 text-left">Tên SP</th>
                                <th className="p-2 text-left">ĐVT</th>
                                <th className="p-2 text-right">SL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items?.map((i: any) => (
                                <tr key={i.id} className="border-t">
                                    <td className="p-2">{i.product?.code}</td>
                                    <td className="p-2">{i.product?.name}</td>
                                    <td className="p-2">{i.product?.unit}</td>
                                    <td className="p-2 text-right">{i.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}
        />
    )
}