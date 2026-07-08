import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowUpRight, Copy, Download, Loader2, Plus, Scale, Upload, WalletCards } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import {
    createArLedger,
    deleteArLedger,
    getArLedgerTotals,
    importBankArLedgers,
    importOpeningArLedgers,
    listArLedgers,
    updateArLedger,
    type ArLedgerListParams,
} from "@/api/sale/ar-ledger"
import { getCustomerAlias, listCustomerAliases, type CustomerAlias } from "@/api/customer-alias"
import { getCustomer, listCustomers } from "@/api/customer"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { cn } from "@/lib/utils"
import { exportXlsx } from "@/lib/xlsx-export"
import type { ArLedger } from "../../ar-ledger/data/schema"

type Filters = {
    from_date?: string
    to_date?: string
    customer_id?: number
}

type Props = {
    sourceType?: "BANK" | "ADJUST" | "OPENING"
    title?: string
    createLabel?: string
    emptyText?: string
    descriptionPlaceholder?: string
    data: ArLedger[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
    actionsPortalId?: string
}

type FormState = {
    id?: number
    posting_date: string
    doc_date: string
    doc_no: string
    alias_id?: number
    customer_id?: number
    customer_name?: string
    direction: "IN" | "OUT"
    amount: string
    account_code: string
    description: string
}

type ImportErrorRow = {
    row: string
    message: string
}

type ImportErrorDialog = {
    title: string
    summary: string
    errors: ImportErrorRow[]
}

const emptyForm = (): FormState => ({
    posting_date: new Date().toISOString().slice(0, 10),
    doc_date: new Date().toISOString().slice(0, 10),
    doc_no: "",
    alias_id: undefined,
    customer_id: undefined,
    customer_name: "",
    direction: "IN",
    amount: "",
    account_code: "131",
    description: "",
})

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

const BANK_IMPORT_REQUIRED_COLUMNS = [
    "Ngày hạch toán",
    "Ngày chứng từ",
    "Số chứng từ",
    "Mã đối tượng",
    "Tên đối tượng",
    "Diễn giải",
    "TK đối ứng",
    "Thu",
    "Chi",
]

const CASH_BANK_COLUMNS = [
    { key: "stt", width: 60, minWidth: 52 },
    { key: "date", width: 130, minWidth: 110 },
    { key: "doc", width: 180, minWidth: 140 },
    { key: "customer_code", width: 190, minWidth: 150 },
    { key: "customer_name", width: 260, minWidth: 190 },
    { key: "description", width: 420, minWidth: 260 },
    { key: "account", width: 130, minWidth: 110 },
    { key: "incoming", width: 170, minWidth: 140 },
    { key: "outgoing", width: 170, minWidth: 140 },
    { key: "actions", width: 96, minWidth: 90 },
]

export function CashBankLedgerTable({
    sourceType = "BANK",
    title = "Giao dịch ngân hàng",
    createLabel = "Thêm giao dịch",
    emptyText = "Không có giao dịch ngân hàng.",
    descriptionPlaceholder = "Nội dung giao dịch ngân hàng",
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
    actionsPortalId,
}: Props) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [filterAliasId, setFilterAliasId] = useState<number | undefined>(undefined)
    const [exporting, setExporting] = useState(false)
    const [bankImportGuideOpen, setBankImportGuideOpen] = useState(false)
    const [importErrorDialog, setImportErrorDialog] = useState<ImportErrorDialog | null>(null)
    const [columnWidths, setColumnWidths] = useState<number[]>(() => CASH_BANK_COLUMNS.map((column) => column.width))
    const tableWidth = columnWidths.reduce((total, width) => total + width, 0)
    const tableScrollRef = useRef<HTMLDivElement>(null)
    const stickyScrollRef = useRef<HTMLDivElement>(null)
    const headerTableRef = useRef<HTMLTableElement>(null)
    const isSyncingScrollRef = useRef(false)
    const [stickyScroll, setStickyScroll] = useState({
        visible: false,
        contentWidth: 0,
        viewportWidth: 0,
    })
    const [stickyHeaderTop, setStickyHeaderTop] = useState(64)
    const [actionsHost, setActionsHost] = useState<HTMLElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const incomingLabel = sourceType === "OPENING"
        ? "Có đầu kỳ"
        : sourceType === "ADJUST" ? "Giảm nợ" : "Tiền vào"
    const outgoingLabel = sourceType === "OPENING"
        ? "Nợ đầu kỳ"
        : sourceType === "ADJUST" ? "Tăng nợ" : "Tiền ra"
    const today = todayYmd()
    const shouldConstrainDateFilters = sourceType === "ADJUST"
    const useCustomerSelector = sourceType !== "BANK"
    const canExport = true

    const totalsQuery = useQuery({
        queryKey: [
            "ar-ledgers",
            "totals",
            sourceType,
            keyword,
            filters.from_date,
            filters.to_date,
            filters.customer_id,
        ],
        queryFn: () =>
            getArLedgerTotals({
                keyword: keyword || undefined,
                source_type: sourceType,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                customer_id: filters.customer_id,
            }),
    })

    const totalsData = totalsQuery.isError || totalsQuery.isRefetchError
        ? undefined
        : totalsQuery.data

    const totals = {
        incoming: Number(totalsData?.credit_amount || 0),
        outgoing: Number(totalsData?.debit_amount || 0),
        net: Number(totalsData?.credit_amount || 0) - Number(totalsData?.debit_amount || 0),
    }

    const saveMutation = useMutation({
        mutationFn: async () => {
            const amount = Number(form.amount || 0)
            if (!form.customer_id) throw new Error("Vui lòng chọn khách hàng")
            if (!amount || amount <= 0) throw new Error("Số tiền phải > 0")

            const payload: Partial<ArLedger> = {
                id: form.id ?? 0,
                posting_date: form.posting_date,
                doc_date: form.doc_date,
                doc_no: form.doc_no || `${sourceType}-${Date.now()}`,
                customer_id: form.customer_id,
                customer_name: form.customer_name,
                description: form.description,
                account_code: form.account_code.trim() || "131",
                debit_amount: form.direction === "OUT" ? amount : 0,
                credit_amount: form.direction === "IN" ? amount : 0,
                source_type: sourceType as any,
                source_id: form.id,
                line_type: sourceType === "OPENING"
                    ? "OPENING"
                    : sourceType === "ADJUST" ? "ADJUST" : "PAYMENT",
            }

            return form.id
                ? updateArLedger(payload as ArLedger)
                : createArLedger(payload)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] })
            toast.success(form.id ? "Đã cập nhật giao dịch" : "Đã tạo giao dịch")
            setOpen(false)
            setForm(emptyForm())
        },
        onError: (error: any) => toast.error(error?.message || "Lưu giao dịch thất bại"),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteArLedger(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] })
            toast.success("Đã xóa giao dịch")
        },
        onError: () => toast.error("Xóa giao dịch thất bại"),
    })

    const importMutation = useMutation({
        mutationFn: (file: File) =>
            sourceType === "OPENING" ? importOpeningArLedgers(file) : importBankArLedgers(file),
        onSuccess: async (count) => {
            await queryClient.invalidateQueries({ queryKey: ["ar-ledgers"] })
            setImportErrorDialog(null)
            resetImportInput()
            toast.success(
                sourceType === "OPENING"
                    ? `Đã import ${count} số dư đầu kỳ`
                    : `Đã import ${count} giao dịch ngân hàng`,
            )
        },
        onError: (error: any) => {
            resetImportInput()
            const parsed = parseImportErrorMessage(error?.message)
            setImportErrorDialog({
                title: sourceType === "OPENING" ? "Lỗi import nợ đầu kỳ" : "Lỗi import giao dịch ngân hàng",
                summary: parsed.summary,
                errors: parsed.errors,
            })
            toast.error("Import Excel thất bại, kiểm tra chi tiết trong hộp thoại lỗi")
        },
    })

    const openCreate = () => {
        setForm(emptyForm())
        setOpen(true)
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const rows = await fetchAllRows({
                page: 1,
                size: 200,
                keyword: keyword || undefined,
                source_type: sourceType,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                customer_id: filters.customer_id,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportLedgerXlsx(rows, {
                incomingLabel,
                outgoingLabel,
                period: periodLabel(filters.from_date, filters.to_date),
                sourceType,
            })
            toast.success(
                sourceType === "OPENING"
                    ? `Đã xuất ${rows.length} dòng nợ đầu kỳ`
                    : sourceType === "ADJUST"
                        ? `Đã xuất ${rows.length} dòng điều chỉnh công nợ`
                        : `Đã xuất ${rows.length} dòng giao dịch ngân hàng`,
            )
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất báo cáo thất bại")
        } finally {
            setExporting(false)
        }
    }

    const buildFormFromRow = (row: ArLedger, mode: "edit" | "clone"): FormState => {
        const debit = Number(row.debit_amount || 0)
        const credit = Number(row.credit_amount || 0)
        return {
            id: mode === "edit" ? row.id : undefined,
            posting_date: dateOnly(row.posting_date) || new Date().toISOString().slice(0, 10),
            doc_date: dateOnly(row.doc_date) || dateOnly(row.posting_date) || new Date().toISOString().slice(0, 10),
            doc_no: row.doc_no || "",
            alias_id: undefined,
            customer_id: row.customer_id,
            customer_name: row.customer?.name || row.customer_name || "",
            direction: debit > 0 ? "OUT" : "IN",
            amount: String(debit > 0 ? debit : credit),
            account_code: row.account_code || "131",
            description: row.description || "",
        }
    }

    const openEdit = (row: ArLedger) => {
        setForm(buildFormFromRow(row, "edit"))
        setOpen(true)
    }

    const openClone = (row: ArLedger) => {
        setForm(buildFormFromRow(row, "clone"))
        setOpen(true)
    }

    const setFilter = (key: keyof Filters, value: unknown) =>
        onFiltersChange({ ...filters, [key]: value })

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const startColumnResize = (columnIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const startX = event.clientX
        const startWidth = columnWidths[columnIndex] ?? CASH_BANK_COLUMNS[columnIndex].width
        const minWidth = CASH_BANK_COLUMNS[columnIndex].minWidth

        const onMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.max(minWidth, startWidth + moveEvent.clientX - startX)
            setColumnWidths((current) => current.map((width, index) => index === columnIndex ? nextWidth : width))
        }
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }

        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }

    const renderHeaderRow = () => (
        <tr>
            <ReportTh resizeIndex={0} onResizeStart={startColumnResize}>STT</ReportTh>
            <ReportTh resizeIndex={1} onResizeStart={startColumnResize}>Ngày</ReportTh>
            <ReportTh resizeIndex={2} onResizeStart={startColumnResize}>Chứng từ</ReportTh>
            <ReportTh resizeIndex={3} onResizeStart={startColumnResize}>Mã KH</ReportTh>
            <ReportTh resizeIndex={4} onResizeStart={startColumnResize}>Khách hàng</ReportTh>
            <ReportTh resizeIndex={5} onResizeStart={startColumnResize}>Diễn giải</ReportTh>
            <ReportTh resizeIndex={6} onResizeStart={startColumnResize}>TK đối ứng</ReportTh>
            <ReportTh resizeIndex={7} onResizeStart={startColumnResize}>{incomingLabel}</ReportTh>
            <ReportTh resizeIndex={8} onResizeStart={startColumnResize}>{outgoingLabel}</ReportTh>
            <ReportTh resizeIndex={9} onResizeStart={startColumnResize}>Thao tác</ReportTh>
        </tr>
    )

    useEffect(() => {
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
    }, [])

    useEffect(() => {
        if (!actionsPortalId) {
            setActionsHost(null)
            return
        }

        setActionsHost(document.getElementById(actionsPortalId))
    }, [actionsPortalId])

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

            if (stickyScrollRef.current) {
                stickyScrollRef.current.scrollLeft = tableScroll.scrollLeft
            }
            if (headerTableRef.current) {
                headerTableRef.current.style.transform = `translateX(-${tableScroll.scrollLeft}px)`
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
    }, [tableWidth, data.length])

    const syncStickyScroll = () => {
        if (isSyncingScrollRef.current) return
        const tableScroll = tableScrollRef.current
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        sticky.scrollLeft = tableScroll.scrollLeft
        if (headerTableRef.current) {
            headerTableRef.current.style.transform = `translateX(-${tableScroll.scrollLeft}px)`
        }
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
        if (headerTableRef.current) {
            headerTableRef.current.style.transform = `translateX(-${sticky.scrollLeft}px)`
        }
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }

    const resetImportInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const openImportPicker = () => {
        resetImportInput()
        if (sourceType === "BANK") {
            setBankImportGuideOpen(true)
            return
        }

        fileInputRef.current?.click()
    }

    const chooseBankImportFile = () => {
        resetImportInput()
        setBankImportGuideOpen(false)
        window.setTimeout(() => fileInputRef.current?.click(), 0)
    }

    const copyImportErrors = async () => {
        if (!importErrorDialog) return
        const text = [
            importErrorDialog.summary,
            ...importErrorDialog.errors.map((error) => `${error.row}: ${error.message}`),
        ].filter(Boolean).join("\n")
        await navigator.clipboard.writeText(text)
        toast.success("Đã copy danh sách lỗi")
    }

    const actionButtons = (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {sourceType === "BANK" || sourceType === "OPENING" ? (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) importMutation.mutate(file)
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={importMutation.isPending}
                        onClick={openImportPicker}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {importMutation.isPending ? "Đang import..." : "Import Excel"}
                    </Button>
                </>
            ) : null}
            {canExport ? (
                <Button type="button" onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Xuất Excel
                </Button>
            ) : null}
            <Button type="button" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {createLabel}
            </Button>
        </div>
    )

    return (
        <div className="space-y-4">
            {actionsPortalId && actionsHost ? createPortal(actionButtons, actionsHost) : null}
            <div className="rounded-lg border bg-white shadow-sm">
                {!actionsPortalId ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <WalletCards className="h-4 w-4 text-slate-500" />
                        {title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {sourceType === "BANK" || sourceType === "OPENING" ? (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        if (file) importMutation.mutate(file)
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={importMutation.isPending}
                                    onClick={openImportPicker}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {importMutation.isPending ? "Đang import..." : "Import Excel"}
                                </Button>
                            </>
                        ) : null}
                        {canExport ? (
                            <Button type="button" onClick={handleExport} disabled={exporting}>
                                {exporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Xuất Excel
                            </Button>
                        ) : null}
                        <Button type="button" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {createLabel}
                        </Button>
                    </div>
                </div>
                ) : null}

                <div className="p-3">
                    <div className="grid w-full gap-2 xl:grid-cols-[minmax(280px,1.35fr)_minmax(300px,1.3fr)_minmax(170px,0.75fr)_minmax(170px,0.75fr)]">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm chứng từ, khách hàng, nội dung..."
                            wrapperClassName="relative h-10 min-w-0"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-0 py-0")}
                            value={useCustomerSelector ? filters.customer_id : filterAliasId}
                            onChange={(value: number | undefined, option: any) => {
                                if (useCustomerSelector) {
                                    setFilter("customer_id", value || undefined)
                                    return
                                }
                                setFilterAliasId(value || undefined)
                                setFilter("customer_id", option?.raw?.customer_id || undefined)
                            }}
                            placeholder={useCustomerSelector ? "Khách hàng" : "Mã KH chứng từ"}
                            dataSource={useCustomerSelector
                                ? {
                                    getList: listCustomers,
                                    getById: getCustomer,
                                    params: { page: 1, size: 20, keyword_scope: "code_name" },
                                }
                                : {
                                    getList: listCustomerAliases,
                                    getById: getCustomerAlias,
                                    params: { page: 1, size: 20 },
                                }}
                            mapOption={useCustomerSelector ? customerOption : aliasCustomerOption}
                        />
                        <DatePicker
                            className={cn(
                                "h-10 min-w-0",
                                "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            placeholder="Từ ngày"
                            disabled={shouldConstrainDateFilters
                                ? (date) => {
                                    const value = dateToYmd(date)
                                    return value > today || Boolean(filters.to_date && value > filters.to_date)
                                }
                                : undefined}
                        />
                        <DatePicker
                            className={cn(
                                "h-10 min-w-0",
                                "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            placeholder="Đến ngày"
                            disabled={shouldConstrainDateFilters
                                ? (date) => {
                                    const value = dateToYmd(date)
                                    return Boolean(filters.from_date && value < filters.from_date)
                                }
                                : undefined}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
                <Summary icon={ArrowDownLeft} label={incomingLabel} value={formatMoney(totals.incoming)} tone="credit" />
                <Summary icon={ArrowUpRight} label={sourceType === "BANK" ? "Tiền ra / hoàn" : outgoingLabel} value={formatMoney(totals.outgoing)} tone="debit" />
                <Summary icon={Scale} label="Chênh lệch" value={formatMoney(totals.net)} tone={totals.net >= 0 ? "credit" : "debit"} />
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
                <div
                    className="sticky z-40 overflow-hidden rounded-t-lg border-b bg-slate-50 shadow-sm"
                    style={{ top: stickyHeaderTop }}
                >
                    <table
                        ref={headerTableRef}
                        className="table-fixed border-collapse text-sm"
                        style={{ width: tableWidth, minWidth: tableWidth }}
                    >
                        <colgroup>
                            {columnWidths.map((width, index) => (
                                <col key={CASH_BANK_COLUMNS[index].key} style={{ width }} />
                            ))}
                        </colgroup>
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            {renderHeaderRow()}
                        </thead>
                    </table>
                </div>

                <div ref={tableScrollRef} onScroll={syncStickyScroll} className="w-full overflow-x-auto">
                    <table
                        className="table-fixed border-collapse text-sm"
                        style={{ width: tableWidth, minWidth: tableWidth }}
                    >
                        <colgroup>
                            {columnWidths.map((width, index) => (
                                <col key={CASH_BANK_COLUMNS[index].key} style={{ width }} />
                            ))}
                        </colgroup>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <ReportTd colSpan={10} className="py-12 text-center text-sm text-slate-500">
                                        {emptyText}
                                    </ReportTd>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50">
                                        <ReportTd className="text-center text-xs text-slate-500">
                                            {pagination.pageIndex * pagination.pageSize + index + 1}
                                        </ReportTd>
                                        <ReportTd className="text-center text-slate-700">
                                            {formatDate(row.posting_date)}
                                        </ReportTd>
                                        <ReportTd className="text-center font-mono text-xs font-semibold text-sky-700">
                                            {row.doc_no || `#${row.id}`}
                                        </ReportTd>
                                        <ReportTd className="text-center font-mono text-xs font-semibold text-slate-700">
                                            {row.customer?.code || `#${row.customer_id}`}
                                        </ReportTd>
                                        <ReportTd className="font-medium text-slate-950">
                                            {row.customer?.name || row.customer_name || "-"}
                                        </ReportTd>
                                        <ReportTd className="text-slate-700">
                                            {row.description || "-"}
                                        </ReportTd>
                                        <ReportTd className="text-center font-mono text-xs font-semibold text-slate-700">
                                            {row.account_code || "-"}
                                        </ReportTd>
                                        <ReportTd className="text-right font-semibold tabular-nums text-emerald-700">
                                            {formatMoney(row.credit_amount)}
                                        </ReportTd>
                                        <ReportTd className="text-right font-semibold tabular-nums text-rose-700">
                                            {formatMoney(row.debit_amount)}
                                        </ReportTd>
                                        <ReportTd className="text-center">
                                            <CrudRowActions
                                                row={row}
                                                onEdit={openEdit}
                                                extraActions={sourceType === "ADJUST"
                                                    ? (item) => (
                                                        <DropdownMenuItem onClick={() => openClone(item)}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Nh?n b?n
                                                        </DropdownMenuItem>
                                                    )
                                                    : undefined}
                                                onDelete={async (item) => {
                                                    await deleteMutation.mutateAsync(item.id)
                                                }}
                                            />
                                        </ReportTd>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {stickyScroll.visible ? (
                    <div
                        ref={stickyScrollRef}
                        onScroll={syncTableScroll}
                        className="sticky bottom-0 z-30 w-full overflow-x-auto border-t bg-background/95 py-1 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
                        style={{ maxWidth: stickyScroll.viewportWidth || undefined }}
                    >
                        <div style={{ width: stickyScroll.contentWidth, height: 1 }} />
                    </div>
                ) : null}
            </div>

            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                <CardPagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={setPageIndex}
                    className="px-0"
                />
            </div>

            <BankLedgerDialog
                open={open}
                form={form}
                sourceType={sourceType}
                descriptionPlaceholder={descriptionPlaceholder}
                onOpenChange={setOpen}
                onFormChange={setForm}
                onSubmit={() => saveMutation.mutate()}
                pending={saveMutation.isPending}
            />

            <Dialog open={bankImportGuideOpen} onOpenChange={setBankImportGuideOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import giao dịch ngân hàng</DialogTitle>
                        <DialogDescription>
                            File import giao dịch ngân hàng cần có đủ các tiêu đề cột sau.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="mb-2 text-sm font-medium">Tiêu đề cột cần có</div>
                        <pre className="max-h-[320px] select-text overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm leading-6 text-foreground">
                            {BANK_IMPORT_REQUIRED_COLUMNS.join("\n")}
                        </pre>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBankImportGuideOpen(false)}>
                            Đóng
                        </Button>
                        <Button onClick={chooseBankImportFile}>
                            <Upload className="mr-2 h-4 w-4" />
                            Chọn file import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!importErrorDialog} onOpenChange={(nextOpen) => !nextOpen && setImportErrorDialog(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{importErrorDialog?.title}</DialogTitle>
                        <DialogDescription>
                            {importErrorDialog?.summary || "Import Excel thất bại. Kiểm tra lại các dòng lỗi dưới đây rồi import lại."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[520px] overflow-auto rounded-md border">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-muted text-muted-foreground">
                                <tr>
                                    <th className="w-32 border-b px-3 py-2 text-left font-medium">Dòng</th>
                                    <th className="border-b px-3 py-2 text-left font-medium">Lý do lỗi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(importErrorDialog?.errors || []).map((error, index) => (
                                    <tr key={`${error.row}-${index}`} className="border-b last:border-b-0">
                                        <td className="px-3 py-2 align-top font-medium">{error.row}</td>
                                        <td className="px-3 py-2 align-top text-muted-foreground">{error.message}</td>
                                    </tr>
                                ))}
                                {!importErrorDialog?.errors?.length ? (
                                    <tr>
                                        <td className="px-3 py-4 text-muted-foreground" colSpan={2}>
                                            Không có chi tiết dòng lỗi.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportErrorDialog(null)}>
                            Đóng
                        </Button>
                        <Button variant="outline" onClick={copyImportErrors}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy lỗi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function BankLedgerDialog({
    open,
    form,
    sourceType,
    descriptionPlaceholder,
    onOpenChange,
    onFormChange,
    onSubmit,
    pending,
}: {
    open: boolean
    form: FormState
    sourceType: "BANK" | "ADJUST" | "OPENING"
    descriptionPlaceholder: string
    onOpenChange: (open: boolean) => void
    onFormChange: (form: FormState) => void
    onSubmit: () => void
    pending: boolean
}) {
    const update = (patch: Partial<FormState>) => onFormChange({ ...form, ...patch })
    const useCustomerSelector = sourceType !== "BANK"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {form.id
                            ? sourceType === "OPENING" ? "Sửa nợ đầu kỳ" : sourceType === "ADJUST" ? "Sửa điều chỉnh công nợ" : "Sửa giao dịch ngân hàng"
                            : sourceType === "OPENING" ? "Thêm nợ đầu kỳ" : sourceType === "ADJUST" ? "Thêm điều chỉnh công nợ" : "Thêm giao dịch ngân hàng"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Ngày hạch toán">
                        <DatePicker
                            value={form.posting_date}
                            onChange={(value) => update({ posting_date: value || "" })}
                        />
                    </Field>
                    <Field label="Ngày chứng từ">
                        <DatePicker
                            value={form.doc_date}
                            onChange={(value) => update({ doc_date: value || "" })}
                        />
                    </Field>
                    <Field label="Số chứng từ">
                        <Input
                            value={form.doc_no}
                            onChange={(event) => update({ doc_no: event.target.value })}
                            placeholder="VD: UNC-001, GD-..."
                        />
                    </Field>
                    <Field label="Loại giao dịch">
                        <Select
                            value={form.direction}
                            onValueChange={(value: "IN" | "OUT") => update({ direction: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN">
                                    {sourceType === "BANK" ? "Tiền vào - giảm công nợ" : sourceType === "ADJUST" ? "Giảm nợ" : sourceType === "OPENING" ? "Có đầu kỳ" : "Giảm công nợ"}
                                </SelectItem>
                                <SelectItem value="OUT">
                                    {sourceType === "BANK" ? "Tiền ra / hoàn - tăng công nợ" : sourceType === "ADJUST" ? "Tăng nợ" : sourceType === "OPENING" ? "Nợ đầu kỳ" : "Tăng công nợ"}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label={useCustomerSelector ? "Khách hàng" : "Mã KH chứng từ"} className="md:col-span-2">
                        <AsyncSelect
                            value={useCustomerSelector ? form.customer_id : form.alias_id}
                            onChange={(value: number | undefined, option: any) => {
                                if (useCustomerSelector) {
                                    update({
                                        customer_id: value,
                                        customer_name: option?.raw?.name,
                                    })
                                    return
                                }
                                update({
                                    alias_id: value,
                                    customer_id: option?.raw?.customer_id,
                                    customer_name: option?.raw?.customer?.name || option?.raw?.alias_name,
                                })
                            }}
                            placeholder={useCustomerSelector ? "Chọn khách hàng" : "Chọn mã KH chứng từ"}
                            dataSource={useCustomerSelector
                                ? {
                                    getList: listCustomers,
                                    getById: getCustomer,
                                    params: { page: 1, size: 20, keyword_scope: "code_name" },
                                }
                                : {
                                    getList: listCustomerAliases,
                                    getById: getCustomerAlias,
                                    params: { page: 1, size: 20 },
                                }}
                            mapOption={useCustomerSelector ? customerOption : aliasOption}
                            wrapLabel
                        />
                    </Field>
                    <Field label="Số tiền">
                        <Input
                            type="number"
                            min={0}
                            value={form.amount}
                            onChange={(event) => update({ amount: event.target.value })}
                            className="text-right tabular-nums"
                        />
                    </Field>
                    <Field label="TK đối ứng">
                        <Input
                            value={form.account_code}
                            onChange={(event) => update({ account_code: event.target.value })}
                            placeholder="VD: 131, 641, 711..."
                        />
                    </Field>
                    <Field label="Nội dung" className="md:col-span-2">
                        <Textarea
                            rows={3}
                            value={form.description}
                            onChange={(event) => update({ description: event.target.value })}
                            placeholder={descriptionPlaceholder}
                        />
                    </Field>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={onSubmit} disabled={pending}>
                        {pending ? "Đang lưu..." : "Lưu giao dịch"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Field({
    label,
    className,
    children,
}: {
    label: string
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
            {children}
        </div>
    )
}

function ReportTh({
    className,
    children,
    resizeIndex,
    onResizeStart,
}: {
    className?: string
    children: React.ReactNode
    resizeIndex?: number
    onResizeStart?: (columnIndex: number, event: React.MouseEvent<HTMLDivElement>) => void
}) {
    return (
        <th className={cn("relative border border-slate-200 px-2 py-2 text-center font-semibold align-middle", className)}>
            <span className="block truncate whitespace-nowrap">{children}</span>
            {resizeIndex !== undefined && onResizeStart ? (
                <div
                    className="absolute right-0 top-0 z-40 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/30"
                    onMouseDown={(event) => onResizeStart(resizeIndex, event)}
                />
            ) : null}
        </th>
    )
}

function ReportTd({
    className,
    children,
    colSpan,
}: {
    className?: string
    children: React.ReactNode
    colSpan?: number
}) {
    return (
        <td
            colSpan={colSpan}
            className={cn("max-w-0 truncate whitespace-nowrap border border-slate-200 px-2 py-2 align-middle", className)}
        >
            {children}
        </td>
    )
}

function Summary({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    tone: "credit" | "debit"
}) {
    const toneClass = tone === "credit"
        ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 shadow-emerald-100"
        : "border-rose-200 bg-rose-50/80 text-rose-700 shadow-rose-100"

    return (
        <div className={cn("flex min-h-[76px] items-center gap-3 rounded-lg border px-3 py-2 shadow-sm", toneClass)}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/75">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-center text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
                <div className="mt-1 text-right text-xl font-bold tabular-nums">{value}</div>
            </div>
        </div>
    )
}

function customerOption(customer: { id: number; code?: string; name?: string }) {
    const code = customer.code ? `${customer.code} - ` : ""
    const name = customer.name || `#${customer.id}`
    return {
        value: customer.id,
        label: `${code}${name}`,
        raw: customer,
    }
}
function aliasOption(alias: CustomerAlias) {
    return {
        value: alias.id,
        label: aliasLabel(alias),
        raw: alias,
    }
}

function aliasCustomerOption(alias: CustomerAlias) {
    return {
        value: alias.id,
        label: aliasLabel(alias),
        raw: alias,
    }
}

function aliasLabel(alias: CustomerAlias) {
    const aliasCode = alias.alias_code || `#${alias.id}`
    const aliasName = alias.alias_name || alias.customer?.name || ""
    const customerCode = alias.customer?.code ? ` (${alias.customer.code})` : ""
    return `${aliasCode} - ${aliasName}${customerCode}`
}

function dateOnly(value?: string) {
    return value ? value.trim().split(/[T\s]/)[0] : ""
}

function todayYmd() {
    const now = new Date()
    return dateToYmd(now)
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = dateOnly(value)
    const ymd = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        const [, year, month, day] = ymd
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }
    const dmy = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        const [, day, month, year] = dmy
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }
    return date
}

function periodLabel(from?: string, to?: string) {
    if (from && to) return `Từ ${formatDate(from)} đến ${formatDate(to)}`
    if (from) return `Từ ${formatDate(from)}`
    if (to) return `Đến ${formatDate(to)}`
    return "Tất cả kỳ"
}

function formatMoney(value?: number | string) {
    const amount = Number(value || 0)
    if (!amount) return "-"
    return amount.toLocaleString("en-US", { maximumFractionDigits: 6 })
}

function parseImportErrorMessage(message?: string): { summary: string; errors: ImportErrorRow[] } {
    const fallback = "Import Excel thất bại. Đã rollback toàn bộ, chưa ghi dòng nào."
    const lines = (message || fallback)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    const summary = lines.find((line) => !/^D[oò]ng\s+\d+/i.test(line)) || fallback
    const errors = lines
        .filter((line) => /^D[oò]ng\s+\d+/i.test(line))
        .map((line) => {
            const match = line.match(/^(D[oò]ng\s+\d+)\s*:\s*(.*)$/i)
            return {
                row: match?.[1] || "-",
                message: match?.[2] || line,
            }
        })

    if (!errors.length && lines.length) {
        return {
            summary,
            errors: lines
                .filter((line) => line !== summary)
                .map((line, index) => ({ row: `#${index + 1}`, message: line })),
        }
    }

    return { summary, errors }
}

async function fetchAllRows(base: ArLedgerListParams): Promise<ArLedger[]> {
    const size = 200
    const all: ArLedger[] = []
    let page = 1

    for (let guard = 0; guard < 300; guard++) {
        const res = await listArLedgers({ ...base, page, size })
        all.push(...res.items)
        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

async function exportLedgerXlsx(
    rows: ArLedger[],
    options: {
        incomingLabel: string
        outgoingLabel: string
        period: string
        sourceType: "BANK" | "ADJUST" | "OPENING"
    },
) {
    const { Workbook } = await import("exceljs")
    const isOpening = options.sourceType === "OPENING"
    const isAdjust = options.sourceType === "ADJUST"
    const title = isOpening
        ? "NỢ ĐẦU KỲ"
        : isAdjust ? "ĐIỀU CHỈNH CÔNG NỢ" : "GIAO DỊCH NGÂN HÀNG"
    const filePrefix = isOpening
        ? "no-dau-ky"
        : isAdjust ? "dieu-chinh-cong-no" : "giao-dich-ngan-hang"
    const columns: Array<{
        label: string
        width: number
        type?: "date" | "number"
    }> = [
        { label: "Ngày", width: 14, type: "date" },
        { label: "Chứng từ", width: 24 },
        { label: "Mã KH", width: 18 },
        { label: "Khách hàng", width: 32 },
        { label: "Diễn giải", width: 42 },
        { label: "TK đối ứng", width: 14 },
        { label: options.incomingLabel, width: 18, type: "number" },
        { label: options.outgoingLabel, width: 18, type: "number" },
    ]

    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet(title, {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow([title])
    sheet.addRow([options.period])
    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))

    for (const row of rows) {
        sheet.addRow([
            parseExportDate(row.posting_date),
            row.doc_no || "",
            row.customer?.code || (row.customer_id ? `#${row.customer_id}` : ""),
            row.customer?.name || row.customer_name || "",
            row.description || "",
            row.account_code || "",
            formatExcelNumber(row.credit_amount),
            formatExcelNumber(row.debit_amount),
        ])
    }

    sheet.columns = columns.map((column) => ({ width: column.width }))
    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: columns.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
    }

    const titleCell = sheet.getCell("A1")
    titleCell.font = { bold: true, size: 16 }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    const periodCell = sheet.getCell("A2")
    periodCell.font = { italic: true }
    periodCell.alignment = { horizontal: "center", vertical: "middle" }

    const header = sheet.getRow(4)
    header.height = 24
    header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell((cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            cell.alignment = {
                horizontal: column.type === "number" ? "right" : "left",
                vertical: "middle",
                wrapText: true,
            }
            if (column.type === "date") {
                cell.numFmt = "dd/mm/yyyy"
            }
        })
    }

    const date = new Date().toISOString().slice(0, 10)
    const buffer = await workbook.xlsx.writeBuffer()
    downloadExcelBuffer(buffer, `${filePrefix}-${date}.xlsx`)
}

function formatExcelNumber(value?: number | string) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : ""
}

function parseExportDate(value?: string) {
    if (!value) return ""
    const dateOnlyValue = value.trim().split(/[T\s]/)[0]
    const dmy = dateOnlyValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    }

    const ymd = dateOnlyValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    }

    return value
}

function downloadExcelBuffer(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function exportAdjustmentXlsx(
    rows: ArLedger[],
    options: {
        incomingLabel: string
        outgoingLabel: string
        period: string
        sourceType: "BANK" | "ADJUST" | "OPENING"
    },
) {
    const exportRows: (string | number)[][] = []
    const push = (cells: (string | number)[]) => exportRows.push(cells)
    const isOpening = options.sourceType === "OPENING"

    push([isOpening ? "NỢ ĐẦU KỲ" : "ĐIỀU CHỈNH CÔNG NỢ"])
    push([options.period])
    push([])
    push([
        "Ngày",
        "Chứng từ",
        "Mã KH",
        "Khách hàng",
        "Diễn giải",
        "TK đối ứng",
        options.incomingLabel,
        options.outgoingLabel,
    ])

    for (const row of rows) {
        push([
            formatDate(row.posting_date),
            row.doc_no || "",
            row.customer?.code || (row.customer_id ? `#${row.customer_id}` : ""),
            row.customer?.name || row.customer_name || "",
            row.description || "",
            row.account_code || "",
            Number(row.credit_amount || 0),
            Number(row.debit_amount || 0),
        ])
    }

    const date = new Date().toISOString().slice(0, 10)
    exportXlsx(`${isOpening ? "no-dau-ky" : "dieu-chinh-cong-no"}-${date}.xlsx`, [
        { name: isOpening ? "Nợ đầu kỳ" : "Điều chỉnh công nợ", rows: exportRows },
    ])
}

