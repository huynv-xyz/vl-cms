import type React from "react"
import type { ReactElement } from "react"
import { Children, Fragment, cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react"
import { Pin } from "lucide-react"

import { cn } from "@/lib/utils"

type StickyReportTableProps = {
    className?: string
    tableClassName?: string
    headerClassName?: string
    columnWidths: number[]
    renderHeader: () => React.ReactNode
    renderBody: () => React.ReactNode
    renderFooter?: () => React.ReactNode
    enableColumnResize?: boolean
    minColumnWidth?: number
    defaultPinnedUntil?: number
}

export function StickyReportTable({
    className,
    tableClassName,
    headerClassName,
    columnWidths,
    renderHeader,
    renderBody,
    renderFooter,
    enableColumnResize = true,
    minColumnWidth = 56,
    defaultPinnedUntil = -1,
}: StickyReportTableProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const tableScopeClassName = `sticky-report-table-${generatedId}`
    const tableScrollRef = useRef<HTMLDivElement | null>(null)
    const headerWrapperRef = useRef<HTMLDivElement | null>(null)
    const headerTableRef = useRef<HTMLTableElement | null>(null)
    const resizeLayerRef = useRef<HTMLDivElement | null>(null)
    const stickyScrollRef = useRef<HTMLDivElement | null>(null)
    const isSyncingScrollRef = useRef(false)
    const latestHorizontalScrollLeftRef = useRef(0)
    const horizontalScrollFrameRef = useRef<number | null>(null)
    const [widths, setWidths] = useState(() => columnWidths)
    const tableWidth = widths.reduce((total, width) => total + width, 0)
    const [pinnedUntilIndex, setPinnedUntilIndex] = useState(defaultPinnedUntil)
    const [horizontalScrollLeft, setHorizontalScrollLeft] = useState(0)
    const [stickyHeaderTop, setStickyHeaderTop] = useState(64)
    const [fixedHeader, setFixedHeader] = useState({
        active: false,
        left: 0,
        width: 0,
        height: 0,
    })
    const [stickyScroll, setStickyScroll] = useState({
        visible: false,
        contentWidth: tableWidth,
        viewportWidth: 0,
    })
    const [fixedScroll, setFixedScroll] = useState({
        active: false,
        left: 0,
        width: 0,
    })

    useEffect(() => {
        setWidths((current) => {
            if (current.length === columnWidths.length) {
                return current
            }
            return columnWidths
        })
    }, [columnWidths])

    useEffect(() => {
        setPinnedUntilIndex(defaultPinnedUntil)
    }, [defaultPinnedUntil])

    const columnOffsets = useMemo(() => {
        let left = 0
        return widths.map((width) => {
            const offset = left
            left += width
            return offset
        })
    }, [widths])

    const pinnedBodyColumnStyles = useMemo(() => {
        if (pinnedUntilIndex < 0) return ""
        const lastPinnedIndex = Math.min(pinnedUntilIndex, widths.length - 1)
        const rules: string[] = []
        for (let index = 0; index <= lastPinnedIndex; index += 1) {
            const column = index + 1
            const isEdge = index === lastPinnedIndex
            const gridShadow = "inset -1px 0 0 rgb(226 232 240), inset 0 -1px 0 rgb(226 232 240)"
            const edgeShadow = `${gridShadow}, 8px 0 12px -10px rgba(15, 23, 42, 0.65)`
            rules.push(`
                .${tableScopeClassName} tbody tr > *:nth-child(${column}) {
                    position: sticky;
                    left: ${columnOffsets[index] || 0}px;
                    z-index: 25;
                    background: #fff;
                    box-shadow: ${isEdge ? edgeShadow : gridShadow};
                }
            `)
        }
        return rules.join("\n")
    }, [columnOffsets, pinnedUntilIndex, tableScopeClassName, widths.length])

    useEffect(() => {
        const updateFixedHeader = () => {
            const appHeader = document.querySelector<HTMLElement>(".header-fixed")
            const headerOffset = appHeader ? Math.max(0, appHeader.getBoundingClientRect().bottom) : 0
            setStickyHeaderTop((current) => current === headerOffset ? current : headerOffset)

            const root = rootRef.current
            const header = headerWrapperRef.current
            if (!root || !header) return

            const rootRect = root.getBoundingClientRect()
            const headerHeight = header.offsetHeight
            const active = rootRect.top <= headerOffset && rootRect.bottom > headerOffset + headerHeight
            const tableScroll = tableScrollRef.current
            const hasHorizontalScroll = tableScroll
                ? tableScroll.scrollWidth > tableScroll.clientWidth + 1
                : false
            const scrollActive = hasHorizontalScroll && rootRect.top < window.innerHeight && rootRect.bottom > 0

            setFixedHeader((current) => {
                const next = {
                    active,
                    left: rootRect.left,
                    width: rootRect.width,
                    height: headerHeight,
                }
                return current.active === next.active &&
                    current.left === next.left &&
                    current.width === next.width &&
                    current.height === next.height
                    ? current
                    : next
            })
            setFixedScroll((current) => {
                const next = {
                    active: scrollActive,
                    left: rootRect.left,
                    width: rootRect.width,
                }
                return current.active === next.active &&
                    current.left === next.left &&
                    current.width === next.width
                    ? current
                    : next
            })
        }

        updateFixedHeader()
        window.addEventListener("scroll", updateFixedHeader, { passive: true, capture: true })
        window.addEventListener("resize", updateFixedHeader)

        const resizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateFixedHeader)
            : null
        if (resizeObserver) {
            if (rootRef.current) resizeObserver.observe(rootRef.current)
            if (headerWrapperRef.current) resizeObserver.observe(headerWrapperRef.current)
        }

        return () => {
            window.removeEventListener("scroll", updateFixedHeader, true)
            window.removeEventListener("resize", updateFixedHeader)
            resizeObserver?.disconnect()
            if (horizontalScrollFrameRef.current !== null) {
                cancelAnimationFrame(horizontalScrollFrameRef.current)
                horizontalScrollFrameRef.current = null
            }
        }
    }, [])

    useEffect(() => {
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
            if (rootRef.current) {
                const rootRect = rootRef.current.getBoundingClientRect()
                const scrollActive = next.visible && rootRect.top < window.innerHeight && rootRect.bottom > 0
                setFixedScroll((current) => {
                    const fixedNext = {
                        active: scrollActive,
                        left: rootRect.left,
                        width: rootRect.width,
                    }
                    return current.active === fixedNext.active &&
                        current.left === fixedNext.left &&
                        current.width === fixedNext.width
                        ? current
                        : fixedNext
                })
            }

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
            const table = tableScroll.querySelector("table")
            if (table) resizeObserver.observe(table)
        }
        window.addEventListener("resize", updateStickyScroll)

        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener("resize", updateStickyScroll)
        }
    }, [tableWidth, widths])

    const syncHeaderScroll = (scrollLeft: number) => {
        const transform = `translateX(-${scrollLeft}px)`
        latestHorizontalScrollLeftRef.current = scrollLeft
        if (rootRef.current) {
            rootRef.current.style.setProperty("--sticky-report-scroll-left", `${scrollLeft}px`)
        }
        if (headerTableRef.current) {
            headerTableRef.current.style.transform = transform
        }
        if (horizontalScrollFrameRef.current === null) {
            horizontalScrollFrameRef.current = requestAnimationFrame(() => {
                horizontalScrollFrameRef.current = null
                const latest = latestHorizontalScrollLeftRef.current
                setHorizontalScrollLeft((current) => current === latest ? current : latest)
            })
        }
    }

    const syncStickyScroll = () => {
        const tableScroll = tableScrollRef.current
        if (tableScroll) {
            syncHeaderScroll(tableScroll.scrollLeft)
        }

        if (isSyncingScrollRef.current) return
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        sticky.scrollLeft = tableScroll.scrollLeft
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }

    const syncTableScroll = () => {
        if (isSyncingScrollRef.current) return
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

    const colgroup = (
        <colgroup>
            {widths.map((width, index) => (
                <col key={index} style={{ width }} />
            ))}
        </colgroup>
    )

    const startColumnResize = (columnIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        if (!enableColumnResize) return
        event.preventDefault()
        event.stopPropagation()

        const startX = event.clientX
        const startWidth = widths[columnIndex] ?? minColumnWidth

        const onMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.max(minColumnWidth, Math.round(startWidth + moveEvent.clientX - startX))
            setWidths((current) => current.map((width, index) => index === columnIndex ? nextWidth : width))
        }

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
            document.body.style.cursor = ""
            document.body.style.userSelect = ""
        }

        document.body.style.cursor = "col-resize"
        document.body.style.userSelect = "none"
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }

    const resizeHandles = enableColumnResize ? (
        <div
            ref={resizeLayerRef}
            className="pointer-events-none absolute inset-y-0 left-0 z-[90]"
            style={{ width: "100%" }}
        >
            {widths.slice(0, -1).map((_width, index) => {
                const boundaryLeft = widths.slice(0, index + 1).reduce((total, width) => total + width, 0)
                const pinnedRight = pinnedUntilIndex >= 0
                    ? (columnOffsets[pinnedUntilIndex] || 0) + (widths[pinnedUntilIndex] || 0)
                    : 0
                const isPinnedHandle = index <= pinnedUntilIndex
                const left = isPinnedHandle
                    ? boundaryLeft
                    : boundaryLeft - horizontalScrollLeft
                if (!isPinnedHandle && (left < pinnedRight || left < 0)) return null
                return (
                    <div
                        key={index}
                        className="pointer-events-auto absolute top-0 z-[95] h-full w-2 -translate-x-1 cursor-col-resize touch-none select-none hover:bg-primary/25"
                        style={{ left }}
                        onMouseDown={(event) => startColumnResize(index, event)}
                    />
                )
            })}
        </div>
    ) : null

    const togglePinnedUntil = (columnIndex: number) => {
        setPinnedUntilIndex((current) => current === columnIndex ? -1 : columnIndex)
    }

    const applyPinnedCell = (
        cell: React.ReactElement<any>,
        columnIndex: number,
        section: "header" | "body" | "footer",
        canPin: boolean,
        pinTargetIndex = columnIndex,
    ) => {
        const isPinned = pinnedUntilIndex >= 0 && columnIndex <= pinnedUntilIndex
        const isPinnedEdge = isPinned && pinTargetIndex === pinnedUntilIndex
        const isActivePin = pinnedUntilIndex === pinTargetIndex
        const gridShadow = "inset -1px 0 0 rgb(226 232 240), inset 0 -1px 0 rgb(226 232 240)"
        const previousClassName = cell.props.className
        const previousStyle = cell.props.style || {}
        const pinnedStyle = isPinned && section !== "body"
            ? {
                position: "sticky" as const,
                left: columnOffsets[columnIndex] || 0,
                transform: section === "header" ? "translateX(var(--sticky-report-scroll-left, 0px))" : undefined,
                zIndex: section === "header" ? 70 : section === "footer" ? 35 : 25,
                background: section === "header" ? "rgb(241 245 249)" : section === "footer" ? "hsl(var(--muted))" : "#fff",
                boxShadow: isPinnedEdge ? `${gridShadow}, 8px 0 12px -10px rgba(15,23,42,0.65)` : gridShadow,
            }
            : {}
        const pinButton = section === "header" && canPin ? (
            <button
                type="button"
                title={pinnedUntilIndex === pinTargetIndex ? "Bỏ cố định cột" : "Cố định đến cột này"}
                aria-label={pinnedUntilIndex === pinTargetIndex ? "Bỏ cố định cột" : "Cố định đến cột này"}
                className={cn(
                    "absolute right-1 top-1 z-[80] inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/70 transition-opacity hover:bg-white hover:text-primary",
                    isActivePin ? "bg-primary/10 text-primary opacity-100" : "opacity-0 group-hover/cell:opacity-100 focus:opacity-100",
                )}
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    togglePinnedUntil(pinTargetIndex)
                }}
            >
                <Pin className="h-3 w-3" />
            </button>
        ) : null

        return {
            ...cell.props,
            className: cn(
                previousClassName,
                canPin && section === "header" && "group/cell relative pr-6",
                isPinned && section === "header" && "bg-slate-100",
                isPinned && section === "body" && "bg-white",
                isPinned && section === "footer" && "bg-muted",
                isPinnedEdge && section !== "header" && "shadow-[8px_0_12px_-10px_rgba(15,23,42,0.65)]",
            ),
            style: {
                ...previousStyle,
                ...pinnedStyle,
            },
            children: pinButton ? (
                <>
                    {cell.props.children}
                    {pinButton}
                </>
            ) : cell.props.children,
        }
    }

    const enhanceRows = (node: React.ReactNode, section: "header" | "body" | "footer") => {
        const occupancyEnd: number[] = []
        let rowIndex = 0

        const enhanceNode = (target: React.ReactNode): React.ReactNode => {
            return Children.map(target, (child) => {
                if (!isValidElement(child)) return child
                const row = child as ReactElement<any>

                if (row.type === Fragment) {
                    return <>{enhanceNode(row.props.children)}</>
                }

                if (row.type !== "tr") {
                    return row
                }

                let columnIndex = 0
                const nextChildren = Children.map(row.props.children, (cell) => {
                    if (!isValidElement(cell)) return cell
                    const tableCell = cell as ReactElement<any>

                    while ((occupancyEnd[columnIndex] || 0) > rowIndex) {
                        columnIndex += 1
                    }

                    const colSpan = Number(tableCell.props.colSpan || 1)
                    const rowSpan = Number(tableCell.props.rowSpan || 1)
                    const startColumn = columnIndex

                    if (rowSpan > 1) {
                        for (let offset = 0; offset < colSpan; offset += 1) {
                            occupancyEnd[startColumn + offset] = rowIndex + rowSpan
                        }
                    }
                    columnIndex += colSpan

                    const endColumn = startColumn + colSpan - 1
                    const isHeader = section === "header"
                    const isGroupHeader = colSpan > 1
                    const isTopHeaderCell = rowIndex === 0
                    const isRowSpanningLeaf = rowSpan > 1
                    const pinTargetIndex = isGroupHeader ? Math.min(endColumn, widths.length - 1) : startColumn
                    const edgeTargetIndex = section === "header" ? pinTargetIndex : endColumn
                    const isFullyPinned = pinnedUntilIndex >= 0 && endColumn <= pinnedUntilIndex
                    const isFooterCrossingPinnedEdge = section === "footer" &&
                        pinnedUntilIndex >= 0 &&
                        startColumn <= pinnedUntilIndex &&
                        endColumn > pinnedUntilIndex
                    const canPin = isHeader && startColumn < widths.length && (
                        isGroupHeader || isRowSpanningLeaf || (isTopHeaderCell && colSpan === 1)
                    )
                    const shouldApplyPinnedStyle = isFullyPinned || isFooterCrossingPinnedEdge || canPin
                    if (!shouldApplyPinnedStyle) return tableCell

                    if (isFooterCrossingPinnedEdge) {
                        const pinnedColSpan = pinnedUntilIndex - startColumn + 1
                        const remainingColSpan = colSpan - pinnedColSpan
                        const pinnedCell = cloneElement(tableCell, {
                            ...applyPinnedCell(
                                cloneElement(tableCell, {
                                    ...tableCell.props,
                                    colSpan: pinnedColSpan,
                                }),
                                startColumn,
                                section,
                                canPin,
                                pinnedUntilIndex,
                            ),
                            key: `${tableCell.key ?? `${rowIndex}-${startColumn}`}-pinned`,
                            colSpan: pinnedColSpan,
                        })
                        const remainingCell = cloneElement(tableCell, {
                            ...tableCell.props,
                            key: `${tableCell.key ?? `${rowIndex}-${startColumn}`}-remaining`,
                            colSpan: remainingColSpan,
                            children: null,
                            className: cn(tableCell.props.className, "text-transparent"),
                        })

                        return (
                            <>
                                {pinnedCell}
                                {remainingCell}
                            </>
                        )
                    }

                    return cloneElement(tableCell, applyPinnedCell(tableCell, startColumn, section, canPin, edgeTargetIndex))
                })

                rowIndex += 1
                return cloneElement(row, { ...row.props, children: nextChildren })
            })
        }

        return enhanceNode(node)
    }

    const enhancedHeader = enhanceRows(renderHeader(), "header")
    const enhancedBody = enhanceRows(renderBody(), "body")
    const enhancedFooter = renderFooter ? enhanceRows(renderFooter(), "footer") : null

    return (
        <div ref={rootRef} className={cn(tableScopeClassName, "rounded-md border bg-white", className)}>
            {pinnedBodyColumnStyles ? <style>{pinnedBodyColumnStyles}</style> : null}
            {fixedHeader.active ? <div style={{ height: fixedHeader.height }} /> : null}
            <div
                ref={headerWrapperRef}
                className="relative z-40 overflow-hidden border-b bg-slate-100 shadow-sm"
                style={fixedHeader.active
                    ? {
                        position: "fixed",
                        top: stickyHeaderTop,
                        left: fixedHeader.left,
                        width: fixedHeader.width,
                    }
                    : undefined}
            >
                <table
                    ref={headerTableRef}
                    className={cn("table-fixed whitespace-nowrap text-sm", tableClassName)}
                    style={{ width: tableWidth, minWidth: tableWidth }}
                >
                    {colgroup}
                    <thead className={cn("border-b bg-slate-100 text-xs text-muted-foreground", headerClassName)}>
                        {enhancedHeader}
                    </thead>
                </table>
                {resizeHandles}
            </div>

            <div
                ref={tableScrollRef}
                onScroll={syncStickyScroll}
                className="w-full overflow-x-auto bg-white"
            >
                <table
                    className={cn("table-fixed whitespace-nowrap text-sm", tableClassName)}
                    style={{ width: tableWidth, minWidth: tableWidth }}
                >
                    {colgroup}
                    <tbody>
                        {enhancedBody}
                    </tbody>
                    {renderFooter ? <tfoot className="bg-muted/40 border-t font-semibold">{enhancedFooter}</tfoot> : null}
                </table>
            </div>

            {stickyScroll.visible ? (
                <div
                    ref={stickyScrollRef}
                    onScroll={syncTableScroll}
                    className="z-30 w-full overflow-x-auto border-t bg-background/95 py-1 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
                    style={fixedScroll.active
                        ? {
                            position: "fixed",
                            bottom: 0,
                            left: fixedScroll.left,
                            width: fixedScroll.width,
                            maxWidth: fixedScroll.width,
                        }
                        : {
                            position: "sticky",
                            bottom: 0,
                            maxWidth: stickyScroll.viewportWidth || undefined,
                        }}
                >
                    <div style={{ width: stickyScroll.contentWidth, height: 1 }} />
                </div>
            ) : null}
        </div>
    )
}
