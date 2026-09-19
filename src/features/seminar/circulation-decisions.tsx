import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, Edit, FileDown, Funnel, Loader2, Plus, Save, Search, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    createCirculationDecision,
    createCirculationProduct,
    deleteCirculationDecisionAuthorizationFile,
    deleteCirculationProduct,
    downloadCirculationDecisionAuthorizationFile,
    downloadCirculationDecisionPdf,
    getCirculationDecision,
    listCirculationDecisions,
    updateCirculationDecision,
    uploadCirculationDecisionAuthorizationFile,
    uploadCirculationDecisionPdf,
} from "@/api/seminar"
import { getCompany, listCompanies } from "@/api/company"
import { getMyPermissions } from "@/api/auth/permission"
import type { CirculationDecision, CirculationProduct } from "./data/schema"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { PageSection } from "@/components/page-section"
import { CrudTable } from "@/components/crud/crud-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatNumber } from "@/lib/utils"

const emptyDecision: Partial<CirculationDecision> = {
    decision_no: "",
    issued_date: "",
    expired_date: "",
    source_type: "INTERNAL",
    source_company_id: undefined,
    source_company_name: "",
    authorization_valid_from: "",
    authorization_valid_to: "",
    note: "",
}

const emptyProduct: Partial<CirculationProduct> = {
    product_type: "",
    product_name: "",
    circulation_code: "",
    note: "",
    active: true,
}

type DraftCirculationProduct = Partial<CirculationProduct> & {
    tempId: string
}

