import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { CrudTable } from '@/components/crud/crud-table'
import type { VipPointGroup } from '../data/schema'
import { vipPointGroupColumns } from './vip-point-group-columns'

type VipPointGroupTableProps = {
    data: VipPointGroup[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    onRowClick?: (group: VipPointGroup) => void
}

export function VipPointGroupTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    onRowClick,
}: VipPointGroupTableProps) {
    return (
        <CrudTable<VipPointGroup>
            data={data}
            columns={vipPointGroupColumns}
            entityName='nhóm tính điểm VIP'
            searchPlaceholder='Tìm theo mã nhóm, tên nhóm hoặc diễn giải...'
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            onRowClick={onRowClick}
        />
    )
}
