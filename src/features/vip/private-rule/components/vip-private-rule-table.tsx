import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { CrudTable } from "@/components/crud/crud-table"
import type { VipPrivateRule } from "../data/schema"
import { vipPrivateRuleColumns } from "./vip-private-rule-columns"

type VipPrivateRuleTableProps = {
    data: VipPrivateRule[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function VipPrivateRuleTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: VipPrivateRuleTableProps) {
    return (
        <CrudTable<VipPrivateRule>
            data={data}
            columns={vipPrivateRuleColumns}
            entityName="quy tắc thưởng riêng"
            searchPlaceholder="Tìm theo mã hoặc tên quy tắc..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}