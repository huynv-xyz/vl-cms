import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getExport } from "@/api/sale/export"

export function ExportDetailDialog({
    open,
    id,
    onClose,
}: {
    open: boolean
    id?: number
    onClose: () => void
}) {
    const query: any = useQuery({
        queryKey: ["export-detail", id],
        queryFn: () => getExport(id!),
        enabled: open && !!id,
    })

    const data = query.data?.data ?? query.data

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!max-w-3xl w-full">
                <DialogHeader>
                    <DialogTitle>Chi tiết phiếu xuất</DialogTitle>
                </DialogHeader>

                {query.isLoading && (
                    <div className="text-sm text-muted-foreground">
                        Đang tải...
                    </div>
                )}

                {data && (
                    <div className="space-y-3 text-sm">

                        <div><b>Mã xuất:</b> {data.export_no}</div>
                        <div><b>Kho:</b> {data.warehouse?.name}</div>
                        <div><b>Ngày:</b> {data.export_date}</div>
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
            </DialogContent>
        </Dialog>
    )
}