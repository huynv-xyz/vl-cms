import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { updateOrderStatus } from "@/api/sale/order"
import { getMyPermissions } from "@/api/auth/permission"
import { Button } from "@/components/ui/button"
import { InlineStatus } from "@/components/inline-status"
import { getOrderStatusMeta, ORDER_STATUSES } from "../../order/components/order-status"
import { OrderDocumentDialog } from "../../order/components/order-document-dialog"
import { CreateOrderDialog } from "../../order/components/create-order-dialog"
import { UpdateOrderDialog } from "../../order/components/update-order-dialog"
import { OrderPriceAdjustmentDialog } from "../../order/components/order-price-adjustment-dialog"
import {
    CalendarDays,
    Clock,
    CopyPlus,
    FileText,
    MapPin,
    Pencil,
    Phone,
    Receipt,
    UserRound,
    UsersRound,
} from "lucide-react"

type Props = {
    order: any
    metrics?: React.ReactNode
}

export function OrderInfo({ order, metrics }: Props) {
    const [documentOpen, setDocumentOpen] = useState(false)
    const [cloneOpen, setCloneOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [priceOpen, setPriceOpen] = useState(false)
    const statusMeta = getOrderStatusMeta(order.status)
    const StatusIcon = statusMeta.icon
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateStatus = permissions.some(
        (p: any) =>
            p.module === "sales.orders" &&
            (p.action === "status.update" || p.action === "update")
    )
    const canAdjustPrice = permissions.some(
        (p: any) => p.module === "sales.orders" && p.action === "price.adjust"
    )
    const isLocked = order.status === "DONE" || order.status === "CANCELLED"
    const hasDoneExport = hasCompletedExport(order)
    const canEditOrder = canUpdateStatus && !isLocked && !hasDoneExport

    return (
        <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/30 shadow-sm">
            {/* TOP STRIP */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-background/60 px-5 py-3 backdrop-blur">
                <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${statusMeta.badgeClass}`}>
                        <StatusIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-bold tracking-tight">
                                {order.order_no}
                            </h2>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}
                            >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusMeta.label}
                            </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Ngày đặt: <strong className="text-foreground">{formatDate(order.order_date)}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Tạo lúc {formatDateTime(order.created_at)}
                            </span>
                            {order.updated_at && (
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Cập nhật {formatDateTime(order.updated_at)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[170px] items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={() => setCloneOpen(true)}
                    >
                        <CopyPlus className="h-3.5 w-3.5" />
                        Nhân bản
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={() => setDocumentOpen(true)}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Đơn
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={() => setEditOpen(true)}
                        disabled={!canEditOrder}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa đơn
                    </Button>
                    {canAdjustPrice && hasDoneExport && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5"
                            onClick={() => setPriceOpen(true)}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa giá
                        </Button>
                    )}
                    <InlineStatus
                        row={order}
                        value={order.status}
                        options={[...ORDER_STATUSES]}
                        queryKey={["order-detail", order.id]}
                        invalidateQueryKeys={[["orders"], ["deliveries"], ["exports"]]}
                        mutationFn={updateOrderStatus}
                        getId={(x) => x.id}
                        disabled={!canUpdateStatus}
                    />
                </div>
            </div>

            <OrderDocumentDialog
                open={documentOpen}
                order={order}
                onClose={() => setDocumentOpen(false)}
            />

            <CreateOrderDialog
                open={cloneOpen}
                onOpenChange={setCloneOpen}
                initialData={order}
            />

            <UpdateOrderDialog
                order={order}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <OrderPriceAdjustmentDialog
                order={order}
                open={priceOpen}
                onOpenChange={setPriceOpen}
            />

            {/* INFO GRID */}
            <div className="grid gap-3 px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info
                    icon={<UsersRound className="h-4 w-4" />}
                    label="Khách hàng"
                    value={
                        order.customer ? (
                            <>
                                {order.customer.name ?? "-"}
                                <div className="text-muted-foreground mt-0.5 truncate text-xs">
                                    {order.customer.code}
                                </div>
                            </>
                        ) : "-"
                    }
                    sub={
                        <>
                            {order.customer?.phone && (
                                <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {order.customer.phone}
                                </span>
                            )}
                            {order.customer?.address && (
                                <span className="ml-2 inline-flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3" />
                                    {order.customer.address}
                                </span>
                            )}
                        </>
                    }
                />
                <Info
                    icon={<UserRound className="h-4 w-4" />}
                    label="Nhân viên bán"
                    value={order.employee?.name ?? "-"}
                    sub={order.employee?.phone || order.employee?.email}
                />
                <Info
                    icon={<Receipt className="h-4 w-4" />}
                    label="Tổng tiền"
                    value={
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(order.total_amount || 0)}
                        </span>
                    }
                    sub={`${(order.items?.length || 0)} sản phẩm`}
                />
                <Info
                    icon={<FileText className="h-4 w-4" />}
                    label="Ghi chú"
                    value={order.note || <span className="font-normal text-muted-foreground">Không có</span>}
                />
            </div>

            {metrics && (
                <div className="border-t bg-background/45 px-5 py-3">
                    {metrics}
                </div>
            )}
        </div>
    )
}

function hasCompletedExport(order: any) {
    if (order?.status === "DONE") {
        return true
    }
    if ((order.exports ?? []).some((item: any) => item.status === "DONE")) {
        return true
    }
    return false
}

function Info({
    icon,
    label,
    value,
    sub,
}: {
    icon?: React.ReactNode
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
}) {
    return (
        <div className="rounded-lg border bg-background/80 px-3 py-2 transition-colors hover:bg-background">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-0.5 min-h-[1.15rem] truncate text-sm font-semibold">{value}</div>
            {sub && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>
            )}
        </div>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3) {
        return parts[0].length === 4
            ? `${parts[2]}/${parts[1]}/${parts[0]}`
            : `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return date
}

function formatDateTime(value?: string) {
    if (!value) return "-"
    return value.replace("T", " ").slice(0, 16)
}



