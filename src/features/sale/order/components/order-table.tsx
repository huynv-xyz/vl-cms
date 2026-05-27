import { Link } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    AlertCircle,
    Boxes,
    CalendarDays,
    Filter,
    Inbox,
    Package,
    PackageCheck,
    User,
    Wallet,
    type LucideIcon,
} from "lucide-react"

import type { Order } from "../data/schema"
import { getOrderStatusMeta, ORDER_STATUSES } from "./order-status"
import { useOrders } from "./orders-provider"

import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { DatePicker } from "@/components/date-picker"
import { CardPagination } from "@/components/table/card-pagination"
import { CrudRowActions } from "@/components/crud/crud-row-actions"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { updateOrderStatus } from "@/api/sale/order"

import { cn, formatCurrency, formatNumber } from "@/lib/utils"

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

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
    filters,
    onFiltersChange,
}: any) {
    const summary = buildSummary(data)

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

    return (
        <div className="space-y-5">
            {/* ── Summary metrics ─────────────────────────────────── */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                    icon={Package}
                    label="Đơn đang xem"
                    value={formatNumber(summary.count)}
                    hint="Số đơn theo bộ lọc hiện tại"
                    tone="muted"
                />
                <SummaryMetric
                    icon={Wallet}
                    label="Tổng giá trị"
                    value={formatCurrency(summary.amount)}
                    hint="Tổng tiền các đơn đang xem"
                    tone="primary"
                />
                <SummaryMetric
                    icon={PackageCheck}
                    label="Đã xuất / SL đặt"
                    value={`${formatNumber(summary.exportedQty)} / ${formatNumber(summary.totalQty)}`}
                    hint="Số lượng xuất kho so với đặt hàng"
                    tone="success"
                />
                <SummaryMetric
                    icon={summary.remainQty > 0 ? AlertCircle : Boxes}
                    label="Còn phải xuất"
                    value={formatNumber(summary.remainQty)}
                    hint={summary.remainQty > 0 ? "Chưa xuất đủ hàng" : "Tất cả đã xuất đủ"}
                    tone={summary.remainQty > 0 ? "warn" : "muted"}
                />
            </div>

            {/* ── Main card ───────────────────────────────────────── */}
            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="space-y-4 border-b py-5">
                    {/* Title row */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(data.length)} đơn
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Theo dõi trạng thái, tiến độ xuất hàng và tổng giá trị bán ra.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit font-mono">
                            Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                        </Badge>
                    </div>

                    {/* Filter strip */}
                    <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Bộ lọc đơn hàng
                        </div>

                        <div className="space-y-2">
                            {/* Row 1: Search + Customer */}
                            <div className="flex w-full flex-wrap items-center gap-2">
                                <SearchOnBlurInput
                                    value={keyword}
                                    onChange={onKeywordChange}
                                    placeholder="Tìm theo mã đơn, khách hàng..."
                                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.2_1_0]"
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
                                                    "inline-flex h-10 items-center rounded-md border px-3 text-xs font-semibold transition-colors",
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
                                        "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters?.from_date}
                                    onChange={(v) => setFilter("from_date", v || undefined)}
                                    placeholder="Từ ngày"
                                />
                                <DatePicker
                                    className={cn(
                                        "min-w-[140px] flex-1",
                                        "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters?.to_date}
                                    onChange={(v) => setFilter("to_date", v || undefined)}
                                    placeholder="Đến ngày"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* ── Order list ──────────────────────────────────── */}
                <div className="space-y-4 p-5">
                    {data.length === 0 ? (
                        <EmptyState />
                    ) : (
                        data.map((order: Order, index: number) => (
                            <OrderCard
                                key={order.id}
                                index={pagination.pageIndex * pagination.pageSize + index + 1}
                                order={order}
                            />
                        ))
                    )}
                </div>

                {/* ── Pagination ──────────────────────────────────── */}
                <div className="bg-muted/30 border-t px-6 py-4">
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

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ index, order }: { index: number; order: Order }) {
    const { openEdit } = useOrders()
    const queryClient = useQueryClient()

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
    const isLocked = status === "DONE" || status === "CANCELLED"
    const meta = getOrderStatusMeta(status)
    const StatusIcon = meta.icon

    const customer = (order as any).customer
    const employee = (order as any).employee
    const initials = getInitials(customer?.name)

    return (
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_1fr_auto]">
                {/* Index */}
                <div className="bg-muted/50 text-muted-foreground hidden items-center justify-center border-r font-mono text-sm font-semibold lg:flex">
                    #{index}
                </div>

                {/* Order info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <Link
                        to="/sales/orders/$id"
                        params={{ id: String(order.id) }}
                        className="text-primary inline-flex items-center gap-1.5 font-mono text-sm font-bold hover:underline"
                    >
                        <Package className="h-3.5 w-3.5 opacity-70" />
                        {order.order_no}
                    </Link>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(order.order_date)}
                    </span>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2 px-4 py-3">
                    <Select
                        value={status}
                        onValueChange={(v) => changeStatus({ id: order.id, status: v })}
                        disabled={isPending || isLocked}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-8 w-[148px] gap-1.5 border text-xs font-semibold",
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

                    {!isLocked && (
                        <CrudRowActions
                            row={order}
                            onEdit={() => openEdit(order)}
                        />
                    )}
                </div>
            </div>

            {/* ── Body: 3-col grid ────────────────────────────────── */}
            <div className="grid divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                {/* Khách hàng */}
                <InfoBlock title="Khách hàng" icon={User}>
                    {customer ? (
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">
                                    {customer.name}
                                </div>
                                {employee && (
                                    <div className="text-muted-foreground mt-0.5 truncate text-xs">
                                        NV: {employee.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                    )}
                </InfoBlock>

                {/* Hàng hoá */}
                <InfoBlock title="Hàng hoá" icon={Package}>
                    {items.length === 0 ? (
                        <span className="text-muted-foreground text-sm italic">Chưa có hàng</span>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="secondary" className="px-2 py-0 text-xs font-semibold">
                                    {normalItems.length} sản phẩm
                                </Badge>
                                {promoCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-emerald-100 px-2 py-0 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
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
                </InfoBlock>

                {/* Tiến độ xuất */}
                <InfoBlock title="Tiến độ xuất" icon={PackageCheck}>
                    {totalQty === 0 ? (
                        <span className="text-muted-foreground text-sm italic">—</span>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
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
                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
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
                            {remainQty > 0 ? (
                                <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Còn {formatNumber(remainQty)} chưa xuất
                                </div>
                            ) : (
                                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Đã xuất đủ
                                </div>
                            )}
                        </div>
                    )}
                </InfoBlock>
            </div>

            {/* ── Footer: total ───────────────────────────────────── */}
            <div className="bg-muted/20 flex items-center justify-end border-t px-4 py-3">
                <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tổng tiền
                    </div>
                    <div className="text-base font-bold tabular-nums">
                        {formatCurrency((order as any).total_amount ?? 0)}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// InfoBlock (same pattern as inventory)
// ─────────────────────────────────────────────────────────────────────────────
function InfoBlock({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon: LucideIcon
    children: React.ReactNode
}) {
    return (
        <div className="p-4">
            <div className="text-muted-foreground mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <Icon className="h-3 w-3" />
                {title}
            </div>
            {children}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SummaryMetric (same as inventory)
// ─────────────────────────────────────────────────────────────────────────────
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
    hint,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    hint: string
    tone?: keyof typeof SUMMARY_TONES
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
                    <div className="text-muted-foreground mt-1 truncate text-xs">{hint}</div>
                </div>
            </CardContent>
        </Card>
    )
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

function formatDate(value?: string) {
    if (!value) return "—"
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return date || value
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
