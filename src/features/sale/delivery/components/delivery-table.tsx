import { CrudTable } from "@/components/crud/crud-table"
import type { Delivery } from "../data/schema"
import { useDeliveryColumns } from "../hook/use-delivery-columns"
import { DELIVERY_STATUSES } from "./delivery-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getOrder, listOrders } from "@/api/sale/order"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { getCompany, listCompanies } from "@/api/company"
import { companyOption, orderOption, warehouseOption } from "@/lib/option-mapper"
import { formatNumber } from "@/lib/utils"
import { DatePicker } from "@/components/date-picker"

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

    const updateFilter = (patch: any) => {
        onFiltersChange?.({
            status: filters.status ?? [],
            order_id: filters.order_id,
            warehouse_id: filters.warehouse_id,
            company_id: filters.company_id,
            from_date: filters.from_date,
            to_date: filters.to_date,
            ...patch,
        })
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Tổng phiếu" value={data.length} />
                <SummaryCard label="Đang giao" value={deliveringCount} />
                <SummaryCard label="Hoàn thành" value={doneCount} />
                <SummaryCard label="Dòng hàng" value={totalItems} />
            </div>

            <CrudTable<Delivery>
                data={data}
                columns={columns}
                entityName="phiếu giao"
                searchPlaceholder="Tìm theo mã giao, đơn hàng..."

                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}

                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "status",
                        title: "",
                        options: DELIVERY_STATUSES.map((status) => ({
                            label: status.label,
                            value: status.value,
                        })),
                        values: filters.status ?? [],
                        onChange: (status) => updateFilter({ status }),
                    },
                    {
                        columnId: "order_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.order_id}
                                placeholder="Lọc đơn hàng"
                                dataSource={{ getList: listOrders, getById: getOrder }}
                                mapOption={orderOption}
                                onChange={(orderId: any) => updateFilter({ order_id: orderId })}
                            />
                        ),
                    },
                    {
                        columnId: "warehouse_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.warehouse_id}
                                placeholder="Lọc kho"
                                dataSource={{ getList: listWarehouses, getById: getWarehouse }}
                                mapOption={warehouseOption}
                                onChange={(warehouseId: any) => updateFilter({ warehouse_id: warehouseId })}
                            />
                        ),
                    },
                    {
                        columnId: "company_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.company_id}
                                placeholder="Lọc công ty"
                                dataSource={{ getList: listCompanies, getById: getCompany }}
                                mapOption={companyOption}
                                onChange={(companyId: any) => updateFilter({ company_id: companyId })}
                            />
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
                    },
                ]}
            />
            {dialog}
        </div>

    )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold">{formatNumber(value)}</div>
        </div>
    )
}
