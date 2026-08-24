import { CrudTable } from "@/components/crud/crud-table"
import type { Delivery } from "../data/schema"
import { useDeliveryColumns } from "../hook/use-delivery-columns"
import { DELIVERY_STATUSES } from "./delivery-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getCustomer, listCustomers } from "@/api/customer"
import { getOrder, listOrders } from "@/api/sale/order"
import { getCompany, listCompanies } from "@/api/company"
import {
    companyOption,
    orderOption,
} from "@/lib/option-mapper"
import { cn, formatNumber } from "@/lib/utils"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    CheckCircle2,
    ClipboardList,
    Files,
    Layers,
    Truck,
    type LucideIcon,
} from "lucide-react"

const FILTER_CONTROL_CLASS =
    "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

export function DeliveryTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters = {},
    onFiltersChange,
}: any) {
    const { columns, dialog } = useDeliveryColumns()

    const doneCount = data.filter((x: Delivery) => x.status === "DONE").length
    const deliveringCount = data.filter((x: Delivery) => x.status === "DELIVERING").length
    const totalItems = data.reduce(
        (sum: number, item: Delivery) => sum + (item.items?.length ?? 0),
        0
    )

    const totalCount = data.length
    const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

    const setFilter = (key: string, value: any) =>
        onFiltersChange?.({
            ...filters,
            [key]: value,
        })

    return (
        <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={Files}
                    label="Tổng phiếu giao"
                    value={formatNumber(totalCount)}
                    tone="opening"
                />
                <SummaryCard
                    icon={Truck}
                    label="Đang giao"
                    value={formatNumber(deliveringCount)}
                    tone={deliveringCount > 0 ? "neutral" : "closing"}
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Đã giao"
                    value={
                        totalCount > 0
                            ? `${formatNumber(doneCount)} (${donePct}%)`
                            : formatNumber(doneCount)
                    }
                    tone="credit"
                />
                <SummaryCard
                    icon={Layers}
                    label="Tổng dòng hàng"
                    value={formatNumber(totalItems)}
                    tone="closing"
                />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo mã giao, đơn hàng..."
                        wrapperClassName="relative h-10 min-w-[320px] flex-[1.2_1_0]"
                        className={cn(FILTER_CONTROL_CLASS, "pl-10")}
                    />

                    <AsyncSelect
                        className={cn(
                            FILTER_CONTROL_CLASS,
                            "min-w-[240px] flex-[1.2_1_0] py-0"
                        )}
                        placeholder="Đơn hàng"
                        value={filters?.order_id}
                        onChange={(value: any) =>
                            setFilter("order_id", value || undefined)
                        }
                        dataSource={{
                            getList: listOrders,
                            getById: getOrder,
                            params: { page: 1, size: 20, status: "CONFIRMED" },
                        }}
                        mapOption={orderOption}
                    />

                    <AsyncSelect
                        className={cn(
                            FILTER_CONTROL_CLASS,
                            "min-w-[240px] flex-[1.2_1_0] py-0"
                        )}
                        placeholder="Khách hàng"
                        value={filters?.customer_id}
                        onChange={(value: any) =>
                            setFilter("customer_id", value || undefined)
                        }
                        dataSource={{
                            getList: listCustomers,
                            getById: getCustomer,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={customerOption}
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <StatusFilter
                        value={filters?.status}
                        onChange={(value) => setFilter("status", value)}
                    />

                    <AsyncSelect
                        className={cn(
                            FILTER_CONTROL_CLASS,
                            "min-w-[200px] flex-1 py-0"
                        )}
                        placeholder="Công ty"
                        value={filters?.company_id}
                        onChange={(value: any) =>
                            setFilter("company_id", value || undefined)
                        }
                        dataSource={{
                            getList: listCompanies,
                            getById: getCompany,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={companyOption}
                    />

                    <DatePicker
                        className={cn(
                            "h-10 min-w-[150px] flex-1",
                            "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        )}
                        value={filters?.from_date}
                        onChange={(value) =>
                            setFilter("from_date", value || undefined)
                        }
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className={cn(
                            "h-10 min-w-[150px] flex-1",
                            "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        )}
                        value={filters?.to_date}
                        onChange={(value) =>
                            setFilter("to_date", value || undefined)
                        }
                        placeholder="Đến ngày"
                    />
                </div>
            </div>

            <CrudTable<Delivery>
                data={data}
                columns={columns}
                entityName="phiếu giao"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableColumnResize
                enableStickyHorizontalScroll
                headerVariant="report"
                footer={false}
            />
            {dialog}
        </div>
    )
}

function customerOption(customer: { id: number; code?: string; name: string }) {
    return {
        value: customer.id,
        label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
        raw: customer,
    }
}

/* ---------------- Status filter ---------------- */

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
                    className={cn(
                        FILTER_CONTROL_CLASS,
                        "min-w-[145px] flex-1 justify-between px-3"
                    )}
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-slate-500" />
                        <span className="truncate">
                            {selected.length
                                ? `Trạng thái (${selected.length})`
                                : "Trạng thái"}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                {DELIVERY_STATUSES.map((option) => (
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

const SUMMARY_TONES = {
    opening: {
        card: "border-sky-200 bg-sky-50 text-sky-800",
        icon: "bg-white/75 text-sky-700",
        value: "text-sky-950",
    },
    credit: {
        card: "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: "bg-white/75 text-emerald-700",
        value: "text-emerald-700",
    },
    closing: {
        card: "border-blue-200 bg-blue-50 text-blue-800",
        icon: "bg-white/75 text-blue-700",
        value: "text-blue-950",
    },
    neutral: {
        card: "border-amber-200 bg-amber-50 text-amber-800",
        icon: "bg-white/75 text-amber-700",
        value: "text-amber-700",
    },
} as const

function SummaryCard({
    icon: Icon,
    label,
    value,
    tone = "neutral",
}: {
    icon: LucideIcon
    label: string
    value: string
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]
    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", styles.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", styles.icon)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div
                        className={cn(
                            "mt-1 truncate text-right text-lg font-semibold tabular-nums",
                            styles.value
                        )}
                    >
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}
