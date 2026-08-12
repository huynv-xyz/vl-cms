import { useMemo } from "react"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { AccessRole } from "@/api/auth/role"
import type { User } from "@/features/user/data/schema"
import { buildUserRoleColumns } from "./user-role-columns"

type Props = {
    data: User[]
    roles: AccessRole[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    onAssign: (user: User) => void
}

export function UserRoleTable({
    data,
    roles,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    onAssign,
}: Props) {
    const columns = useMemo(
        () => buildUserRoleColumns(onAssign, roles),
        [onAssign, roles]
    )

    return (
        <CrudTable<User>
            data={data}
            columns={columns}
            entityName="user-role"
            searchPlaceholder="Tìm user theo email hoặc tên..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
