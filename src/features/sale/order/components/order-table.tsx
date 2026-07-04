import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    AlertCircle,
    AlertTriangle,
    Boxes,
    CheckCircle2,
    CopyPlus,
    Download,
    FileText,
    Inbox,
    MoreHorizontal,
    Package,
    PackageCheck,
    User,
    Wallet,
    Pencil,
    type LucideIcon,
} from "lucide-react"

import type { Order } from "../data/schema"
import { getOrderStatusMeta, ORDER_STATUSES } from "./order-status"
import { useOrders } from "./orders-provider"

import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { DatePicker } from "@/components/date-picker"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { getMyPermissions } from "@/api/auth/permission"
import { listOrders, updateOrderStatus, type OrderListParams } from "@/api/sale/order"

import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import { OrderDocumentDialog } from "./order-document-dialog"
import { CreateOrderDialog } from "./create-order-dialog"
import { OrderPriceAdjustmentDialog } from "./order-price-adjustment-dialog"

const controlClass = "h-9 min-h-9 rounded-md border-slate-300 bg-white shadow-xs"
const EXPORT_PAGE_SIZE = 500

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function OrderTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    exportFilters,
    filters,
    onFiltersChange,
}: any) {
    const [isExporting, setIsExporting] = useState(false)
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateOrder =
        hasPermission(permissions, "sales.orders", "update") ||
        hasPermission(permissions, "sales.orders", "status.update")
    const canAdjustPrice = hasPermission(permissions, "sales.orders", "price.adjust")

    const setFilter = (key: string, value: any) =>
        onFiltersChange?.({ ...filters, [key]: value })

    const selectedStatuses: string[] = filters?.status ?? []
    const toggleStatus = (val: string) => {
        const next = selectedStatuses.includes(val)
            ? selectedStatuses.filter((s) => s !== val)
            : [...selectedStatuses, val]
        setFilter("status", next.length ? next : undefined)
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev: any) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const currentPage = pagination.pageIndex + 1
    const summary = buildSummary(data)
    const returnTo = buildOrdersReturnTo({
        page: currentPage,
        size: pagination.pageSize,
        keyword,
        filters,
    })

    const handleExportAllPages = async () => {
        if (isExporting) return

        setIsExporting(true)
        try {
            const allOrders = await fetchAllOrdersForExport(exportFilters ?? {})
            await exportOrdersXlsx(allOrders)
            toast.success(`Đã xuất ${formatNumber(allOrders.length)} đơn hàng`)
        } catch (error: any) {
            toast.error(error?.message || "Xuất Excel thất bại")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-5">
            {/* ── Summary metrics ─────────────────────────────────── */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                    icon={Package}
                    label="Đơn đang xem"
                    value={formatNumber(summary.count)}
                    tone="muted"
                />
                <SummaryMetric
                    icon={Wallet}
                    label="Tổng giá trị (các đơn đang xem)"
                    value={formatCurrency(summary.amount)}
                    tone="primary"
                />
                <SummaryMetric
                    icon={PackageCheck}
                    label="Đã xuất / SL đặt"
                    value={`${formatNumber(summary.exportedQty)} / ${formatNumber(summary.totalQty)}`}
                    tone="success"
                />
                <SummaryMetric
                    icon={summary.remainQty > 0 ? AlertCircle : Boxes}
                    label="Còn phải xuất"
                    value={formatNumber(summary.remainQty)}
                    tone={summary.remainQty > 0 ? "warn" : "muted"}
                />
            </div>

            {/* ── Main card ───────────────────────────────────────── */}
            <Card className="border-border/60 gap-0 overflow-visible py-0 shadow-sm">
                <CardHeader className="space-y-2 border-b px-3 py-3">
                    {/* Title row */}
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(data.length)} đơn
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold shadow-xs hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={handleExportAllPages}
                                disabled={isExporting}
                            >
                                <Download className="h-3.5 w-3.5" />
                                {isExporting ? "Đang xuất..." : "Xuất Excel"}
                            </button>
                            <Badge variant="outline" className="w-fit font-mono">
                                Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                            </Badge>
                        </div>
                    </div>

                    {/* Filter strip */}
                    <div className="bg-muted/40 -mx-3 -mb-3 border-t px-3 py-2">
                        <div className="space-y-2">
                            {/* Row 1: Search + Customer */}
                            <div className="flex w-full flex-wrap items-center gap-2">
                                <SearchOnBlurInput
                                    value={keyword}
                                    onChange={onKeywordChange}
                                    placeholder="Tìm theo mã đơn, khách hàng..."
                                    wrapperClassName="relative h-9 min-w-[260px] flex-[1.2_1_0]"
                                    className={cn(controlClass, "pl-10")}
                                />
                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[280px] flex-[1.8_1_0] py-0")}
                                    placeholder="Khách hàng"
                                    value={filters?.customer_id}
                                    onChange={(v: any) => setFilter("customer_id", v || undefined)}
                                    dataSource={{
                                        getList: listCustomers,
                                        getById: getCustomer,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name || x.code || `#${x.id}`,
                                        raw: x,
                                    })}
                                />
                            </div>

                            {/* Row 2: Status pills + Employee + Dates */}
                            <div className="flex w-full flex-wrap items-center gap-2">
                                {/* Status pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {ORDER_STATUSES.map((s) => {
                                        const active = selectedStatuses.includes(s.value)
                                        const meta = getOrderStatusMeta(s.value)
                                        return (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => toggleStatus(s.value)}
                                                className={cn(
                                                    "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold transition-colors",
                                                    active
                                                        ? meta.badgeClass
                                                        : "border-slate-300 bg-white text-muted-foreground hover:bg-muted/60"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[200px] flex-1 py-0")}
                                    placeholder="Nhân viên bán"
                                    value={filters?.employee_id}
                                    onChange={(v: any) => setFilter("employee_id", v || undefined)}
                                    dataSource={{
                                        getList: listEmployees,
                                        getById: getEmployee,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name || x.code || `#${x.id}`,
                                        raw: x,
                                    })}
                                />

                                <DatePicker
                                    className={cn(
                                        "min-w-[140px] flex-1",
                                        "[&_button]:h-9 [&_button]:min-h-9 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters?.from_date}
                                    onChange={(v) => setFilter("from_date", v || undefined)}
                                    placeholder="Từ ngày"
                                />
                                <DatePicker
                                    className={cn(
                                        "min-w-[140px] flex-1",
                                        "[&_button]:h-9 [&_button]:min-h-9 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters?.to_date}
                                    onChange={(v) => setFilter("to_date", v || undefined)}
                                    placeholder="Đến ngày"
                                />
                                <Select
                                    value={filters?.order_date_sort || "desc"}
                                    onValueChange={(v) => setFilter("order_date_sort", v)}
                                >
                                    <SelectTrigger className={cn(controlClass, "min-w-[190px] flex-1 text-sm")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asc">Ngày đặt tăng dần</SelectItem>
                                        <SelectItem value="desc">Ngày đặt giảm dần</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* ── Order list ──────────────────────────────────── */}
                <div className="space-y-2 p-2">
                    {data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            <OrderListHeader />
                            {data.map((order: Order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    canUpdateOrder={canUpdateOrder}
                                    canAdjustPrice={canAdjustPrice}
                                    returnTo={returnTo}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* ── Pagination ──────────────────────────────────── */}
                <div className="bg-muted/30 border-t px-3 py-2">
                    <CardPagination
                        pageIndex={pagination.pageIndex}
                        pageCount={pageCount}
                        onPageChange={setPageIndex}
                        className="px-0"
                    />
                </div>
            </Card>
        </div>
    )
}

function OrderListHeader() {
    return (
        <div className="bg-muted/95 sticky top-16 z-40 hidden items-center gap-2 rounded-md border px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground shadow-xs backdrop-blur xl:grid xl:grid-cols-[88px_150px_minmax(210px,1.5fr)_minmax(150px,1fr)_minmax(190px,1.15fr)_140px_330px]">
            <div>Ngày đặt</div>
            <div>Mã đơn</div>
            <div>Khách hàng</div>
            <div>Hàng hóa</div>
            <div>Tiến độ xuất</div>
            <div className="text-right">Tổng tiền</div>
            <div className="text-center">Thao tác</div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({
    order,
    canUpdateOrder,
    canAdjustPrice,
    returnTo,
}: {
    order: Order
    canUpdateOrder: boolean
    canAdjustPrice: boolean
    returnTo: string
}) {
    const { openEdit } = useOrders()
    const queryClient = useQueryClient()
    const [documentOpen, setDocumentOpen] = useState(false)
    const [cloneOpen, setCloneOpen] = useState(false)
    const [priceOpen, setPriceOpen] = useState(false)

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            updateOrderStatus(id, status),
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["orders"] })
            const prev = queryClient.getQueryData(["orders"])
            queryClient.setQueryData(["orders"], (old: any) => {
                if (!old?.items) return old
                return {
                    ...old,
                    items: old.items.map((o: Order) =>
                        o.id === id ? { ...o, status } : o
                    ),
                }
            })
            return { prev }
        },
        onError: (_err, _vars, ctx) => {
            queryClient.setQueryData(["orders"], ctx?.prev)
            toast.error("Cập nhật trạng thái thất bại")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
        },
    })

    const items: any[] = (order as any).items ?? []
    const normalItems = items.filter((i) => i.line_type !== "PROMOTION")
    const promoCount = items.length - normalItems.length
    const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0)
    const exportedQty = items.reduce((s, i) => s + Number(i.exported_quantity || 0), 0)
    const remainQty = items.reduce((s, i) => s + Number(i.remain_quantity || 0), 0)
    const percent = totalQty > 0 ? Math.min(100, Math.round((exportedQty / totalQty) * 100)) : 0
    const isDone = remainQty <= 0 && totalQty > 0

    const status = order.status || "NEW"
    const isLocked = status === "DONE"
    const hasDoneExport = hasCompletedExport(order)
    const meta = getOrderStatusMeta(status)
    const StatusIcon = meta.icon
    const stockCheck = getOrderStockCheck(items)

    const customer = (order as any).customer
    const employee = (order as any).employee
    return (
        <div className="bg-card overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md">
            <div className="grid items-center gap-2 px-2.5 py-2 text-sm xl:grid-cols-[88px_150px_minmax(210px,1.5fr)_minmax(150px,1fr)_minmax(190px,1.15fr)_140px_330px]">
                <div className="text-muted-foreground text-xs tabular-nums">
                    {formatDate(order.order_date)}
                </div>

                <div className="min-w-0">
                    <Link
                        to="/sales/orders/$id"
                        params={{ id: String(order.id) }}
                        search={{ return_to: returnTo }}
                        className="text-primary inline-flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold hover:underline"
                    >
                        <Package className="h-3.5 w-3.5 opacity-70" />
                        <span className="truncate">{order.order_no}</span>
                    </Link>
                </div>

                <div className="min-w-0">
                    {customer ? (
                        <>
                            <div className="truncate font-semibold">{customer.name}</div>
                            {employee && (
                                <div className="text-muted-foreground truncate text-xs">
                                    NV: {employee.name}
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </div>

                <div className="min-w-0">
                    {items.length === 0 ? (
                        <span className="text-muted-foreground text-sm italic">Chưa có hàng</span>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[11px] font-semibold">
                                    {normalItems.length} sản phẩm
                                </Badge>
                                {promoCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="h-5 bg-emerald-100 px-1.5 py-0 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                    >
                                        +{promoCount} KM
                                    </Badge>
                                )}
                            </div>
                            <div className="text-muted-foreground text-xs tabular-nums">
                                {formatNumber(totalQty)} đơn vị đặt
                            </div>
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    {totalQty === 0 ? (
                        <span className="text-muted-foreground text-sm italic">—</span>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground tabular-nums">
                                    {formatNumber(exportedQty)} / {formatNumber(totalQty)}
                                </span>
                                <span
                                    className={cn(
                                        "font-bold tabular-nums",
                                        isDone
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-foreground"
                                    )}
                                >
                                    {percent}%
                                </span>
                            </div>
                            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        isDone
                                            ? "bg-emerald-500"
                                            : remainQty > 0
                                              ? "bg-amber-400"
                                              : "bg-muted-foreground/30"
                                    )}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-right text-sm font-bold tabular-nums">
                    {formatCurrency((order as any).total_amount ?? 0)}
                </div>

                <div className="flex items-center justify-end gap-1.5">
                    {status === "NEW" && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span
                                    className={cn(
                                        "inline-flex h-8 w-8 items-center justify-center rounded-md border",
                                        stockCheck.shortage
                                            ? "border-rose-200 bg-rose-50 text-rose-600"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-600"
                                    )}
                                >
                                    {stockCheck.shortage ? (
                                        <AlertTriangle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {stockCheck.shortage ? "Vượt tồn" : "Đạt tồn"}
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Select
                        value={status}
                        onValueChange={(v) => changeStatus({ id: order.id, status: v })}
                        disabled={isPending || isLocked || !canUpdateOrder}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-8 w-[138px] gap-1.5 border text-xs font-semibold",
                                meta.badgeClass
                            )}
                        >
                            <SelectValue>
                                <span className="flex items-center gap-1.5">
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {meta.label}
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map((s) => {
                                const sm = getOrderStatusMeta(s.value)
                                const SIcon = sm.icon
                                return (
                                    <SelectItem key={s.value} value={s.value} disabled={isLocked}>
                                        <span className="flex items-center gap-2">
                                            <SIcon className={cn("h-3.5 w-3.5", sm.tone)} />
                                            {s.label}
                                        </span>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>

                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold shadow-xs hover:bg-muted/60"
                        onClick={() => setDocumentOpen(true)}
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Đơn
                    </button>

                    <OrderRowMenu
                        order={order}
                        canEdit={!isLocked && !hasDoneExport && canUpdateOrder}
                        canAdjustPrice={canAdjustPrice && hasDoneExport}
                        onEdit={() => openEdit(order)}
                        onClone={() => setCloneOpen(true)}
                        onAdjustPrice={() => setPriceOpen(true)}
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
            <OrderPriceAdjustmentDialog
                open={priceOpen}
                order={order}
                onOpenChange={setPriceOpen}
            />
        </div>
    )
}

function OrderRowMenu({
    order,
    canEdit,
    canAdjustPrice,
    onEdit,
    onClone,
    onAdjustPrice,
}: {
    order: Order
    canEdit: boolean
    canAdjustPrice: boolean
    onEdit: () => void
    onClone: () => void
    onAdjustPrice: () => void
}) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    aria-label={`Thao tác đơn ${order.order_no}`}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem
                    disabled={!canEdit}
                    onClick={onEdit}
                    className="gap-2"
                >
                    <Pencil className="h-4 w-4" />
                    Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClone} className="gap-2">
                    <CopyPlus className="h-4 w-4" />
                    Nhân bản
                </DropdownMenuItem>
                {canAdjustPrice && (
                    <DropdownMenuItem onClick={onAdjustPrice} className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Sửa giá
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
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

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
            <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-xl">
                <Inbox className="h-6 w-6" />
            </div>
            <div>
                <div className="font-semibold">Không tìm thấy đơn hàng</div>
                <div className="text-muted-foreground mt-1 text-sm">
                    Thử đổi từ khoá hoặc điều chỉnh bộ lọc.
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((p: any) => p.module === module && p.action === action)
}

function buildSummary(data: Order[]) {
    return data.reduce(
        (acc, order: any) => {
            const items = order.items ?? []
            acc.count += 1
            acc.amount += Number(order.total_amount || 0)
            acc.totalQty += items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)
            acc.exportedQty += items.reduce((s: number, i: any) => s + Number(i.exported_quantity || 0), 0)
            acc.remainQty += items.reduce((s: number, i: any) => s + Number(i.remain_quantity || 0), 0)
            return acc
        },
        { count: 0, amount: 0, totalQty: 0, exportedQty: 0, remainQty: 0 }
    )
}

const SUMMARY_TONES = {
    info: {
        ring: "border-blue-200/60 dark:border-blue-900/40",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        value: "",
    },
    primary: {
        ring: "border-primary/20 bg-primary/[0.02]",
        iconBg: "bg-primary/10 text-primary",
        value: "text-primary",
    },
    success: {
        ring: "border-emerald-200/60 dark:border-emerald-900/40",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        value: "text-emerald-700 dark:text-emerald-400",
    },
    warn: {
        ring: "border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20",
        iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        value: "text-amber-700 dark:text-amber-400",
    },
    muted: {
        ring: "border-border/60",
        iconBg: "bg-muted text-muted-foreground",
        value: "text-muted-foreground",
    },
} as const

function SummaryMetric({
    icon: Icon,
    label,
    value,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    tone: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]
    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                        styles.iconBg
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div
                        className={cn(
                            "mt-1 truncate text-xl font-bold tabular-nums",
                            styles.value
                        )}
                    >
                        {value}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

async function fetchAllOrdersForExport(filters: Partial<OrderListParams>) {
    const allOrders: Order[] = []
    let page = 1
    let totalPage = 1

    do {
        const result = await listOrders({
            ...filters,
            page,
            size: EXPORT_PAGE_SIZE,
        })

        allOrders.push(...(result.items ?? []))
        totalPage = Math.max(Number(result.total_page || 1), 1)
        page += 1
    } while (page <= totalPage)

    return allOrders
}

export async function exportOrdersXlsx(data: Order[], filename?: string) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Don hang")
    const columns = ORDER_EXPORT_COLUMNS
    sheet.addRow(columns.map((column) => column.header))

    data.forEach((order: any) => {
        const items = order.items?.length ? order.items : [null]

        items.forEach((item: any) => {
            const quantity = Number(item?.quantity || 0)
            const unitPrice = Number(item?.unit_price || 0)
            const discount = Number(item?.discount || 0)
            const amount = Math.max(quantity * unitPrice - discount, 0)

            sheet.addRow([
                parseExcelDate(order.order_date),
                getOrderStatusMeta(order.status || "NEW").label,
                getDeliveryStatusLabel(order),
                formatEmployee(order.employee),
                order.order_no || "",
                order.customer?.code || "",
                order.customer?.name || "",
                item?.product?.code || item?.product?.quote_code || "",
                item?.product?.name || item?.product_name || "",
                item?.description || "",
                lineTypeLabel(item?.line_type),
                item?.product?.unit || item?.unit || "",
                normalizeExcelNumber(quantity),
                normalizeExcelNumber(unitPrice),
                normalizeExcelNumber(discount),
                normalizeExcelNumber(amount),
                order.note || "",
                item?.note || "",
            ])
        })
    })

    sheet.columns = columns.map((column) => ({ width: column.width }))
    sheet.views = [{ state: "frozen", ySplit: 1 }]
    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
    }

    const header = sheet.getRow(1)
    header.height = 26
    header.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell((cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.font = { name: "Arial", size: 10 }
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: true,
            }
            if (column.type === "date") {
                cell.numFmt = "dd/mm/yyyy"
            }
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadExcelBuffer(
        buffer,
        filename || `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
}

export async function exportOrderXlsx(order: Order) {
    const safeOrderNo = (order as any).order_no || `don-${order.id}`
    await exportOrdersXlsx([order], `phieu-don-dat-hang-${safeOrderNo}.xlsx`)
}

type OrderExportColumn = {
    header: string
    width: number
    type?: "date" | "number"
}

const ORDER_EXPORT_COLUMNS: OrderExportColumn[] = [
    { header: "Ngày đặt hàng", width: 14, type: "date" },
    { header: "Trạng thái đơn", width: 18 },
    { header: "Tình trạng giao hàng", width: 20 },
    { header: "Người thực hiện", width: 24 },
    { header: "Số đơn hàng", width: 18 },
    { header: "Mã khách hàng", width: 20 },
    { header: "Tên khách hàng", width: 34 },
    { header: "Mã hàng hóa", width: 24 },
    { header: "Diễn giải", width: 42 },
    { header: "Mô tả HH", width: 24 },
    { header: "Loại dòng", width: 14 },
    { header: "Đơn vị", width: 10 },
    { header: "Số lượng", width: 14, type: "number" },
    { header: "Đơn giá bán", width: 16, type: "number" },
    { header: "Chiết khấu", width: 16, type: "number" },
    { header: "Thành tiền", width: 18, type: "number" },
    { header: "Ghi chú đơn hàng", width: 30 },
    { header: "Ghi chú sản phẩm", width: 30 },
] as const

function parseExcelDate(value?: string | number | Date) {
    if (!value) return ""
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value

    const raw = String(value).trim()
    if (!raw) return ""

    const datePart = raw.split(/[T\s]/)[0]
    const ymd = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    }

    const dmy = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    }

    return raw
}

function normalizeExcelNumber(value?: number | string) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : ""
}

function downloadExcelBuffer(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function lineTypeLabel(value?: string) {
    if (value === "PROMOTION") return "Hàng tặng"
    if (value === "SAMPLE") return "Hàng mẫu"
    return "Hàng bán"
}

function getDeliveryStatusLabel(order: Order) {
    const items = order.items ?? []
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const exportedQty = items.reduce((sum, item) => sum + Number(item.exported_quantity || 0), 0)

    if (order.status === "DONE" || (totalQty > 0 && exportedQty >= totalQty)) {
        return "Đã giao hàng"
    }

    if (exportedQty > 0) {
        return "Giao một phần"
    }

    return "Chưa giao hàng"
}

function getOrderStockCheck(items: any[]) {
    const byProduct = new Map<
        string,
        { name: string; code: string; required: number; stock: number }
    >()

    for (const item of items || []) {
        const productId = item.product_id ?? item.product?.id
        if (!productId) continue

        const key = String(productId)
        const current =
            byProduct.get(key) ?? {
                name: item.product?.name ?? item.product_name ?? "Sản phẩm",
                code: item.product?.code ?? "",
                required: 0,
                stock: Number(item.stock_quantity || 0),
            }

        current.required += Number(item.quantity || 0)
        current.stock = Number(item.stock_quantity ?? current.stock ?? 0)
        byProduct.set(key, current)
    }

    const shortages = Array.from(byProduct.values()).filter(
        (x) => x.required > x.stock
    )

    return {
        shortage: shortages.length > 0,
        shortageCount: shortages.length,
        lines: shortages.map((x) => {
            const product = x.code ? `${x.code} - ${x.name}` : x.name
            return `${product}: cần ${formatNumber(x.required)}, tồn ${formatNumber(x.stock)}`
        }),
    }
}

function formatEmployee(employee?: Order["employee"]) {
    if (!employee) return ""
    return employee.code ? `${employee.name} (${employee.code})` : employee.name || ""
}

function buildOrdersReturnTo({
    page,
    size,
    keyword,
    filters,
}: {
    page: number
    size: number
    keyword?: string
    filters?: any
}) {
    const params = new URLSearchParams()
    params.set("page", String(page || 1))
    params.set("size", String(size || 20))
    appendParam(params, "keyword", keyword)
    appendParam(params, "status", Array.isArray(filters?.status) ? filters.status.join(",") : filters?.status)
    appendParam(params, "customer_id", filters?.customer_id)
    appendParam(params, "employee_id", filters?.employee_id)
    appendParam(params, "from_date", filters?.from_date)
    appendParam(params, "to_date", filters?.to_date)
    appendParam(params, "order_date_sort", filters?.order_date_sort || "desc")

    return `/sales/orders?${params.toString()}`
}

function appendParam(params: URLSearchParams, key: string, value: unknown) {
    if (value === undefined || value === null || value === "") return
    params.set(key, String(value))
}

function formatDate(value?: string | number | Date) {
    if (!value) return "—"

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate())
    }

    const raw = String(value).trim()
    if (!raw) return "—"

    const datePart = raw.split(/[T\s]/)[0]
    const ymd = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (ymd) {
        return formatDateParts(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]))
    }

    const dmy = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return formatDateParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]))
    }

    const compactYmd = datePart.match(/^(\d{4})(\d{2})(\d{2})$/)
    if (compactYmd) {
        return formatDateParts(Number(compactYmd[1]), Number(compactYmd[2]), Number(compactYmd[3]))
    }

    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
        return formatDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
    }

    return raw
}

function formatDateParts(year: number, month: number, day: number) {
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}



