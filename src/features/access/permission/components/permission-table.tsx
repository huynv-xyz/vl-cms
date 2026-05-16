import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { PermissionRow } from "../data/schema"
import { permissionColumns } from "./permission-columns"

type Props = {
    data: PermissionRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function PermissionTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: Props) {
    return (
        <CrudTable<PermissionRow>
            data={data}
            columns={permissionColumns}
            entityName="permission"
            searchPlaceholder="Tìm theo module..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
