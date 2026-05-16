import { CrudTable } from "@/components/crud/crud-table"
import type { Order } from "../data/schema"
import { useOrderColumns } from "./order-columns"
import { ORDER_STATUSES } from "./order-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { DatePicker } from "@/components/date-picker"
import { formatCurrency } from "@/lib/utils"

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

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Đơn đang xem" value={summary.count} />
                <SummaryCard label="Tổng giá trị" value={formatCurrency(summary.amount)} />
                <SummaryCard label="Đã xuất / SL đặt" value={`${formatNumber(summary.exportedQty)} / ${formatNumber(summary.totalQty)}`} />
                <SummaryCard label="Còn phải xuất" value={formatNumber(summary.remainQty)} tone={summary.remainQty > 0 ? "warn" : "ok"} />
            </div>

            <CrudTable<Order>
                data={data}
                columns={orderColumns}
                entityName="đơn hàng"
                searchPlaceholder="Tìm theo mã đơn, khách hàng..."
                searchInputClassName="min-w-[300px]"

                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}

                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "status",
                        title: "",
                        options: ORDER_STATUSES.map((status) => ({
                            label: status.label,
                            value: status.value,
                        })),
                        values: filters?.status ?? [],
                        onChange: (values) =>
                            onFiltersChange?.({
                                ...filters,
                                status: values,
                            }),
                    },
                    {
                        columnId: "customer_id",
                        title: "",
                        render: () => (
                            <div className="w-[220px]">
                                <AsyncSelect
                                    placeholder="Chọn khách hàng"
                                    value={filters?.customer_id}
                                    onChange={(value: any) =>
                                        onFiltersChange?.({
                                            ...filters,
                                            customer_id: value || undefined,
                                        })
                                    }
                                    isClearable
                                    dataSource={{ getList: listCustomers, getById: getCustomer }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name || x.code || `#${x.id}`,
                                        raw: x,
                                    })}
                                />
                            </div>
                        ),
                    },
                    {
                        columnId: "employee_id",
                        title: "",
                        render: () => (
                            <div className="w-[220px]">
                                <AsyncSelect
                                    placeholder="Chọn nhân viên"
                                    value={filters?.employee_id}
                                    onChange={(value: any) =>
                                        onFiltersChange?.({
                                            ...filters,
                                            employee_id: value || undefined,
                                        })
                                    }
                                    isClearable
                                    dataSource={{ getList: listEmployees, getById: getEmployee }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name || x.code || `#${x.id}`,
                                        raw: x,
                                    })}
                                />
                            </div>
                        ),
                    },
                    {
                        columnId: "from_date",
                        title: "",
                        render: () => (
                            <DatePicker
                                value={filters?.from_date}
                                onChange={(v) =>
                                    onFiltersChange?.({
                                        ...filters,
                                        from_date: v || undefined,
                                    })
                                }
                                placeholder="Từ ngày"
                            />
                        ),
                    },
                    {
                        columnId: "to_date",
                        title: "",
                        render: () => (
                            <DatePicker
                                value={filters?.to_date}
                                onChange={(v) =>
                                    onFiltersChange?.({
                                        ...filters,
                                        to_date: v || undefined,
                                    })
                                }
                                placeholder="Đến ngày"
                            />
                        ),
                    }
                ]}
            />
        </div>
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

function SummaryCard({ label, value, tone }: { label: string; value: any; tone?: "ok" | "warn" }) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={tone === "ok" ? "mt-1 text-xl font-bold text-emerald-600" : tone === "warn" ? "mt-1 text-xl font-bold text-amber-600" : "mt-1 text-xl font-bold"}>
                {value}
            </div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}
