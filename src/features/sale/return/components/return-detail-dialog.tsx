import { getReturn } from "@/api/sale/return"
import {
    BaseDetailDialog,
    DetailInfoGrid,
    DetailInfoItem,
    DetailItemsTable,
    DetailSummary,
} from "@/components/base-detail-dialog"
import { returnStatusLabel } from "./return-status"

export function ReturnDetailDialog({ open, id, onClose }: any) {
    return (
        <BaseDetailDialog
            open={open}
            id={id}
            onClose={onClose}
            queryKey={["return-detail"]}
            queryFn={getReturn}
            title="Chi tiết phiếu trả"
            description="Thông tin trả hàng và danh sách sản phẩm trả về."
            render={(data) => (
                <div className="space-y-4">
                    <DetailSummary
                        title={data.return_no}
                        subtitle={data.order?.order_no ? `Đơn hàng ${data.order.order_no}` : undefined}
                        status={returnStatusLabel(data.status)}
                    />

                    <DetailInfoGrid>
                        <DetailInfoItem label="Đơn hàng" value={data.order?.order_no || data.order_id} />
                        <DetailInfoItem label="Phiếu xuất" value={data.export?.export_no || data.export_id} />
                        <DetailInfoItem label="Lý do" value={data.reason} />
                        <DetailInfoItem label="Ghi chú" value={data.note} className="lg:col-span-3" />
                    </DetailInfoGrid>

                    <DetailItemsTable items={data.items} />
                </div>
            )}
        />
    )
}
