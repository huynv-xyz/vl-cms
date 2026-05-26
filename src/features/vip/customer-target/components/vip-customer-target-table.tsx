import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { VipCustomerTarget } from "../data/schema"
import { vipCustomerTargetColumns } from "./vip-customer-target-columns"

type Props = {
    data: VipCustomerTarget[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function VipCustomerTargetTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: Props) {
    return (
        <CrudTable<VipCustomerTarget>
            data={data}
            columns={vipCustomerTargetColumns}
            entityName="chỉ tiêu khách hàng"
            searchPlaceholder="Tìm theo mã hoặc tên khách hàng..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
