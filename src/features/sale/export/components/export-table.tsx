import { CrudTable } from "@/components/crud/crud-table"
import type { Export } from "../data/schema"
import { useExportColumns } from "./export-columns"
import { EXPORT_STATUSES } from "./export-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getOrder, listOrders } from "@/api/sale/order"
import { getDelivery, listDeliveries } from "@/api/sale/delivery"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { deliveryOption, orderOption, warehouseOption } from "@/lib/option-mapper"
import { formatNumber } from "@/lib/utils"

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

    const { columns, dialog } = useExportColumns()
    const doneCount = data.filter((item: Export) => item.status === "DONE").length
    const totalItems = data.reduce(
        (sum: number, item: Export) => sum + (item.items?.length ?? 0),
        0
    )

    const updateFilter = (patch: any) => {
        onFiltersChange?.({
            status: filters.status ?? [],
            order_id: filters.order_id,
            delivery_id: filters.delivery_id,
            warehouse_id: filters.warehouse_id,
            ...patch,
        })
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Tổng phiếu" value={data.length} />
                <SummaryCard label="Đã hoàn thành" value={doneCount} />
                <SummaryCard label="Chưa hoàn thành" value={data.length - doneCount} />
                <SummaryCard label="Dòng hàng" value={totalItems} />
            </div>

            <CrudTable<Export>
                data={data}
                columns={columns}
                entityName="phiếu xuất"
                searchPlaceholder="Tìm theo số phiếu xuất, đơn hàng..."
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "status",
                        title: "",
                        options: EXPORT_STATUSES.map((status) => ({
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
                        columnId: "delivery_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.delivery_id}
                                placeholder="Lọc phiếu giao"
                                dataSource={{ getList: listDeliveries, getById: getDelivery }}
                                mapOption={deliveryOption}
                                onChange={(deliveryId: any) => updateFilter({ delivery_id: deliveryId })}
                            />
                        ),
                    },
                    {
                        columnId: "warehouse_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.warehouse_id}
                                placeholder="Lọc kho xuất"
                                dataSource={{ getList: listWarehouses, getById: getWarehouse }}
                                mapOption={warehouseOption}
                                onChange={(warehouseId: any) => updateFilter({ warehouse_id: warehouseId })}
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
