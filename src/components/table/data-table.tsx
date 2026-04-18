import { Fragment, useEffect, useState } from 'react'
import {
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type PaginationState,
    type OnChangeFn,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableToolbar } from './toolbar'
import { DataTablePagination } from './pagination'
import {
    BaseBulkActions,
    type BulkActionItem,
} from './bulk-actions'

export type BaseDataTableProps<TData> = {
    data: TData[]
    columns: ColumnDef<TData, any>[]
    filters?: any[]
    searchPlaceholder?: string
    keyword?: string
    searchInputClassName?: string
    onKeywordChange?: (value: string) => void
    entityName?: string
    className?: string
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    bulkActions?: BulkActionItem<TData>[]
    enableExpand?: boolean
    renderExpanded?: (row: TData) => React.ReactNode
    defaultExpandAll?: boolean
    footer?: React.ReactNode
}

export function BaseDataTable<TData>({
    data,
    columns,
    filters = [],
    searchPlaceholder = 'Tìm kiếm...',
    keyword = '',
    searchInputClassName,
    onKeywordChange,
    entityName = 'bản ghi',
    className,
    pagination,
    onPaginationChange,
    pageCount,
    bulkActions = [],
    enableExpand = false,
    renderExpanded,
    defaultExpandAll = false,
    footer
}: BaseDataTableProps<TData>) {

    const [rowSelection, setRowSelection] = useState({})
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [expanded, setExpanded] = useState<any>({})
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if (defaultExpandAll && !initialized) {
            setExpanded(true)
            setInitialized(true)
        }
    }, [defaultExpandAll, initialized])

    const table = useReactTable({
        data,

        columns: enableExpand
            ? [
                {
                    id: "expand",
                    header: "",
                    cell: ({ row }: any) => (
                        <button
                            onClick={() => row.toggleExpanded()}
                            className="text-xs"
                        >
                            {row.getIsExpanded() ? "▼" : "▶"}
                        </button>
                    ),
                },
                ...columns,
            ]
            : columns,

        state: {
            sorting,
            columnVisibility,
            rowSelection,
            pagination,
            expanded,
        },

        onExpandedChange: setExpanded,

        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange,

        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),

        manualPagination: true,
        pageCount,
    })

    return (
        <div className={cn(
            'min-w-0 max-w-full',
            'flex flex-1 flex-col gap-4',
            className
        )}>

            <DataTableToolbar
                table={table}
                searchPlaceholder={searchPlaceholder}
                keyword={keyword}
                searchInputClassName={searchInputClassName}
                onKeywordChange={onKeywordChange}
                filters={filters}
            />

            <div className='w-full overflow-x-auto rounded-md border'>
                <Table className='w-max min-w-full table-auto'>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            <>
                                {table.getRowModel().rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <TableRow>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {enableExpand &&
                                            row.getIsExpanded() &&
                                            renderExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={row.getVisibleCells().length}>
                                                        {renderExpanded(row.original)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                    </Fragment>
                                ))}

                                {footer !== false && (
                                    <TableRow className="bg-muted/30 font-semibold">
                                        {table.getVisibleLeafColumns().map((col) => {
                                            const footerFn = col.columnDef.meta?.footer
                                            return (
                                                <TableCell key={col.id}>
                                                    {footerFn ? footerFn(data) : null}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Không tìm thấy {entityName}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} className='mt-auto' />

            {bulkActions.length > 0 && (
                <BaseBulkActions
                    table={table}
                    entityName={entityName}
                    actions={bulkActions}
                />
            )}
        </div>
    )
}