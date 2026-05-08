import { CrudTable } from "@/components/crud/crud-table"
import type { Delivery } from "../data/schema"
import { useDeliveryColumns } from "../hook/use-delivery-columns"

export function DeliveryTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {
    const { columns, dialog } = useDeliveryColumns()

    return (
        <>
            <CrudTable<Delivery>
                data={data}
                columns={columns}
                entityName="phiếu giao"
                searchPlaceholder="Tìm theo mã giao..."

                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}

                keyword={keyword}
                onKeywordChange={onKeywordChange}
            />
            {dialog}
        </>

    )
}