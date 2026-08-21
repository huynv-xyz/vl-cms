import { Fragment, useEffect, useRef, useState } from 'react'
import {
    type ColumnDef,
    type ColumnSizingState,
    type SortingState,
    type VisibilityState,
    type PaginationState,
    type OnChangeFn,
    type ExpandedState,
    type Row,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
} from '@tanstack/react-table'
import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableToolbar, type ToolbarFilter } from './toolbar'
import { DataTablePagination } from './pagination'
import {
    BaseBulkActions,
    type BulkActionItem,
} from './bulk-actions'

export type BaseDataTableProps<TData> = {
    data: TData[]
    columns: ColumnDef<TData, unknown>[]
    filters?: ToolbarFilter[]
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
    showToolbar?: boolean
    onRowClick?: (row: TData) => void
    enableColumnResize?: boolean
    enableStickyHorizontalScroll?: boolean
    enableColumnPinning?: boolean
    defaultPinnedUntil?: number
    defaultPinnedColumnId?: string
    headerVariant?: "default" | "report"
    showCellBorders?: boolean
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
    footer,
    showToolbar = true,
    onRowClick,
    enableColumnResize = false,
    enableStickyHorizontalScroll = false,
    enableColumnPinning = false,
    defaultPinnedUntil = -1,
    defaultPinnedColumnId,
    headerVariant = "default",
    showCellBorders = false,
}: BaseDataTableProps<TData>) {

    const [rowSelection, setRowSelection] = useState({})
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
    const [expanded, setExpanded] = useState<ExpandedState>({})
    const [initialized, setInitialized] = useState(false)
    const tableScrollRef = useRef<HTMLDivElement | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const headerTableRef = useRef<HTMLTableElement | null>(null)
    const stickyScrollRef = useRef<HTMLDivElement | null>(null)
    const isSyncingScrollRef = useRef(false)
    const [stickyScroll, setStickyScroll] = useState({
        visible: false,
        contentWidth: 0,
        viewportWidth: 0,
    })
    const [stickyHeaderTop, setStickyHeaderTop] = useState(64)
    const [pinnedUntilIndex, setPinnedUntilIndex] = useState(defaultPinnedUntil)

    useEffect(() => {
        if (defaultExpandAll && !initialized) {
            setExpanded(true)
            setInitialized(true)
        }
    }, [defaultExpandAll, initialized])

    useEffect(() => {
        if (!enableStickyHorizontalScroll) return

        const updateStickyScroll = () => {
            const tableScroll = tableScrollRef.current
            if (!tableScroll) return

            const next = {
                visible: tableScroll.scrollWidth > tableScroll.clientWidth + 1,
                contentWidth: tableScroll.scrollWidth,
                viewportWidth: tableScroll.clientWidth,
            }
            setStickyScroll((current) => (
                current.visible === next.visible &&
                current.contentWidth === next.contentWidth &&
                current.viewportWidth === next.viewportWidth
                    ? current
                    : next
            ))

            syncHeaderScroll(tableScroll.scrollLeft)
            if (stickyScrollRef.current) {
                stickyScrollRef.current.scrollLeft = tableScroll.scrollLeft
            }
        }

        updateStickyScroll()

        const tableScroll = tableScrollRef.current
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateStickyScroll) : null
        if (tableScroll && resizeObserver) {
            resizeObserver.observe(tableScroll)
            const tableElement = tableScroll.querySelector("table")
            if (tableElement) resizeObserver.observe(tableElement)
        }
        window.addEventListener("resize", updateStickyScroll)

        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener("resize", updateStickyScroll)
        }
    }, [enableStickyHorizontalScroll, data, columns, columnSizing, columnVisibility])

    useEffect(() => {
        if (headerVariant !== "report") return

        const updateStickyHeaderTop = () => {
            const appHeader = document.querySelector<HTMLElement>(".header-fixed")
            if (!appHeader) {
                setStickyHeaderTop(0)
                return
            }

            const rect = appHeader.getBoundingClientRect()
            const nextTop = Math.max(0, Math.min(rect.bottom, rect.height))
            setStickyHeaderTop((current) => current === nextTop ? current : nextTop)
        }

        updateStickyHeaderTop()
        document.addEventListener("scroll", updateStickyHeaderTop, { passive: true })
        window.addEventListener("resize", updateStickyHeaderTop)

        return () => {
            document.removeEventListener("scroll", updateStickyHeaderTop)
            window.removeEventListener("resize", updateStickyHeaderTop)
        }
    }, [headerVariant])

    const syncHeaderScroll = (scrollLeft: number) => {
        if (headerVariant !== "report" || !headerTableRef.current) return
        rootRef.current?.style.setProperty("--data-table-scroll-left", `${scrollLeft}px`)
        headerTableRef.current.style.transform = `translateX(-${scrollLeft}px)`
    }

    const syncStickyScroll = () => {
        const tableScroll = tableScrollRef.current
        if (tableScroll) {
            syncHeaderScroll(tableScroll.scrollLeft)
        }

        if (!enableStickyHorizontalScroll || isSyncingScrollRef.current) return
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        sticky.scrollLeft = tableScroll.scrollLeft
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }

    const syncTableScroll = () => {
        if (!enableStickyHorizontalScroll || isSyncingScrollRef.current) return
        const tableScroll = tableScrollRef.current
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        tableScroll.scrollLeft = sticky.scrollLeft
        syncHeaderScroll(sticky.scrollLeft)
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,

        columns: enableExpand
            ? [
                {
                    id: "expand",
                    header: "",
                    cell: ({ row }: { row: Row<TData> }) => (
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
            columnSizing,
            rowSelection,
            pagination,
            expanded,
        },

        onExpandedChange: setExpanded,

        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        onPaginationChange,
        enableColumnResizing: enableColumnResize,
        columnResizeMode: "onChange",

        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),

        manualPagination: true,
        pageCount,
    })

    const isReportHeader = headerVariant === "report"
    const visibleLeafColumns = table.getVisibleLeafColumns()
    const visibleColumnIds = visibleLeafColumns.map((column) => column.id).join("|")
    const tableWidth = Math.max(
        visibleLeafColumns.reduce((total, column) => total + column.getSize(), 0),
        table.getTotalSize(),
    )
    const columnLeftOffsets = visibleLeafColumns.reduce<number[]>((offsets, column, index) => {
        offsets[index] = index === 0 ? 0 : offsets[index - 1] + visibleLeafColumns[index - 1].getSize()
        return offsets
    }, [])

    useEffect(() => {
        if (!enableColumnPinning) {
            setPinnedUntilIndex(-1)
            return
        }

        if (defaultPinnedColumnId) {
            const nextIndex = visibleLeafColumns.findIndex((column) => column.id === defaultPinnedColumnId)
            setPinnedUntilIndex(nextIndex >= 0 ? nextIndex : defaultPinnedUntil)
            return
        }

        setPinnedUntilIndex(defaultPinnedUntil)
    }, [enableColumnPinning, defaultPinnedColumnId, defaultPinnedUntil, visibleColumnIds])

    const togglePinnedUntil = (columnIndex: number) => {
        setPinnedUntilIndex((current) => current === columnIndex ? -1 : columnIndex)
    }

    const getPinnedStyle = (
        columnIndex: number,
        section: "header" | "body" | "footer",
    ): React.CSSProperties | undefined => {
        if (!enableColumnPinning || columnIndex > pinnedUntilIndex) return undefined

        const isLastPinned = columnIndex === pinnedUntilIndex
        const gridShadow = "inset -1px 0 0 rgb(226 232 240), inset 0 -1px 0 rgb(226 232 240)"
        const edgeShadow = `${gridShadow}, 8px 0 12px -10px rgba(15, 23, 42, 0.65)`
        const zIndex = section === "header" ? 70 : section === "footer" ? 35 : 25

        return {
            position: "sticky",
            left: columnLeftOffsets[columnIndex] ?? 0,
            zIndex,
            background: section === "header" ? "rgb(241 245 249)" : section === "footer" ? "hsl(var(--muted))" : "#fff",
            boxShadow: isLastPinned ? edgeShadow : gridShadow,
            transform: section === "header" && isReportHeader
                ? "translateX(var(--data-table-scroll-left, 0px))"
                : undefined,
        }
    }

    const renderColGroup = () => (
        <colgroup>
            {visibleLeafColumns.map((column) => (
                <col
                    key={column.id}
                    style={{
                        width: column.getSize(),
                        minWidth: column.columnDef.minSize ?? 72,
                    }}
                />
            ))}
        </colgroup>
    )

    const renderHeaderRows = () => table.getHeaderGroups().map((hg) => (
        <TableRow key={hg.id}>
            {hg.headers.map((header, columnIndex) => {
                const size = header.getSize()
                const minSize = header.column.columnDef.minSize ?? 72
                const isPinned = enableColumnPinning && columnIndex <= pinnedUntilIndex
                const isActivePin = enableColumnPinning && columnIndex === pinnedUntilIndex
                return (
                    <TableHead
                        key={header.id}
                        className={cn(
                            "relative select-none overflow-hidden",
                            enableColumnPinning && !header.isPlaceholder && "group/cell pr-6",
                            isPinned && "bg-slate-100",
                            header.column.columnDef.meta?.className,
                            header.column.columnDef.meta?.thClassName,
                            showCellBorders && "border-b border-r border-slate-200 last:border-r-0",
                            isReportHeader &&
                            "h-12 border-r border-slate-200 bg-slate-100/95 !text-center text-xs font-semibold uppercase tracking-wide text-slate-600 last:border-r-0 [&_*]:!justify-center [&_*]:!text-center",
                        )}
                        style={{
                            width: size,
                            minWidth: minSize,
                            ...getPinnedStyle(columnIndex, "header"),
                        }}
                    >
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        {enableColumnPinning && !header.isPlaceholder ? (
                            <button
                                type="button"
                                aria-label={isActivePin ? "Bo co dinh cot" : "Co dinh den cot nay"}
                                title={isActivePin ? "Bo co dinh cot" : "Co dinh den cot nay"}
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    togglePinnedUntil(columnIndex)
                                }}
                                className={cn(
                                    "absolute right-1 top-1 z-[80] inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/70 transition-opacity hover:bg-white hover:text-primary",
                                    isActivePin ? "bg-primary/10 text-primary opacity-100" : "opacity-0 group-hover/cell:opacity-100 focus:opacity-100",
                                )}
                                data-no-row-click="true"
                            >
                                <Pin className="h-3 w-3" />
                            </button>
                        ) : null}
                        {enableColumnResize && header.column.getCanResize() ? (
                            <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={cn(
                                    "absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none",
                                    "bg-transparent hover:bg-primary/40",
                                    header.column.getIsResizing() && "bg-primary/60",
                                )}
                                data-no-row-click="true"
                            />
                        ) : null}
                    </TableHead>
                )
            })}
        </TableRow>
    ))

    return (
        <div className={cn(
            'min-w-0 max-w-full',
            'flex flex-1 flex-col gap-4',
            className
        )} ref={rootRef}>

            {showToolbar && (
                <DataTableToolbar
                    table={table}
                    searchPlaceholder={searchPlaceholder}
                    keyword={keyword}
                    searchInputClassName={searchInputClassName}
                    onKeywordChange={onKeywordChange}
                    filters={filters}
                />
            )}

            <div className="w-full rounded-md border">
                {isReportHeader ? (
                    <div
                        className="sticky z-40 overflow-hidden border-b bg-slate-100/95 shadow-sm"
                        style={{ top: stickyHeaderTop }}
                    >
                        <table
                            ref={headerTableRef}
                            className="w-max min-w-full table-fixed caption-bottom text-sm"
                            style={{ width: tableWidth, minWidth: tableWidth }}
                        >
                            {renderColGroup()}
                            <thead className="bg-slate-100/95">
                                {renderHeaderRows()}
                            </thead>
                        </table>
                    </div>
                ) : null}

                <div
                    ref={tableScrollRef}
                    onScroll={syncStickyScroll}
                    className='w-full overflow-x-auto'
                >
                    <Table className='w-max min-w-full table-fixed' style={{ width: tableWidth, minWidth: tableWidth }}>
                        {renderColGroup()}
                        {!isReportHeader ? (
                            <TableHeader>
                                {renderHeaderRows()}
                            </TableHeader>
                        ) : null}

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            <>
                                {table.getRowModel().rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <TableRow
                                            className={cn(
                                                onRowClick && "cursor-pointer hover:bg-muted/40"
                                            )}
                                            onClick={(event) => {
                                                if (!onRowClick) {
                                                    return
                                                }

                                                const target = event.target
                                                if (
                                                    target instanceof HTMLElement &&
                                                    target.closest("button,a,input,select,textarea,[role='menuitem'],[data-no-row-click='true']")
                                                ) {
                                                    return
                                                }

                                                onRowClick(row.original)
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell, columnIndex) => {
                                                const size = cell.column.getSize()
                                                const minSize = cell.column.columnDef.minSize ?? 72
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            columnIndex <= pinnedUntilIndex && enableColumnPinning && "overflow-hidden bg-white",
                                                            showCellBorders && "border-b border-r border-slate-200 last:border-r-0",
                                                            cell.column.columnDef.meta?.tdClassName,
                                                        )}
                                                        style={{
                                                            width: size,
                                                            minWidth: minSize,
                                                            ...getPinnedStyle(columnIndex, "body"),
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
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
                                        {table.getVisibleLeafColumns().map((col, columnIndex) => {
                                            const footerFn = col.columnDef.meta?.footer
                                            return (
                                                <TableCell
                                                    key={col.id}
                                                    className={cn(
                                                        columnIndex <= pinnedUntilIndex && enableColumnPinning && "overflow-hidden bg-muted",
                                                        showCellBorders && "border-b border-r border-slate-200 last:border-r-0",
                                                        col.columnDef.meta?.tdClassName,
                                                    )}
                                                    style={{
                                                        width: col.getSize(),
                                                        minWidth: col.columnDef.minSize ?? 72,
                                                        ...getPinnedStyle(columnIndex, "footer"),
                                                    }}
                                                >
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
            </div>

            {enableStickyHorizontalScroll && stickyScroll.visible ? (
                <div
                    ref={stickyScrollRef}
                    onScroll={syncTableScroll}
                    className="sticky bottom-0 z-30 -mt-2 w-full overflow-x-auto border-x border-t bg-background/95 py-1 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
                    style={{ maxWidth: stickyScroll.viewportWidth || undefined }}
                    data-no-row-click="true"
                >
                    <div style={{ width: stickyScroll.contentWidth, height: 1 }} />
                </div>
            ) : null}

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
