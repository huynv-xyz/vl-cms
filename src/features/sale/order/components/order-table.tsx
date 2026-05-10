import { CrudTable } from "@/components/crud/crud-table"
import type { Order } from "../data/schema"
import { useOrderColumns } from "./order-columns"

export function OrderTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {
    const orderColumns = useOrderColumns()
    return (
        <CrudTable<Order>
            data={data}
            columns={orderColumns}
            entityName="đơn hàng"
            searchPlaceholder="Tìm theo số đơn..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}