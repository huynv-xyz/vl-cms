import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { SalesTarget } from "../data/schema"
import { salesTargetColumns } from "./sales-target-columns"

type SalesTargetTableProps = {
    data: SalesTarget[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function SalesTargetTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: SalesTargetTableProps) {
    return (
        <CrudTable<SalesTarget>
            data={data}
            columns={salesTargetColumns}
            entityName="chỉ tiêu"
            searchPlaceholder="Tìm theo nhân viên..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
