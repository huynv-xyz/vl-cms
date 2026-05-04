import { CrudTable } from "@/components/crud/crud-table"
import type { Receipt } from "../data/schema"
import { receiptColumns } from "./receipt-columns"

export function ReceiptTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {
    return (
        <CrudTable<Receipt>
            data={data}
            columns={receiptColumns}
            entityName="phiếu thu"
            searchPlaceholder="Tìm phiếu thu..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}