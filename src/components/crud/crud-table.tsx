import type { ColumnDef, OnChangeFn, PaginationState } from '@tanstack/react-table'
import { BaseDataTable } from '@/components/table/data-table'
import type { BulkActionItem } from '@/components/table/bulk-actions'

type CrudFilterConfig =
    | {
        columnId: string
        title: string
        options: {
            label: string
            value: string
            icon?: React.ComponentType<{ className?: string }>
        }[]
        values?: string[]
        onChange?: (values: string[]) => void
    }
    | {
        columnId: string
        title: string
        render: () => React.ReactNode
    }

type CrudTableProps<T> = {
    data: T[]
    columns: ColumnDef<T, unknown>[]
    entityName: string
    searchPlaceholder?: string
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword?: string
    searchInputClassName?: string
    onKeywordChange?: (value: string) => void
    filters?: CrudFilterConfig[]
    bulkActions?: BulkActionItem<T>[]
    enableExpand?: boolean
    defaultExpandAll?: boolean
    renderExpanded?: (row: T) => React.ReactNode
    footer?: React.ReactNode
    showToolbar?: boolean
}

export function CrudTable<T>({
    data,
    columns,
    entityName,
    searchPlaceholder,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    searchInputClassName,
    onKeywordChange,
    filters,
    bulkActions,
    enableExpand,
    defaultExpandAll,
    renderExpanded,
    footer,
    showToolbar
}: CrudTableProps<T>) {
    return (
        <BaseDataTable<T>
            data={data}
            columns={columns}
            entityName={entityName}
            searchPlaceholder={searchPlaceholder}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            searchInputClassName={searchInputClassName}
            onKeywordChange={onKeywordChange}
            filters={filters}
            bulkActions={bulkActions}
            enableExpand={enableExpand}
            defaultExpandAll={defaultExpandAll}
            renderExpanded={renderExpanded}
            footer={footer}
            showToolbar={showToolbar}
        />
    )
}