export default function CirculationDecisionsPage() {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const authorizationFileInputRef = useRef<HTMLInputElement | null>(null)
    const [keyword, setKeyword] = useState("")
    const debouncedKeyword = useDebouncedValue(keyword, 300)
    const [sourceTypeFilter, setSourceTypeFilter] = useState("ALL")
    const [nearExpiryOnly, setNearExpiryOnly] = useState(false)
    const [expiredDateSort, setExpiredDateSort] = useState<"asc" | "desc">("asc")
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
    const [expandedRows, setExpandedRows] = useState<number[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<CirculationDecision | null>(null)
    const [form, setForm] = useState<Partial<CirculationDecision>>(emptyDecision)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [productForm, setProductForm] = useState<Partial<CirculationProduct>>(emptyProduct)
    const [productErrors, setProductErrors] = useState<Record<string, string>>({})
    const [draftProducts, setDraftProducts] = useState<DraftCirculationProduct[]>([])
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [authorizationFiles, setAuthorizationFiles] = useState<File[]>([])
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canUpdateDecisions = hasPermission(permissionsQuery.data ?? [], "seminars.circulation-decisions", "update")

    const decisionsQuery = useQuery({
        queryKey: ["circulation-decisions", debouncedKeyword, sourceTypeFilter, nearExpiryOnly, expiredDateSort, pagination.pageIndex, pagination.pageSize],
        queryFn: () => listCirculationDecisions({
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
            keyword: debouncedKeyword,
            source_type: sourceTypeFilter === "ALL" ? undefined : sourceTypeFilter,
            validity: nearExpiryOnly ? "expiring_soon" : undefined,
            expired_date_sort: expiredDateSort,
        }),
        placeholderData: keepPreviousData,
    })

    const nearExpiryCountQuery = useQuery({
        queryKey: ["circulation-decisions-near-expiry-count", debouncedKeyword, sourceTypeFilter],
        queryFn: () => listCirculationDecisions({
            page: 1,
            size: 1,
            keyword: debouncedKeyword,
            source_type: sourceTypeFilter === "ALL" ? undefined : sourceTypeFilter,
            validity: "expiring_soon",
        }),
        placeholderData: keepPreviousData,
    })
    const nearExpiryCount = nearExpiryCountQuery.data?.total ?? 0

    const columns = useCirculationDecisionColumns({
        expandedRows,
        setExpandedRows,
        canUpdate: canUpdateDecisions,
        expiredDateSort,
        onExpiredDateSortChange: (value) => {
            setExpiredDateSort(value)
            setPagination((current) => current.pageIndex === 0 ? current : { ...current, pageIndex: 0 })
        },
        onEdit: openEditDialog,
        onDownloadPdf: (item) => downloadCirculationDecisionPdf(item.id, item.pdf_file_name),
    })

    const saveDecision = useMutation({
        mutationFn: async () => {
            const decision = selected?.id
                ? await updateCirculationDecision(selected.id, normalizeDecisionPayload(form))
                : await createCirculationDecision(normalizeDecisionPayload(form))

            for (const product of draftProducts) {
                await createCirculationProduct(decision.id, normalizeProductPayload(product))
            }

            if (pdfFile) {
                await uploadCirculationDecisionPdf(decision.id, pdfFile)
            }

            for (const file of authorizationFiles) {
                await uploadCirculationDecisionAuthorizationFile(decision.id, file)
            }

            return getCirculationDecision(decision.id)
        },
        onSuccess: async (detail) => {
            toast.success("Đã lưu QĐLH")
            await queryClient.invalidateQueries({ queryKey: ["circulation-decisions"] })
            setSelected(detail)
            setForm(detail)
            setDraftProducts([])
            setPdfFile(null)
            setAuthorizationFiles([])
            setProductForm(emptyProduct)
            setProductErrors({})
            if (fileInputRef.current) fileInputRef.current.value = ""
            if (authorizationFileInputRef.current) authorizationFileInputRef.current.value = ""
            setDialogOpen(false)
        },
        onError: (e: any) => toast.error(e?.message || "Không lưu được QĐLH"),
    })

    async function refreshSelected() {
        await queryClient.invalidateQueries({ queryKey: ["circulation-decisions"] })
        if (!selected?.id) return
        const detail = await getCirculationDecision(selected.id)
        setSelected(detail)
        setForm(detail)
    }

    function openCreateDialog() {
        setSelected(null)
        setForm(emptyDecision)
        setErrors({})
        setProductForm(emptyProduct)
        setProductErrors({})
        setDraftProducts([])
        setPdfFile(null)
        setAuthorizationFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (authorizationFileInputRef.current) authorizationFileInputRef.current.value = ""
        setDialogOpen(true)
    }

    async function openEditDialog(item: CirculationDecision) {
        const detail = await getCirculationDecision(item.id)
        setSelected(detail)
        setForm(detail)
        setErrors({})
        setProductForm(emptyProduct)
        setProductErrors({})
        setDraftProducts([])
        setPdfFile(null)
        setAuthorizationFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (authorizationFileInputRef.current) authorizationFileInputRef.current.value = ""
        setDialogOpen(true)
    }

    return (
        <PageSection
            isLoading={decisionsQuery.isLoading && !decisionsQuery.data}
            error={decisionsQuery.error}
            title="Quyết định lưu hành"
            description="Quản lý PDF QĐLH và danh sách sản phẩm đã có lưu hành."
            actions={canUpdateDecisions ? (
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo QĐLH
                </Button>
            ) : null}
            data={decisionsQuery.data}
        >
            {(page) => (
                <div className="space-y-4">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <div className="relative h-10 min-w-[280px] flex-[1.8_1_0]">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                                className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                                value={keyword}
                                onChange={(e) => {
                                    setKeyword(e.target.value)
                                    setPagination((current) => current.pageIndex === 0 ? current : { ...current, pageIndex: 0 })
                                }}
                                placeholder="Tìm số QĐLH hoặc tên sản phẩm..."
                            />
                        </div>
                        <Select
                            value={sourceTypeFilter}
                            onValueChange={(value) => {
                                setSourceTypeFilter(value)
                                setPagination((current) => current.pageIndex === 0 ? current : { ...current, pageIndex: 0 })
                            }}
                        >
                            <SelectTrigger className="h-10 w-[230px] bg-white">
                                <SelectValue placeholder="Nguồn QĐLH" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả nguồn</SelectItem>
                                <SelectItem value="INTERNAL">Công ty trực thuộc</SelectItem>
                                <SelectItem value="EXTERNAL_AUTHORIZED">Công ty ngoài ủy quyền</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant={nearExpiryOnly ? "default" : "outline"}
                            className={cn("h-10", nearExpiryCount > 0 && !nearExpiryOnly && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100")}
                            onClick={() => {
                                setNearExpiryOnly(!nearExpiryOnly)
                                setPagination((current) => current.pageIndex === 0 ? current : { ...current, pageIndex: 0 })
                            }}
                        >
                            Còn hạn dưới 4 tháng
                            <span
                                className={cn(
                                    "ml-2 rounded px-1.5 py-0.5 text-xs font-semibold",
                                    nearExpiryCount > 0
                                        ? "bg-destructive text-white"
                                        : "bg-background/20"
                                )}
                            >
                                {formatNumber(nearExpiryCount)}
                            </span>
                        </Button>
                    </div>

                    <CrudTable<CirculationDecision>
                        data={page.items}
                        columns={columns}
                        entityName="quyết định lưu hành"
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={page.total_page}
                        showToolbar={false}
                        enableColumnResize
                        enableStickyHorizontalScroll
                        headerVariant="report"
                        footer={false}
                    />

                    <DecisionDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        selected={selected}
                        form={form}
                        setForm={setForm}
                        productForm={productForm}
                        setProductForm={setProductForm}
                        draftProducts={draftProducts}
                        pdfFile={pdfFile}
                        authorizationFiles={authorizationFiles}
                        savePending={saveDecision.isPending}
                        errors={errors}
                        setErrors={setErrors}
                        productErrors={productErrors}
                        setProductErrors={setProductErrors}
                        canUpdate={canUpdateDecisions}
                        onSave={() => {
                            const nextErrors = validateDecision(form)
                            setErrors(nextErrors)
                            if (Object.keys(nextErrors).length > 0) return
                            saveDecision.mutate()
                        }}
                        onAddProduct={() => {
                            const nextErrors = validateProduct(productForm)
                            setProductErrors(nextErrors)
                            if (Object.keys(nextErrors).length > 0) return
                            setDraftProducts([...draftProducts, { ...productForm, tempId: createTempId() }])
                            setProductForm(emptyProduct)
                        }}
                        onDeleteProduct={async (product) => {
                            if (product.id) {
                                await deleteCirculationProduct(product.id)
                                await refreshSelected()
                                return
                            }
                            setDraftProducts(draftProducts.filter((item) => item.tempId !== product.tempId))
                        }}
                        onPickPdf={() => fileInputRef.current?.click()}
                        onDownloadPdf={() => selected?.id && downloadCirculationDecisionPdf(selected.id, selected.pdf_file_name)}
                        onPickAuthorizationFiles={() => authorizationFileInputRef.current?.click()}
                        onRemovePickedAuthorizationFile={(index) => setAuthorizationFiles(authorizationFiles.filter((_, fileIndex) => fileIndex !== index))}
                        onDownloadAuthorizationFile={(index, fileName) => selected?.id && downloadCirculationDecisionAuthorizationFile(selected.id, index, fileName)}
                        onDeleteAuthorizationFile={async (index) => {
                            if (!selected?.id) return
                            const detail = await deleteCirculationDecisionAuthorizationFile(selected.id, index)
                            setSelected(detail)
                            setForm(detail)
                            await queryClient.invalidateQueries({ queryKey: ["circulation-decisions"] })
                        }}
                    />

                    <input
                        ref={fileInputRef}
                        className="hidden"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                    <input
                        ref={authorizationFileInputRef}
                        className="hidden"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                        onChange={(e) => setAuthorizationFiles(Array.from(e.target.files ?? []))}
                    />
                </div>
            )}
        </PageSection>
    )
}

function useCirculationDecisionColumns({
    expandedRows,
    setExpandedRows,
    canUpdate,
    expiredDateSort,
    onExpiredDateSortChange,
    onEdit,
    onDownloadPdf,
}: {
    expandedRows: number[]
    setExpandedRows: (rows: number[]) => void
    canUpdate: boolean
    expiredDateSort: "asc" | "desc"
    onExpiredDateSortChange: (value: "asc" | "desc") => void
    onEdit: (item: CirculationDecision) => void
    onDownloadPdf: (item: CirculationDecision) => void
}) {
    return useMemo<ColumnDef<CirculationDecision>[]>(() => {
        const gridCell = "border-r border-slate-200 last:border-r-0"
        const centerCell = `${gridCell} text-center`

        return [
            {
                ...buildIndexColumn<CirculationDecision>(),
                size: 56,
                minSize: 48,
                meta: {
                    thClassName: `w-14 whitespace-nowrap ${centerCell}`,
                    tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
                },
            },
            buildTextColumn({
                accessorKey: "decision_no",
                title: "Số QĐLH",
                width: 170,
                className: `w-[170px] ${centerCell}`,
                render: (row) => <OneLineText value={row.decision_no} className="text-center text-sm font-medium" />,
            }),
            buildTextColumn({
                title: "Nguồn",
                width: 220,
                className: `w-[220px] ${centerCell}`,
                render: (row) => row.source_type === "EXTERNAL_AUTHORIZED" ? (
                    <div className="flex w-full min-w-0 items-center justify-center gap-2">
                        <OneLineText value={row.source_company_name} className="text-center text-sm font-medium" />
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            Ủy quyền
                        </Badge>
                    </div>
                ) : (
                    <OneLineText
                        value={row.source_company?.alias || row.source_company?.name || row.source_company_name}
                        className="text-center text-sm font-medium"
                    />
                ),
            }),
            buildTextColumn({
                accessorKey: "issued_date",
                title: "Ngày cấp",
                width: 130,
                className: `w-[130px] ${centerCell}`,
                render: (row) => <OneLineText value={formatDate(row.issued_date)} className="text-center text-sm" />,
            }),
            {
                accessorKey: "expired_date",
                header: () => (
                    <ExpiredDateSortHeader
                        value={expiredDateSort}
                        onChange={onExpiredDateSortChange}
                    />
                ),
                enableSorting: false,
                size: 160,
                cell: ({ row }) => <OneLineText value={formatDate(row.original.expired_date)} className="text-center text-sm" />,
                meta: {
                    thClassName: `w-[160px] whitespace-nowrap ${centerCell}`,
                    tdClassName: `w-[160px] whitespace-nowrap ${centerCell}`,
                },
            },
            buildTextColumn({
                title: "Thời gian còn hạn",
                width: 170,
                className: `w-[170px] ${centerCell}`,
                render: (row) => {
                    const remaining = circulationRemaining(row.expired_date)
                    return (
                        <span className={cn("block truncate text-center text-sm font-medium", remaining.warning && "text-destructive")}>
                            {remaining.label}
                        </span>
                    )
                },
            }),
            buildTextColumn({
                title: "Sản phẩm thuộc quyết định",
                width: 430,
                className: `w-[430px] ${gridCell}`,
                render: (row) => (
                    <DecisionProductsCell
                        decision={row}
                        expanded={expandedRows.includes(row.id)}
                        onExpandedChange={(expanded) => setExpandedRows(toggle(expandedRows, row.id, expanded))}
                    />
                ),
            }),
            buildTextColumn({
                accessorKey: "note",
                title: "Ghi chú",
                width: 240,
                className: `w-[240px] ${gridCell}`,
                render: (row) => <OneLineText value={row.note} className="text-sm" />,
            }),
            buildTextColumn({
                accessorKey: "pdf_file_name",
                title: "PDF",
                width: 220,
                className: `w-[220px] ${gridCell}`,
                render: (row) => <OneLineText value={row.pdf_file_name} className="text-sm" />,
            }),
            {
                id: "actions",
                header: "Thao tác",
                enableSorting: false,
                enableHiding: false,
                size: 96,
                cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!row.original.pdf_file_name}
                            onClick={() => onDownloadPdf(row.original)}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                        {canUpdate ? (
                            <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                ),
                meta: {
                    thClassName: `w-24 whitespace-nowrap ${centerCell}`,
                    tdClassName: `w-24 whitespace-nowrap ${centerCell}`,
                },
            },
        ]
    }, [canUpdate, expandedRows, expiredDateSort, onDownloadPdf, onEdit, onExpiredDateSortChange, setExpandedRows])
}

function ExpiredDateSortHeader({
    value,
    onChange,
}: {
    value: "asc" | "desc"
    onChange: (value: "asc" | "desc") => void
}) {
    const [open, setOpen] = useState(false)
    const options = [
        { value: "asc" as const, label: "Tăng dần", icon: ArrowUpNarrowWide },
        { value: "desc" as const, label: "Giảm dần", icon: ArrowDownWideNarrow },
    ]

    return (
        <div className="flex min-w-0 items-center justify-center gap-1.5">
            <span className="truncate">Ngày hết hạn</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
                            value === "asc"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        aria-label="Sắp xếp ngày hết hạn"
                    >
                        <Funnel className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                    <div className="px-2 pb-2 font-semibold text-foreground">Sắp xếp ngày hết hạn</div>
                    <div className="space-y-1">
                        {options.map((option) => {
                            const Icon = option.icon
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                                        value === option.value && "bg-primary/10 text-primary",
                                    )}
                                    onClick={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{option.label}</span>
                                    {value === option.value ? <Check className="ml-auto h-4 w-4" /> : null}
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function DecisionProductsCell({
    decision,
    expanded,
    onExpandedChange,
}: {
    decision: CirculationDecision
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
}) {
    const products = decision.products ?? []
    const visibleProducts = expanded ? products : products.slice(0, 5)

    if (products.length === 0) {
        return <span className="text-sm text-muted-foreground">Chưa có sản phẩm</span>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {visibleProducts.map((product) => (
                <span
                    key={product.id}
                    className="max-w-[180px] truncate rounded-md border bg-muted/40 px-2 py-1 text-xs"
                    title={`${product.product_name} - ${product.circulation_code}`}
                >
                    {product.product_name}
                </span>
            ))}
            {products.length > 5 ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onExpandedChange(!expanded)}
                >
                    {expanded ? "Thu gọn" : `Xem thêm ${products.length - 5}`}
                </Button>
            ) : null}
        </div>
    )
}

function OneLineText({ value, className }: { value: unknown; className?: string }) {
    const display = value === null || value === undefined || value === "" ? "-" : String(value)
    return <span className={cn("block min-w-0 truncate", className)}>{display}</span>
}

function DecisionDialog({
    open,
    onOpenChange,
    selected,
    form,
    setForm,
    productForm,
    setProductForm,
    draftProducts,
    pdfFile,
    authorizationFiles,
    savePending,
    errors,
    setErrors,
    productErrors,
    setProductErrors,
    canUpdate,
    onSave,
    onAddProduct,
    onDeleteProduct,
    onPickPdf,
    onDownloadPdf,
    onPickAuthorizationFiles,
    onRemovePickedAuthorizationFile,
    onDownloadAuthorizationFile,
    onDeleteAuthorizationFile,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    selected: CirculationDecision | null
    form: Partial<CirculationDecision>
    setForm: (form: Partial<CirculationDecision>) => void
    productForm: Partial<CirculationProduct>
    setProductForm: (form: Partial<CirculationProduct>) => void
    draftProducts: DraftCirculationProduct[]
    pdfFile: File | null
    authorizationFiles: File[]
    savePending: boolean
    errors: Record<string, string>
    setErrors: (errors: Record<string, string>) => void
    productErrors: Record<string, string>
    setProductErrors: (errors: Record<string, string>) => void
    canUpdate: boolean
    onSave: () => void
    onAddProduct: () => void
    onDeleteProduct: (product: DraftCirculationProduct) => Promise<void> | void
    onPickPdf: () => void
    onDownloadPdf: () => void
    onPickAuthorizationFiles: () => void
    onRemovePickedAuthorizationFile: (index: number) => void
    onDownloadAuthorizationFile: (index: number, fileName?: string) => void
    onDeleteAuthorizationFile: (index: number) => Promise<void> | void
}) {
    const products = [
        ...(selected?.products ?? []).map((product) => ({ ...product, tempId: `saved-${product.id}` })),
        ...draftProducts,
    ]
    const sourceType = form.source_type ?? "INTERNAL"
    const sourceCompanyInitialOption = useMemo(() => {
        if (!form.source_company_id) return undefined
        return circulationCompanyOption(form.source_company ?? { id: form.source_company_id, name: form.source_company_name ?? "" })
    }, [form.source_company, form.source_company_id, form.source_company_name])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] !w-[95vw] flex-col overflow-hidden p-7 sm:!max-w-[1180px]">
                <DialogHeader>
                    <DialogTitle>{selected?.id ? "Sửa QĐLH" : "Tạo QĐLH"}</DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                    <div className="grid gap-4 md:grid-cols-[1.15fr_1fr_1fr]">
                        <Field label="Số QĐLH">
                            <Input
                                aria-invalid={Boolean(errors.decision_no)}
                                className={cn(errors.decision_no && "border-destructive focus-visible:ring-destructive/30")}
                                value={form.decision_no ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, decision_no: e.target.value })
                                    setErrors(withoutError(errors, "decision_no"))
                                }}
                            />
                            <FieldError message={errors.decision_no} />
                        </Field>
                        <Field label="Ngày cấp">
                            <Input
                                aria-invalid={Boolean(errors.issued_date)}
                                className={cn(errors.issued_date && "border-destructive focus-visible:ring-destructive/30")}
                                type="date"
                                value={form.issued_date ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, issued_date: e.target.value })
                                    setErrors(withoutError(errors, "issued_date", "expired_date"))
                                }}
                            />
                            <FieldError message={errors.issued_date} />
                        </Field>
                        <Field label="Ngày hết hạn">
                            <Input
                                aria-invalid={Boolean(errors.expired_date)}
                                className={cn(errors.expired_date && "border-destructive focus-visible:ring-destructive/30")}
                                type="date"
                                value={form.expired_date ?? ""}
                                onChange={(e) => {
                                    setForm({ ...form, expired_date: e.target.value })
                                    setErrors(withoutError(errors, "expired_date"))
                                }}
                            />
                            <FieldError message={errors.expired_date} />
                        </Field>
                        <Field label="Nguồn QĐLH">
                            <Select
                                value={sourceType}
                                onValueChange={(value) => {
                                    setForm({
                                        ...form,
                                        source_type: value,
                                        source_company_id: value === "INTERNAL" ? form.source_company_id : undefined,
                                        source_company_name: value === "INTERNAL" ? form.source_company_name : "",
                                    })
                                    setErrors(withoutError(errors, "source_company_id", "source_company_name"))
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNAL">Công ty trực thuộc</SelectItem>
                                    <SelectItem value="EXTERNAL_AUTHORIZED">Công ty ngoài ủy quyền</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        {sourceType === "INTERNAL" ? (
                            <Field label="Công ty nguồn">
                                <AsyncSelect
                                    value={form.source_company_id}
                                    onChange={(value: number | undefined, option: any) => {
                                        setForm({
                                            ...form,
                                            source_company_id: value,
                                            source_company_name: option?.raw?.name ?? option?.label ?? "",
                                            source_company: option?.raw,
                                        })
                                        setErrors(withoutError(errors, "source_company_id"))
                                    }}
                                    dataSource={companyDataSource()}
                                    mapOption={circulationCompanyOption}
                                    initialOption={sourceCompanyInitialOption}
                                    placeholder="Chọn công ty"
                                    searchPlaceholder="Tìm công ty..."
                                    popoverContentClassName="w-[min(560px,calc(100vw-3rem))]"
                                    optionWrapLabel
                                    required
                                />
                                <FieldError message={errors.source_company_id} />
                            </Field>
                        ) : (
                            <>
                                <Field label="Công ty ủy quyền">
                                    <Input
                                        aria-invalid={Boolean(errors.source_company_name)}
                                        className={cn(errors.source_company_name && "border-destructive focus-visible:ring-destructive/30")}
                                        value={form.source_company_name ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, source_company_name: e.target.value })
                                            setErrors(withoutError(errors, "source_company_name"))
                                        }}
                                    />
                                    <FieldError message={errors.source_company_name} />
                                </Field>
                                <Field label="Hiệu lực ủy quyền từ">
                                    <Input
                                        type="date"
                                        value={form.authorization_valid_from ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, authorization_valid_from: e.target.value })
                                            setErrors(withoutError(errors, "authorization_valid_to"))
                                        }}
                                    />
                                </Field>
                                <Field label="Hiệu lực ủy quyền đến">
                                    <Input
                                        aria-invalid={Boolean(errors.authorization_valid_to)}
                                        className={cn(errors.authorization_valid_to && "border-destructive focus-visible:ring-destructive/30")}
                                        type="date"
                                        value={form.authorization_valid_to ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, authorization_valid_to: e.target.value })
                                            setErrors(withoutError(errors, "authorization_valid_to"))
                                        }}
                                    />
                                    <FieldError message={errors.authorization_valid_to} />
                                </Field>
                            </>
                        )}
                        <div className="md:col-span-3">
                            <Field label="Ghi chú">
                                <Textarea value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                            </Field>
                        </div>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                        <div className="text-sm font-semibold">Sản phẩm thuộc quyết định</div>
                        {canUpdate ? (
                        <div className="grid gap-4 md:grid-cols-[1fr_1.7fr_1.25fr_auto]">
                            <Field label="Loại sản phẩm">
                                <Input
                                    aria-invalid={Boolean(productErrors.product_type)}
                                    className={cn(productErrors.product_type && "border-destructive focus-visible:ring-destructive/30")}
                                    value={productForm.product_type ?? ""}
                                    onChange={(e) => {
                                        setProductForm({ ...productForm, product_type: e.target.value })
                                        setProductErrors(withoutError(productErrors, "product_type"))
                                    }}
                                />
                                <FieldError message={productErrors.product_type} />
                            </Field>
                            <Field label="Tên sản phẩm">
                                <Input
                                    aria-invalid={Boolean(productErrors.product_name)}
                                    className={cn(productErrors.product_name && "border-destructive focus-visible:ring-destructive/30")}
                                    value={productForm.product_name ?? ""}
                                    onChange={(e) => {
                                        setProductForm({ ...productForm, product_name: e.target.value })
                                        setProductErrors(withoutError(productErrors, "product_name"))
                                    }}
                                />
                                <FieldError message={productErrors.product_name} />
                            </Field>
                            <Field label="Mã số sản phẩm">
                                <Input
                                    aria-invalid={Boolean(productErrors.circulation_code)}
                                    className={cn(productErrors.circulation_code && "border-destructive focus-visible:ring-destructive/30")}
                                    value={productForm.circulation_code ?? ""}
                                    onChange={(e) => {
                                        setProductForm({ ...productForm, circulation_code: e.target.value })
                                        setProductErrors(withoutError(productErrors, "circulation_code"))
                                    }}
                                />
                                <FieldError message={productErrors.circulation_code} />
                            </Field>
                            <div className="flex items-end">
                                <Button className="w-full md:w-32" type="button" onClick={onAddProduct}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm
                                </Button>
                            </div>
                        </div>
                        ) : null}
                        <div className="overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Tên sản phẩm</TableHead>
                                        <TableHead>Mã số sản phẩm</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.tempId}>
                                            <TableCell>{product.product_type}</TableCell>
                                            <TableCell className="font-medium">{product.product_name}</TableCell>
                                            <TableCell>{product.circulation_code}</TableCell>
                                            <TableCell>
                                                {canUpdate ? (
                                                    <Button variant="ghost" size="icon" type="button" onClick={() => onDeleteProduct(product)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {sourceType === "EXTERNAL_AUTHORIZED" ? (
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold">Giấy ủy quyền</div>
                                    <div className="text-xs text-muted-foreground">Có thể chọn nhiều file, lưu cùng QĐLH.</div>
                                </div>
                                {canUpdate ? (
                                    <Button variant="outline" type="button" onClick={onPickAuthorizationFiles}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Chọn giấy ủy quyền
                                    </Button>
                                ) : null}
                            </div>

                            <div className="overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tên file</TableHead>
                                            <TableHead className="w-40">Ngày tải lên</TableHead>
                                            <TableHead className="w-28 text-center">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(selected?.authorization_files ?? []).map((file, index) => (
                                            <TableRow key={`${file.file_name}-${index}`}>
                                                <TableCell className="font-medium">{file.file_name}</TableCell>
                                                <TableCell>{formatDateTime(file.uploaded_at)}</TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button variant="ghost" size="icon" type="button" onClick={() => onDownloadAuthorizationFile(index, file.file_name)}>
                                                            <FileDown className="h-4 w-4" />
                                                        </Button>
                                                        {canUpdate ? (
                                                            <Button variant="ghost" size="icon" type="button" onClick={() => onDeleteAuthorizationFile(index)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {authorizationFiles.map((file, index) => (
                                            <TableRow key={`${file.name}-${index}`}>
                                                <TableCell className="font-medium">
                                                    {file.name}
                                                    <span className="ml-2 text-xs text-muted-foreground">chưa lưu</span>
                                                </TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="icon" type="button" onClick={() => onRemovePickedAuthorizationFile(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(selected?.authorization_files?.length ?? 0) + authorizationFiles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                                    Chưa có giấy ủy quyền
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="border-t pt-4 sm:justify-between">
                    <div className="min-w-0 text-sm text-muted-foreground">
                        {pdfFile ? `PDF đã chọn: ${pdfFile.name}` : selected?.pdf_file_name ? `PDF hiện tại: ${selected.pdf_file_name}` : ""}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {canUpdate ? (
                            <Button variant="outline" type="button" onClick={onPickPdf}>
                                <Upload className="mr-2 h-4 w-4" />
                                Chọn PDF
                            </Button>
                        ) : null}
                        <Button variant="outline" type="button" disabled={!selected?.pdf_file_name} onClick={onDownloadPdf}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Tải PDF
                        </Button>
                        {canUpdate ? (
                            <Button type="button" onClick={onSave} disabled={savePending}>
                                {savePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Lưu QĐLH
                            </Button>
                        ) : null}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    )
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <div className="text-xs font-medium text-destructive">{message}</div>
}

function validateDecision(form: Partial<CirculationDecision>) {
    const errors: Record<string, string> = {}
    if (!form.decision_no?.trim()) {
        errors.decision_no = "Vui lòng nhập số QĐLH"
    }
    if (!form.issued_date) {
        errors.issued_date = "Vui lòng chọn ngày cấp"
    }
    if (!form.expired_date) {
        errors.expired_date = "Vui lòng chọn ngày hết hạn"
    }
    if (form.issued_date && form.expired_date && form.issued_date > form.expired_date) {
        errors.expired_date = "Ngày hết hạn phải sau ngày cấp"
    }
    if ((form.source_type ?? "INTERNAL") === "INTERNAL" && !form.source_company_id) {
        errors.source_company_id = "Vui lòng chọn công ty nguồn"
    }
    if (form.source_type === "EXTERNAL_AUTHORIZED" && !form.source_company_name?.trim()) {
        errors.source_company_name = "Vui lòng nhập công ty ủy quyền"
    }
    if (form.authorization_valid_from && form.authorization_valid_to && form.authorization_valid_from > form.authorization_valid_to) {
        errors.authorization_valid_to = "Ngày hết hiệu lực phải sau ngày bắt đầu"
    }
    return errors
}

function validateProduct(form: Partial<CirculationProduct>) {
    const errors: Record<string, string> = {}
    if (!form.product_type?.trim()) {
        errors.product_type = "Vui lòng nhập loại sản phẩm"
    }
    if (!form.product_name?.trim()) {
        errors.product_name = "Vui lòng nhập tên sản phẩm"
    }
    if (!form.circulation_code?.trim()) {
        errors.circulation_code = "Vui lòng nhập mã số sản phẩm"
    }
    return errors
}

function normalizeDecisionPayload(form: Partial<CirculationDecision>) {
    const sourceType = form.source_type ?? "INTERNAL"
    return {
        decision_no: form.decision_no?.trim(),
        issued_date: form.issued_date || undefined,
        expired_date: form.expired_date || undefined,
        source_type: sourceType,
        source_company_id: sourceType === "INTERNAL" ? form.source_company_id : undefined,
        source_company_name: form.source_company_name?.trim() || undefined,
        authorization_valid_from: sourceType === "EXTERNAL_AUTHORIZED" ? form.authorization_valid_from || undefined : undefined,
        authorization_valid_to: sourceType === "EXTERNAL_AUTHORIZED" ? form.authorization_valid_to || undefined : undefined,
        note: form.note?.trim() || undefined,
    }
}

function normalizeProductPayload(form: Partial<CirculationProduct>) {
    return {
        product_type: form.product_type?.trim() || undefined,
        product_name: form.product_name?.trim(),
        circulation_code: form.circulation_code?.trim(),
        note: form.note?.trim() || undefined,
        active: form.active ?? true,
    }
}

function toggle(values: number[], id: number, checked: boolean) {
    if (checked) return values.includes(id) ? values : [...values, id]
    return values.filter((value) => value !== id)
}

function createTempId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function withoutError(errors: Record<string, string>, ...keys: string[]) {
    const next = { ...errors }
    keys.forEach((key) => delete next[key])
    return next
}

function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delay)
        return () => window.clearTimeout(timer)
    }, [value, delay])
    return debounced
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) => permission.module === module && permission.action === action)
}

function companyDataSource() {
    return {
        getList: (params: any) => listCompanies({ page: 1, size: 20, keyword: params?.keyword }),
        getById: getCompany,
    }
}

function circulationCompanyOption(company?: any) {
    if (!company) return null
    const alias = company.alias?.trim()
    const name = company.name?.trim()
    return {
        value: company.id,
        label: alias ? `${alias} - ${name || "-"}` : (name || `#${company.id}`),
        raw: company,
    }
}

function formatDate(value?: string) {
    if (!value) return ""
    return value.slice(0, 10).split("-").reverse().join("/")
}

function formatDateTime(value?: string) {
    if (!value) return ""
    const datePart = formatDate(value)
    const timePart = value.includes("T")
        ? value.split("T")[1]?.slice(0, 5)
        : value.includes(" ")
            ? value.split(" ")[1]?.slice(0, 5)
            : ""
    return [datePart, timePart].filter(Boolean).join(" ")
}

function circulationRemaining(value?: string) {
    if (!value) return { label: "-", warning: false }
    const expiredDate = parseDate(value)
    if (!expiredDate) return { label: "-", warning: false }

    const today = startOfToday()
    if (expiredDate < today) return { label: "Đã hết hạn", warning: true }

    let years = expiredDate.getFullYear() - today.getFullYear()
    let months = expiredDate.getMonth() - today.getMonth()
    if (expiredDate.getDate() < today.getDate()) months -= 1
    let totalMonths = years * 12 + months
    if (totalMonths < 0) totalMonths = 0

    years = Math.floor(totalMonths / 12)
    months = totalMonths % 12
    const parts: string[] = []
    if (years > 0) parts.push(`${years} năm`)
    if (months > 0) parts.push(`${months} tháng`)
    if (parts.length === 0) parts.push("Dưới 1 tháng")

    return {
        label: parts.join(" "),
        warning: totalMonths <= 4,
    }
}

function parseDate(value: string) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
}

function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}
