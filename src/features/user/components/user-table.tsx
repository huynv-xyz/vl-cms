import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { User } from "../data/schema"
import { userColumns } from "./user-columns"

type UserTableProps = {
    data: User[]
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

export function UserTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: UserTableProps) {
    return (
        <CrudTable<User>
            data={data}
            columns={userColumns}
            entityName="user"
            searchPlaceholder="Tìm theo email hoặc tên..."
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
                        { label: "Ngưng hoạt động", value: "0" },
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