import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { SalesActualItem } from "../data/schema"
import { salesActualColumns } from "./sales-actual-columns"

type Props = {
    data: SalesActualItem[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    isLoading?: boolean
}

export function SalesActualTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    isLoading,
}: Props) {
    return (
        <CrudTable<SalesActualItem>
            data={data}
            columns={salesActualColumns}
            entityName="doanh số"
            searchPlaceholder="Tìm theo tên hoặc mã nhân viên..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            searchInputClassName="lg:w-[360px]"
            onKeywordChange={onKeywordChange}
            showToolbar={!isLoading}
        />
    )
}
