import { CrudTable } from "@/components/crud/crud-table"
import type { Export } from "../data/schema"
import { useExportColumns } from "./export-columns"
import { EXPORT_STATUSES } from "./export-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getOrder, listOrders } from "@/api/sale/order"
import { getDelivery, listDeliveries } from "@/api/sale/delivery"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { deliveryOption, orderOption, warehouseOption } from "@/lib/option-mapper"
import { cn, formatNumber } from "@/lib/utils"
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
import {
    CheckCircle2,
    ClipboardList,
    Files,
    Layers,
    PackageOpen,
    type LucideIcon,
} from "lucide-react"

const FILTER_CONTROL_CLASS =
    "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

export function ExportTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters = {},
    onFiltersChange,
}: any) {

    const { columns } = useExportColumns()
    const doneCount = data.filter((item: Export) => item.status === "DONE").length
    const newCount = data.filter((item: Export) => item.status === "NEW").length
    const totalItems = data.reduce(
        (sum: number, item: Export) => sum + (item.items?.length ?? 0),
        0
    )
    const totalCount = data.length
    const donePct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

    const setFilter = (key: string, value: any) => {
        onFiltersChange?.({
            ...filters,
            [key]: value,
        })
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={Files}
                    label="Tổng phiếu xuất"
                    value={formatNumber(totalCount)}
                    tone="info"
                />
                <SummaryCard
                    icon={PackageOpen}
                    label="Chờ xuất kho"
                    value={formatNumber(newCount)}
                    tone={newCount > 0 ? "warn" : "muted"}
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Đã hoàn thành"
                    value={
                        totalCount > 0
                            ? `${formatNumber(doneCount)} (${donePct}%)`
                            : formatNumber(doneCount)
                    }
                    tone="success"
                />
                <SummaryCard
                    icon={Layers}
                    label="Tổng dòng hàng"
                    value={formatNumber(totalItems)}
                    tone="primary"
                />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo số phiếu xuất, đơn hàng..."
                        wrapperClassName="relative h-10 min-w-[320px] flex-[1.2_1_0]"
                        className={cn(FILTER_CONTROL_CLASS, "pl-10")}
                    />

                    <AsyncSelect
                        className={cn(
                            FILTER_CONTROL_CLASS,
                            "min-w-[260px] flex-[1.8_1_0] py-0"
                        )}
                        value={filters.order_id}
                        placeholder="Đơn hàng"
                        dataSource={{
                            getList: listOrders,
                            getById: getOrder,
                            params: { page: 1, size: 20, status: "DONE" },
                        }}
                        mapOption={orderOption}
                        onChange={(orderId: any) =>
                            setFilter("order_id", orderId || undefined)
                        }
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
                            "min-w-[220px] flex-1 py-0"
                        )}
                        value={filters.delivery_id}
                        placeholder="Phiếu giao"
                        dataSource={{
                            getList: listDeliveries,
                            getById: getDelivery,
                            params: { page: 1, size: 20, status: "DONE" },
                        }}
                        mapOption={deliveryOption}
                        onChange={(deliveryId: any) =>
                            setFilter("delivery_id", deliveryId || undefined)
                        }
                    />

                    <AsyncSelect
                        className={cn(
                            FILTER_CONTROL_CLASS,
                            "min-w-[220px] flex-1 py-0"
                        )}
                        value={filters.warehouse_id}
                        placeholder="Kho xuất"
                        dataSource={{
                            getList: listWarehouses,
                            getById: getWarehouse,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={warehouseOption}
                        onChange={(warehouseId: any) =>
                            setFilter("warehouse_id", warehouseId || undefined)
                        }
                    />
                </div>
            </div>

            <CrudTable<Export>
                data={data}
                columns={columns}
                entityName="phiếu xuất"
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
                {EXPORT_STATUSES.map((option) => (
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
    info: {
        ring: "border-blue-200/60 dark:border-blue-900/40",
        iconBg:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        value: "",
    },
    primary: {
        ring: "border-primary/20 bg-primary/[0.02]",
        iconBg: "bg-primary/10 text-primary",
        value: "text-primary",
    },
    success: {
        ring: "border-emerald-200/60 dark:border-emerald-900/40",
        iconBg:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        value: "",
    },
    warn: {
        ring: "border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20",
        iconBg:
            "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        value: "text-amber-700 dark:text-amber-400",
    },
    muted: {
        ring: "border-border/60",
        iconBg: "bg-muted text-muted-foreground",
        value: "text-muted-foreground",
    },
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
        <Card
            className={cn(
                "gap-0 py-4 shadow-sm transition-shadow hover:shadow-md",
                styles.ring
            )}
        >
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
