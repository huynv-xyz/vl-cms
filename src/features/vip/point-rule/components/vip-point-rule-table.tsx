import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { CrudTable } from '@/components/crud/crud-table'
import type { VipPointRule } from '../data/schema'
import { vipPointRuleColumns } from './vip-point-rule-columns'

type VipPointRuleTableProps = {
    data: VipPointRule[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function VipPointRuleTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: VipPointRuleTableProps) {
    return (
        <CrudTable<VipPointRule>
            data={data}
            columns={vipPointRuleColumns}
            entityName='quy tắc tính điểm VIP'
            searchPlaceholder='Tìm theo mã hàng hoặc ghi chú...'
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}