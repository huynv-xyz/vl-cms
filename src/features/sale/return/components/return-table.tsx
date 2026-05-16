import { CrudTable } from "@/components/crud/crud-table"
import type { Return } from "../data/schema"
import { useReturnColumns } from "./return-columns"
import { RETURN_STATUSES } from "./return-status"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getOrder, listOrders } from "@/api/sale/order"
import { getExport, listExports } from "@/api/sale/export"
import { exportOption, orderOption } from "@/lib/option-mapper"
import { formatNumber } from "@/lib/utils"

export function ReturnTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters = {},
    onFiltersChange,
}: any) {

    const { columns, dialog } = useReturnColumns()
    const doneCount = data.filter((item: Return) => item.status === "DONE").length
    const cancelledCount = data.filter((item: Return) => item.status === "CANCELLED").length
    const totalItems = data.reduce(
        (sum: number, item: Return) => sum + (item.items?.length ?? 0),
        0
    )

    const updateFilter = (patch: any) => {
        onFiltersChange?.({
            status: filters.status ?? [],
            order_id: filters.order_id,
            export_id: filters.export_id,
            ...patch,
        })
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Tổng phiếu" value={data.length} />
                <SummaryCard label="Hoàn thành" value={doneCount} />
                <SummaryCard label="Đã hủy" value={cancelledCount} />
                <SummaryCard label="Dòng hàng" value={totalItems} />
            </div>

            <CrudTable<Return>
                data={data}
                columns={columns}
                entityName="phiếu trả"
                searchPlaceholder="Tìm theo mã trả, phiếu xuất..."

                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}

                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "status",
                        title: "",
                        options: RETURN_STATUSES.map((status) => ({
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
                        columnId: "export_id",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                value={filters.export_id}
                                placeholder="Lọc phiếu xuất"
                                dataSource={{ getList: listExports, getById: getExport }}
                                mapOption={exportOption}
                                onChange={(exportId: any) => updateFilter({ export_id: exportId })}
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
