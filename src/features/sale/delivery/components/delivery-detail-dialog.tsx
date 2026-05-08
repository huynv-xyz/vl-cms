import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getDelivery } from "@/api/sale/delivery"

export function DeliveryDetailDialog({
    open,
    id,
    onClose,
}: {
    open: boolean
    id?: number
    onClose: () => void
}) {

    const query: any = useQuery({
        queryKey: ["delivery-detail", id],
        queryFn: () => getDelivery(id!),
        enabled: open && !!id,
    })

    const data = query.data?.data ?? query.data

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!max-w-3xl w-full">
                <DialogHeader>
                    <DialogTitle>
                        Chi tiết phiếu giao
                    </DialogTitle>
                </DialogHeader>

                {query.isLoading && (
                    <div className="text-sm text-muted-foreground">
                        Đang tải...
                    </div>
                )}

                {data && (
                    <div className="space-y-3 text-sm">

                        <div>
                            <b>Mã giao:</b> {data.delivery_no}
                        </div>

                        <div>
                            <b>Đơn hàng:</b> {data.order?.order_no}
                        </div>

                        <div>
                            <b>Kho:</b> {data.warehouse?.name}
                        </div>

                        <div>
                            <b>Ngày giao:</b> {data.delivery_date}
                        </div>

                        <div>
                            <b>Địa chỉ:</b> {data.delivery_address}
                        </div>

                        <div>
                            <b>Trạn thái:</b> {data.status}
                        </div>

                        {/* ITEMS */}
                        <table className="w-full mt-3 text-sm border">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left">Mã sản phẩm</th>
                                    <th className="p-2 text-left">Tên sản phẩm</th>
                                    <th className="p-2 text-left">ĐVT</th>
                                    <th className="p-2 text-left">SL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items?.map((i: any) => (
                                    <tr key={i.id} className="border-t">
                                        <td className="p-2">
                                            {i.product?.code}
                                        </td>
                                        <td className="p-2">
                                            {i.product?.name}
                                        </td>
                                        <td className="p-2">
                                            {i.product?.unit}
                                        </td>
                                        <td className="p-2">
                                            {i.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}