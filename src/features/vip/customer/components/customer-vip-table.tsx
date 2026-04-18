import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { CrudTable } from '@/components/crud/crud-table'
import type { CustomerVip } from '../data/schema'
import { customerVipColumns } from './customer-vip-columns'

type CustomerVipTableProps = {
    data: CustomerVip[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: {
        regions?: string[]
        tier_codes?: string[]
        group_codes?: string[]
    }
    onFiltersChange: (filters: {
        regions?: string[]
        tier_codes?: string[]
        group_codes?: string[]
    }) => void
}

export function CustomerVipTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: CustomerVipTableProps) {
    return (
        <CrudTable<CustomerVip>
            data={data}
            columns={customerVipColumns}
            entityName='khách hàng VIP'
            searchPlaceholder='Tìm theo mã hoặc tên khách hàng...'
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
                {
                    columnId: 'region',
                    title: 'Khu vực',
                    values: filters.regions ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            regions: values,
                        }),
                    options: [
                        { label: 'Miền Bắc', value: 'MB' },
                        { label: 'Miền Nam', value: 'MN' },
                    ],
                },
                {
                    columnId: 'tier_code',
                    title: 'Hạng VIP',
                    values: filters.tier_codes ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            tier_codes: values,
                        }),
                    options: [
                        { label: 'Thành viên 2', value: 'THANH_VIEN_2' },
                        { label: 'Thành viên 1', value: 'THANH_VIEN_1' },
                        { label: 'Bạc', value: 'BAC' },
                        { label: 'Vàng', value: 'VANG' },
                        { label: 'Bạch Kim', value: 'BACH_KIM' },
                        { label: 'Kim Cương', value: 'KIM_CUONG' },
                        { label: 'B_600', value: 'B_600' },
                        { label: 'B_700', value: 'B_700' },
                    ],
                },
                {
                    columnId: 'group_code',
                    title: 'Loại KH',
                    values: filters.group_codes ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            group_codes: values,
                        }),
                    options: [
                        { label: 'B2B', value: 'B2B' },
                        { label: 'B2C', value: 'B2C' },
                    ],
                },
            ]}
        />
    )
}