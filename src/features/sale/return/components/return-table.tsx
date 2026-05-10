import { CrudTable } from "@/components/crud/crud-table"
import type { Return } from "../data/schema"
import { useReturnColumns } from "./return-columns"

export function ReturnTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: any) {

    const { columns, dialog } = useReturnColumns()

    return (
        <>
            <CrudTable<Return>
                data={data}
                columns={columns}
                entityName="phiếu trả"
                searchPlaceholder="Tìm theo mã trả..."

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