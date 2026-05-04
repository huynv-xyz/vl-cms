import { CrudTable } from "@/components/crud/crud-table"
import type { Return } from "../data/schema"
import { returnColumns } from "./return-columns"

export function ReturnTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {

    return (
        <CrudTable<Return>
            data={data}
            columns={returnColumns}
            entityName="phiếu trả"
            searchPlaceholder="Tìm theo mã trả..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}