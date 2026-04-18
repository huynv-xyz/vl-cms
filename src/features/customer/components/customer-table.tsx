import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { Download, Ban } from 'lucide-react'
import { CrudTable } from '@/components/crud/crud-table'
import type { BulkActionItem } from '@/components/table/bulk-actions'
import type { Customer } from '../data/schema'
import { customerColumns } from './customer-columns'

type CustomerTableProps = {
    data: Customer[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: {
        types?: string[]
        regions?: string[]
        statuses?: string[]
    }
    onFiltersChange: (filters: {
        types?: string[]
        regions?: string[]
        statuses?: string[]
    }) => void
}

export function CustomerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: CustomerTableProps) {
    const bulkActions: BulkActionItem<Customer>[] = [
        {
            key: 'export',
            icon: <Download className='size-4' />,
            label: 'Xuất danh sách',
            onClick: (selectedItems) => {
                console.log('export customers', selectedItems)
            },
        },
        {
            key: 'deactivate',
            icon: <Ban className='size-4' />,
            label: 'Ngưng hoạt động',
            onClick: (selectedItems) => {
                console.log('deactivate customers', selectedItems)
            },
        },
    ]

    return (
        <CrudTable<Customer>
            data={data}
            columns={customerColumns}
            entityName='khách hàng'
            searchPlaceholder='Tìm theo code hoặc tên...'
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            bulkActions={bulkActions}
            filters={[
                {
                    columnId: 'region',
                    title: 'Khu vực',
                    options: [
                        { label: 'Miền Bắc', value: 'MB' },
                        { label: 'Miền Nam', value: 'MN' },
                    ],
                    values: filters.regions ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            regions: values,
                        }),
                },
                {
                    columnId: 'status',
                    title: 'Trạng thái',
                    options: [
                        { label: 'Hoạt động', value: '1' },
                        { label: 'Ngưng hoạt động', value: '0' },
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