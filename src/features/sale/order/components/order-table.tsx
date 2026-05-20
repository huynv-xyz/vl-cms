import { CrudTable } from "@/components/crud/crud-table"
import type { Order } from "../data/schema"
import { useOrderColumns } from "./order-columns"
import { ORDER_STATUSES } from "./order-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency } from "@/lib/utils"
import {
    AlertCircle,
    Boxes,
    ClipboardList,
    FileText,
    PackageCheck,
    Wallet,
    type LucideIcon,
} from "lucide-react"

const FILTER_CONTROL_CLASS = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

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
    const orderColumns = useOrderColumns()
    const summary = buildSummary(data)
    const setFilter = (key: string, value: any) =>
        onFiltersChange?.({
            ...filters,
            [key]: value,
        })

    return (
        <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={FileText}
                    label="Đơn đang xem"
                    value={formatNumber(summary.count)}
                    tone="info"
                />
                <SummaryCard
                    icon={Wallet}
                    label="Tổng giá trị"
                    value={formatCurrency(summary.amount)}
                    tone="primary"
                />
                <SummaryCard
                    icon={PackageCheck}
                    label="Đã xuất / SL đặt"
                    value={`${formatNumber(summary.exportedQty)} / ${formatNumber(summary.totalQty)}`}
                    tone="success"
                />
                <SummaryCard
                    icon={summary.remainQty > 0 ? AlertCircle : Boxes}
                    label="Còn phải xuất"
                    value={formatNumber(summary.remainQty)}
                    tone={summary.remainQty > 0 ? "warn" : "muted"}
                />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo mã đơn, khách hàng..."
                        wrapperClassName="relative h-10 min-w-[320px] flex-[1.2_1_0]"
                        className={cn(FILTER_CONTROL_CLASS, "pl-10")}
                    />

                    <AsyncSelect
                        className={cn(FILTER_CONTROL_CLASS, "min-w-[320px] flex-[1.8_1_0] py-0")}
                        placeholder="Khách hàng"
                        value={filters?.customer_id}
                        onChange={(value: any) => setFilter("customer_id", value || undefined)}
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

                <div className="flex w-full flex-wrap items-center gap-2">
                    <StatusFilter
                        value={filters?.status}
                        onChange={(value) => setFilter("status", value)}
                    />

                    <AsyncSelect
                        className={cn(FILTER_CONTROL_CLASS, "min-w-[200px] flex-1 py-0")}
                        placeholder="Nhân viên bán"
                        value={filters?.employee_id}
                        onChange={(value: any) => setFilter("employee_id", value || undefined)}
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
                            "h-10 min-w-[150px] flex-1",
                            "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        )}
                        value={filters?.from_date}
                        onChange={(value) => setFilter("from_date", value || undefined)}
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className={cn(
                            "h-10 min-w-[150px] flex-1",
                            "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        )}
                        value={filters?.to_date}
                        onChange={(value) => setFilter("to_date", value || undefined)}
                        placeholder="Đến ngày"
                    />
                </div>
            </div>

            <CrudTable<Order>
                data={data}
                columns={orderColumns}
                entityName="đơn hàng"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}

function StatusFilter({
    value,
    onChange,
}: {
    value?: string[]
    onChange: (value?: string[]) => void
}) {
    const selected = value ?? []

    const toggleStatus = (status: string) => {
        const next = selected.includes(status)
            ? selected.filter((item) => item !== status)
            : [...selected, status]

        onChange(next.length ? next : undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(FILTER_CONTROL_CLASS, "min-w-[145px] flex-1 justify-between px-3")}
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-slate-500" />
                        <span className="truncate">
                            {selected.length ? `Trạng thái (${selected.length})` : "Trạng thái"}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                {ORDER_STATUSES.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.includes(option.value)}
                        onCheckedChange={() => toggleStatus(option.value)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xóa bộ lọc trạng thái
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function buildSummary(data: Order[]) {
    return data.reduce(
        (acc, order: any) => {
            const items = order.items ?? []
            acc.count += 1
            acc.amount += Number(order.total_amount || 0)
            acc.totalQty += items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
            acc.exportedQty += items.reduce((sum: number, item: any) => sum + Number(item.exported_quantity || 0), 0)
            acc.remainQty += items.reduce((sum: number, item: any) => sum + Number(item.remain_quantity || 0), 0)
            return acc
        },
        { count: 0, amount: 0, totalQty: 0, exportedQty: 0, remainQty: 0 }
    )
}

const SUMMARY_TONES = {
    info: { ring: "border-blue-200/60 dark:border-blue-900/40", iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400", value: "" },
    primary: { ring: "border-primary/20 bg-primary/[0.02]", iconBg: "bg-primary/10 text-primary", value: "text-primary" },
    success: { ring: "border-emerald-200/60 dark:border-emerald-900/40", iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", value: "" },
    warn: { ring: "border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20", iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", value: "text-amber-700 dark:text-amber-400" },
    muted: { ring: "border-border/60", iconBg: "bg-muted text-muted-foreground", value: "text-muted-foreground" },
} as const

function SummaryCard({
    icon: Icon,
    label,
    value,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: string
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]
    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", styles.iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", styles.value)}>{value}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}
