import { getDelivery } from "@/api/sale/delivery"
import {
    BaseDetailDialog,
    DetailInfoGrid,
    DetailInfoItem,
    DetailItemsTable,
    DetailSummary,
} from "@/components/base-detail-dialog"
import { deliveryStatusMeta } from "./delivery-status"

export function DeliveryDetailDialog({
    open,
    id,
    onClose,
}: {
    open: boolean
    id?: number
    onClose: () => void
}) {
    return (
        <BaseDetailDialog
            open={open}
            id={id}
            onClose={onClose}
            queryKey={["delivery-detail"]}
            queryFn={getDelivery}
            title="Chi tiết phiếu giao"
            description="Thông tin giao hàng và danh sách sản phẩm trên phiếu."
            render={(data) => (
                <div className="space-y-4">
                    <DetailSummary
                        title={data.delivery_no}
                        subtitle={data.order?.order_no ? `Đơn hàng ${data.order.order_no}` : undefined}
                        status={deliveryStatusMeta[data.status]?.label ?? data.status}
                    />

                    <DetailInfoGrid>
                        <DetailInfoItem label="Đơn hàng" value={data.order?.order_no} />
                        <DetailInfoItem label="Kho" value={data.warehouse?.name} />
                        <DetailInfoItem label="Công ty" value={data.company?.name} />
                        <DetailInfoItem label="Ngày giao" value={data.delivery_date} />
                        <DetailInfoItem label="Địa chỉ" value={data.delivery_address} className="lg:col-span-2" />
                        <DetailInfoItem label="Ghi chú" value={data.note} className="lg:col-span-3" />
                    </DetailInfoGrid>

                    <DetailItemsTable items={data.items} />
                </div>
            )}
        />
    )
}
