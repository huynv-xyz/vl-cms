import { useMemo } from "react"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { AccessRole } from "../data/schema"
import { buildRoleColumns } from "./role-columns"

type Props = {
    data: AccessRole[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    onAssignPermissions: (role: AccessRole) => void
}

export function RoleTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    onAssignPermissions,
}: Props) {
    const columns = useMemo(
        () => buildRoleColumns(onAssignPermissions),
        [onAssignPermissions]
    )

    return (
        <CrudTable<AccessRole>
            data={data}
            columns={columns}
            entityName="role"
            searchPlaceholder="Tìm theo mã hoặc tên vai trò..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
