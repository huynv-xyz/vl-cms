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
    filters: {
        statuses?: string[]
    }
    onFiltersChange: (filters: {
        statuses?: string[]
    }) => void
}

export function SalesTargetTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
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
            filters={[
                {
                    columnId: "status",
                    title: "Trạng thái",
                    options: [
                        { label: "Hoạt động", value: "1" },
                        { label: "Ngưng", value: "0" },
                    ],
                    values: filters.statuses ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            statuses: values,
                        }),
                },
            ]}
        />
    )
}