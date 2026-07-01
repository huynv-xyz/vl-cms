import type React from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type StickyReportTableProps = {
    className?: string
    tableClassName?: string
    headerClassName?: string
    columnWidths: number[]
    renderHeader: () => React.ReactNode
    renderBody: () => React.ReactNode
    renderFooter?: () => React.ReactNode
}

export function StickyReportTable({
    className,
    tableClassName,
    headerClassName,
    columnWidths,
    renderHeader,
    renderBody,
    renderFooter,
}: StickyReportTableProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const tableScrollRef = useRef<HTMLDivElement | null>(null)
    const headerWrapperRef = useRef<HTMLDivElement | null>(null)
    const headerTableRef = useRef<HTMLTableElement | null>(null)
    const stickyScrollRef = useRef<HTMLDivElement | null>(null)
    const isSyncingScrollRef = useRef(false)
    const tableWidth = columnWidths.reduce((total, width) => total + width, 0)
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
    }, [tableWidth, columnWidths])

    const syncHeaderScroll = (scrollLeft: number) => {
        if (!headerTableRef.current) return
        headerTableRef.current.style.transform = `translateX(-${scrollLeft}px)`
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
            {columnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
            ))}
        </colgroup>
    )

    return (
        <div ref={rootRef} className={cn("rounded-md border bg-white", className)}>
            {fixedHeader.active ? <div style={{ height: fixedHeader.height }} /> : null}
            <div
                ref={headerWrapperRef}
                className="z-40 overflow-hidden border-b bg-slate-100 shadow-sm"
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
                        {renderHeader()}
                    </thead>
                </table>
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
                        {renderBody()}
                    </tbody>
                    {renderFooter ? <tfoot className="bg-muted/40 border-t font-semibold">{renderFooter()}</tfoot> : null}
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
