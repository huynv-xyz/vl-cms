import { getExport } from "@/api/sale/export"
import {
    BaseDetailDialog,
    DetailInfoGrid,
    DetailInfoItem,
    DetailItemsTable,
    DetailSummary,
} from "@/components/base-detail-dialog"
import { exportStatusLabel } from "./export-status"

export function ExportDetailDialog({
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
            queryKey={["export-detail"]}
            queryFn={getExport}
            title="Chi tiết phiếu xuất"
            description="Thông tin xuất kho và danh sách sản phẩm cần xuất."
            render={(data) => (
                <div className="space-y-4">
                    <DetailSummary
                        title={data.export_no}
                        subtitle={data.order?.order_no ? `Đơn hàng ${data.order.order_no}` : undefined}
                        status={exportStatusLabel(data.status)}
                    />

                    <DetailInfoGrid>
                        <DetailInfoItem label="Đơn hàng" value={data.order?.order_no || data.order_id} />
                        <DetailInfoItem label="Phiếu giao" value={data.delivery?.delivery_no || data.delivery_id} />
                        <DetailInfoItem label="Kho xuất" value={data.warehouse?.name} />
                        <DetailInfoItem label="Ngày xuất" value={data.export_date} />
                        <DetailInfoItem label="Ghi chú" value={data.note} className="lg:col-span-2" />
                    </DetailInfoGrid>

                    <DetailItemsTable items={data.items} />
                </div>
            )}
        />
    )
}
