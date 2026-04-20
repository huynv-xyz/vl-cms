import { CrudTable } from "@/components/crud/crud-table"
import type { Delivery } from "../data/schema"
import { deliveryColumns } from "./delivery-columns"

export function DeliveryTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {
    return (
        <CrudTable<Delivery>
            data={data}
            columns={deliveryColumns}
            entityName="phiếu giao"
            searchPlaceholder="Tìm theo mã giao..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}