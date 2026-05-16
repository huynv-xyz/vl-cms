import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import type { ShipmentItem } from "../data/schema"
import { ShipmentItemRowActions } from "./shipment-item-row-actions"

export const shipmentItemColumns: ColumnDef<ShipmentItem>[] = [
    buildIndexColumn(),
    {
        id: "shipment",
        header: "Lô hàng",
        cell: ({ row }) => {
            const item = row.original
            const shipment = item.shipment

            return (
                <div className="min-w-[210px] space-y-1 text-base">
                    <div className="font-semibold">{shipment?.code ?? `#${item.shipment_id ?? "-"}`}</div>
                    <StatusBadge status={shipment?.status} />
                    <div className="text-sm text-muted-foreground">
                        Container: {shipment?.container_no || "-"}
                    </div>
                </div>
            )
        },
    },
    {
        id: "product",
        header: "Sản phẩm",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[280px] space-y-1 text-base">
                    <div className="font-semibold">{item.product?.code ?? "-"}</div>
                    <div className="max-w-[420px] truncate text-base text-muted-foreground">
                        {item.product?.name ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        ĐVT: {item.product?.unit ?? "-"}
                    </div>
                </div>
            )
        },
    },
    {
        id: "schedule",
        header: "Lịch hàng",
        cell: ({ row }) => {
            const shipment = row.original.shipment

            return (
                <div className="min-w-[190px] space-y-1 text-base">
                    <InfoLine label="Ngày đi" value={shipment?.etd} />
                    <InfoLine label="Ngày đến" value={shipment?.eta} />
                    <InfoLine label="Về kho" value={shipment?.warehouse_at} />
                </div>
            )
        },
    },
    {
        id: "place",
        header: "Kho/Cảng",
        cell: ({ row }) => {
            const shipment = row.original.shipment

            return (
                <div className="min-w-[180px] space-y-1 text-base">
                    <div className="font-medium">{shipment?.warehouse?.name ?? "-"}</div>
                    {shipment?.destination_port && <div className="text-muted-foreground">
                        Cảng {shipment?.destination_port?.name ?? "-"}
                    </div>}
                </div>
            )
        },
    },
    {
        id: "quantity",
        header: "Số lượng",
        cell: ({ row }) => {
            const item = row.original
            const quantity = item.quantity ?? 0
            const defect = item.defect_quantity ?? 0

            return (
                <div className="min-w-[140px] space-y-1 text-base">
                    <InfoLine label="Nhập" value={formatNumber(quantity)} strong />
                    <InfoLine label="Lỗi" value={formatNumber(defect)} />
                    <InfoLine label="Thực" value={formatNumber(Math.max(quantity - defect, 0))} />
                </div>
            )
        },
    },
    {
        id: "amount",
        header: "Giá trị",
        cell: ({ row }) => {
            const item = row.original
            const quantity = Math.max((item.quantity ?? 0) - (item.defect_quantity ?? 0), 0)
            const price = (item.unit_price ?? 0) + (item.packaging_price ?? 0) + (item.freight_price ?? 0)

            return (
                <div className="min-w-[160px] text-right text-base">
                    <div className="font-semibold">{formatCurrency(quantity * price)}</div>
                    <div className="text-sm text-muted-foreground">
                        ĐG: {formatCurrency(item.unit_price ?? 0)}
                    </div>
                </div>
            )
        },
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    },
    buildActionsColumn({
        renderActions: (_, row) => (
            <ShipmentItemRowActions row={row} />
        ),
    }),
]

function InfoLine({
    label,
    value,
    strong,
}: {
    label: string
    value?: string | number
    strong?: boolean
}) {
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className={strong ? "font-semibold" : "font-medium"}>{value || "-"}</span>
        </div>
    )
}

function StatusBadge({ status }: { status?: string }) {
    const className =
        status === "DONE"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "IN_TRANSIT"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : status === "CANCELLED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"

    return (
        <Badge variant="outline" className={`${className} text-sm`}>
            {formatStatus(status)}
        </Badge>
    )
}

function formatStatus(status?: string) {
    switch (status) {
        case "PLANNED":
            return "Kế hoạch"
        case "IN_TRANSIT":
            return "Đang vận chuyển"
        case "DONE":
            return "Hoàn tất"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "-"
    }
}
