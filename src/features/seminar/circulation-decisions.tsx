import { useEffect, useRef, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, FileDown, Loader2, Plus, Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    createCirculationDecision,
    createCirculationProduct,
    deleteCirculationProduct,
    downloadCirculationDecisionPdf,
    getCirculationDecision,
    listCirculationDecisions,
    updateCirculationDecision,
    uploadCirculationDecisionPdf,
} from "@/api/seminar"
import { getMyPermissions } from "@/api/auth/permission"
import type { CirculationDecision, CirculationProduct } from "./data/schema"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const emptyDecision: Partial<CirculationDecision> = {
    decision_no: "",
    issued_date: "",
    expired_date: "",
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
    const [keyword, setKeyword] = useState("")
    const debouncedKeyword = useDebouncedValue(keyword, 300)
    const [expandedRows, setExpandedRows] = useState<number[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<CirculationDecision | null>(null)
    const [form, setForm] = useState<Partial<CirculationDecision>>(emptyDecision)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [productForm, setProductForm] = useState<Partial<CirculationProduct>>(emptyProduct)
    const [productErrors, setProductErrors] = useState<Record<string, string>>({})
    const [draftProducts, setDraftProducts] = useState<DraftCirculationProduct[]>([])
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canUpdateDecisions = hasPermission(permissionsQuery.data ?? [], "seminars.circulation-decisions", "update")

    const decisionsQuery = useQuery({
        queryKey: ["circulation-decisions", debouncedKeyword],
        queryFn: () => listCirculationDecisions({ page: 1, size: 100, keyword: debouncedKeyword }),
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

            return getCirculationDecision(decision.id)
        },
        onSuccess: async (detail) => {
            toast.success("Đã lưu QĐLH")
            await queryClient.invalidateQueries({ queryKey: ["circulation-decisions"] })
            setSelected(detail)
            setForm(detail)
            setDraftProducts([])
            setPdfFile(null)
            setProductForm(emptyProduct)
            setProductErrors({})
            if (fileInputRef.current) fileInputRef.current.value = ""
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
        if (fileInputRef.current) fileInputRef.current.value = ""
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
        if (fileInputRef.current) fileInputRef.current.value = ""
        setDialogOpen(true)
    }

    return (
        <PageSection
            isLoading={decisionsQuery.isLoading}
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
                    <Input
                        className="max-w-xl"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm số QĐLH hoặc tên sản phẩm..."
                    />

                    <div className="overflow-auto rounded-md border bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-36">Số QĐLH</TableHead>
                                    <TableHead className="min-w-28">Ngày cấp</TableHead>
                                    <TableHead className="min-w-32">Ngày hết hạn</TableHead>
                                    <TableHead className="min-w-[360px]">Sản phẩm thuộc quyết định</TableHead>
                                    <TableHead className="min-w-40">Ghi chú</TableHead>
                                    <TableHead className="min-w-24">PDF</TableHead>
                                    <TableHead className="w-28 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {page.items.map((item) => {
                                    const products = item.products ?? []
                                    const expanded = expandedRows.includes(item.id)
                                    const visibleProducts = expanded ? products : products.slice(0, 5)

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.decision_no}</TableCell>
                                            <TableCell>{formatDate(item.issued_date)}</TableCell>
                                            <TableCell>{formatDate(item.expired_date)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {visibleProducts.map((product) => (
                                                        <span
                                                            key={product.id}
                                                            className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                                                            title={`${product.product_name} - ${product.circulation_code}`}
                                                        >
                                                            {product.product_name}
                                                        </span>
                                                    ))}
                                                    {products.length === 0 ? (
                                                        <span className="text-sm text-muted-foreground">Chưa có sản phẩm</span>
                                                    ) : null}
                                                    {products.length > 5 ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => setExpandedRows(toggle(expandedRows, item.id, !expanded))}
                                                        >
                                                            {expanded ? "Thu gọn" : `Xem thêm ${products.length - 5}`}
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-56 truncate">{item.note}</TableCell>
                                            <TableCell>{item.pdf_file_name ? item.pdf_file_name : ""}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={!item.pdf_file_name}
                                                        onClick={() => downloadCirculationDecisionPdf(item.id, item.pdf_file_name)}
                                                    >
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                    {canUpdateDecisions ? (
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

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
                            setDraftProducts([...draftProducts, { ...productForm, tempId: crypto.randomUUID() }])
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
                    />

                    <input
                        ref={fileInputRef}
                        className="hidden"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                </div>
            )}
        </PageSection>
    )
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
}) {
    const products = [
        ...(selected?.products ?? []).map((product) => ({ ...product, tempId: `saved-${product.id}` })),
        ...draftProducts,
    ]

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
    return {
        decision_no: form.decision_no?.trim(),
        issued_date: form.issued_date || undefined,
        expired_date: form.expired_date || undefined,
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

function formatDate(value?: string) {
    if (!value) return ""
    return value.slice(0, 10).split("-").reverse().join("/")
}
