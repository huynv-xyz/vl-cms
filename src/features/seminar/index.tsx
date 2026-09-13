import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, FileDown, FileText, Loader2, Pencil, Plus, Save, Search, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { getMyPermissions } from "@/api/auth/permission"
import {
    createSeminar,
    downloadSeminarCirculationDecisionFiles,
    downloadSeminarDocument,
    downloadSeminarTemplate,
    generateSeminarDocument,
    getSeminar,
    listCirculationProducts,
    listSeminars,
    replaceSeminarProducts,
    updateSeminar,
    uploadSeminarTemplate,
} from "@/api/seminar"
import type { CirculationProduct, Seminar } from "./data/schema"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const emptySeminar: Partial<Seminar> = {
    code: "",
    name: "tư vấn kỹ thuật trên cây sầu riêng",
    customer_id: undefined,
    dealer_name: "",
    dealer_address: "",
    dealer_contact_name: "",
    dealer_contact_phone: "",
    permission_authority: "",
    permit_application_date: todayDateString(),
    seminar_date: todayDateString(),
    start_time: "",
    venue_address: "",
    contact_name: "",
    contact_phone: "",
    reporter_employee_id: undefined,
    reporter_employee_code: "",
    reporter_employee_name: "",
    attendee_count: undefined,
    status: "PLANNED",
    note: "",
}

const statuses = [
    { value: "PLANNED", label: "Dự kiến" },
    { value: "CANCELLED", label: "Hủy" },
]

export default function SeminarPage() {
    const queryClient = useQueryClient()
    const permitTemplateRef = useRef<HTMLInputElement | null>(null)
    const invitationTemplateRef = useRef<HTMLInputElement | null>(null)
    const [keyword, setKeyword] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<"view" | "edit">("view")
    const [selected, setSelected] = useState<Seminar | null>(null)
    const [form, setForm] = useState<Partial<Seminar>>({ ...emptySeminar, code: nextCode() })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [productKeyword, setProductKeyword] = useState("")
    const debouncedProductKeyword = useDebouncedValue(productKeyword, 300)
    const [productSearchOpen, setProductSearchOpen] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState<CirculationProduct[]>([])
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canUpdateSeminars = hasPermission(permissionsQuery.data ?? [], "seminars", "update")

    const seminarsQuery = useQuery({
        queryKey: ["seminars", keyword],
        queryFn: () => listSeminars({ page: 1, size: 100, keyword }),
    })

    const circulationProductsQuery = useQuery({
        queryKey: ["circulation-products", debouncedProductKeyword, dialogOpen],
        enabled: dialogOpen && productSearchOpen,
        queryFn: () => listCirculationProducts({
            page: 1,
            size: 50,
            keyword: debouncedProductKeyword,
            active_only: true,
        }),
    })

    const saveSeminar = useMutation({
        mutationFn: async () => {
            const payload = normalizePayload(form)
            const seminar = selected?.id
                ? await updateSeminar(selected.id, payload)
                : await createSeminar(payload)
            try {
                await replaceSeminarProducts(seminar.id, selectedProducts.map((product) => product.id))
            } catch (error: any) {
                error.seminar = seminar
                throw error
            }
            return getSeminar(seminar.id)
        },
        onSuccess: async (detail) => {
            toast.success("Đã lưu hội thảo")
            await queryClient.invalidateQueries({ queryKey: ["seminars"] })
            setSelected(detail)
            setForm(detail)
            setSelectedProducts(fromSeminarProducts(detail))
            setDialogOpen(false)
        },
        onError: async (e: any) => {
            if (e?.seminar?.id) {
                const seminar = e.seminar as Seminar
                setSelected(seminar)
                setForm(seminar)
                await queryClient.invalidateQueries({ queryKey: ["seminars"] })
                toast.error(`Đã tạo hội thảo nhưng chưa lưu được sản phẩm: ${e?.message || "Không có quyền"}`)
                return
            }
            toast.error(e?.message || "Không lưu được hội thảo")
        },
    })

    function openCreateDialog() {
        setSelected(null)
        setForm({ ...emptySeminar, code: nextCode() })
        setSelectedProducts([])
        setProductKeyword("")
        setProductSearchOpen(false)
        setErrors({})
        setDialogMode("edit")
        setDialogOpen(true)
    }

    async function openDetailDialog(item: Seminar) {
        const detail = await getSeminar(item.id)
        setSelected(detail)
        setForm(detail)
        setSelectedProducts(fromSeminarProducts(detail))
        setProductKeyword("")
        setProductSearchOpen(false)
        setErrors({})
        setDialogMode("view")
        setDialogOpen(true)
    }

    function onCustomerChange(customerId: number | undefined, option?: any) {
        const customer = option?.raw
        setForm({
            ...form,
            customer_id: customerId,
            customer_code: customer?.code,
            dealer_name: customer?.name ?? form.dealer_name,
            dealer_address: customer?.address ?? form.dealer_address,
            dealer_contact_phone: customer?.phone ?? form.dealer_contact_phone,
            contact_phone: customer?.phone ?? form.contact_phone,
        })
        setErrors(withoutError(errors, "customer_id", "dealer_name"))
    }

    function onReporterChange(employeeId: number | undefined, option?: any) {
        const employee = option?.raw
        setForm({
            ...form,
            reporter_employee_id: employeeId,
            reporter_employee_code: employee?.code,
            reporter_employee_name: employee?.name ?? "",
        })
        setErrors(withoutError(errors, "reporter_employee_id"))
    }

    async function onUploadTemplate(template: "permit_application" | "invitation", file?: File) {
        if (!file) return
        try {
            await uploadSeminarTemplate(template, file)
            toast.success("Đã upload mẫu Word")
        } catch (e: any) {
            toast.error(e?.message || "Upload mẫu thất bại")
        } finally {
            if (permitTemplateRef.current) permitTemplateRef.current.value = ""
            if (invitationTemplateRef.current) invitationTemplateRef.current.value = ""
        }
    }

    async function onDownloadTemplate(template: "permit_application" | "invitation") {
        try {
            await downloadSeminarTemplate(template)
        } catch (e: any) {
            toast.error(e?.message || "Chưa tải được mẫu Word")
        }
    }

    async function onGenerate(type: "permit" | "invitation") {
        if (!selected?.id) return
        try {
            const doc = await generateSeminarDocument(selected.id, type)
            toast.success("Đã tạo file Word")
            await downloadSeminarDocument(doc.id)
            await queryClient.invalidateQueries({ queryKey: ["seminars"] })
            const detail = await getSeminar(selected.id)
            setSelected(detail)
            setForm(detail)
        } catch (e: any) {
            toast.error(e?.message || "Không tạo được file Word")
        }
    }

    async function onDownloadDocument(id: number) {
        try {
            await downloadSeminarDocument(id)
        } catch (e: any) {
            toast.error(e?.message || "Không tải được tài liệu")
        }
    }

    async function onDownloadCirculationDecisionFiles(seminar: Seminar) {
        try {
            await downloadSeminarCirculationDecisionFiles(seminar.id, `QDLH - ${seminar.code}.zip`)
        } catch (e: any) {
            toast.error(e?.message || "Không tải được file QĐLH")
        }
    }

    function onSave() {
        const nextErrors = validateSeminar(form)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return
        saveSeminar.mutate()
    }

    function addProduct(product: CirculationProduct) {
        if (selectedProducts.some((item) => item.id === product.id)) return
        setSelectedProducts([...selectedProducts, product])
        setProductKeyword("")
        setProductSearchOpen(false)
    }

    const productResults = (circulationProductsQuery.data?.items ?? []).filter(
        (product) => !selectedProducts.some((item) => item.id === product.id),
    )

    return (
        <PageSection
            isLoading={seminarsQuery.isLoading}
            error={seminarsQuery.error}
            title="Hội thảo"
            description="Quản lý hồ sơ hội thảo, sản phẩm lưu hành và tài liệu xin phép/thư mời."
            actions={canUpdateSeminars ? (
                <div className="flex flex-wrap gap-2">
                    <input ref={permitTemplateRef} type="file" accept=".docx" className="hidden" onChange={(e) => onUploadTemplate("permit_application", e.target.files?.[0])} />
                    <input ref={invitationTemplateRef} type="file" accept=".docx" className="hidden" onChange={(e) => onUploadTemplate("invitation", e.target.files?.[0])} />
                    <Button variant="outline" onClick={() => permitTemplateRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload mẫu đơn
                    </Button>
                    <Button variant="outline" onClick={() => onDownloadTemplate("permit_application")}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Tải mẫu đơn
                    </Button>
                    <Button variant="outline" onClick={() => invitationTemplateRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload mẫu thư
                    </Button>
                    <Button variant="outline" onClick={() => onDownloadTemplate("invitation")}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Tải mẫu thư
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo hội thảo
                    </Button>
                </div>
            ) : null}
            data={seminarsQuery.data}
        >
            {(page) => (
                <div className="space-y-4">
                    <Input
                        className="max-w-xl"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm tên hội thảo, đại lý, báo cáo viên, địa điểm..."
                    />

                    <div className="overflow-auto rounded-md border bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[280px]">Hội thảo</TableHead>
                                    <TableHead className="min-w-48">Khách hàng/đại lý</TableHead>
                                    <TableHead className="min-w-44">Báo cáo viên</TableHead>
                                    <TableHead className="min-w-28">Ngày</TableHead>
                                    <TableHead className="min-w-32">Trạng thái</TableHead>
                                    <TableHead className="min-w-28 text-right">Tham dự</TableHead>
                                    <TableHead className="min-w-48">Địa điểm</TableHead>
                                    <TableHead className="min-w-28 text-right">Sản phẩm</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {page.items.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="cursor-pointer"
                                        onClick={() => openDetailDialog(item)}
                                    >
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.dealer_name}</TableCell>
                                        <TableCell>{item.reporter_employee_name || "-"}</TableCell>
                                        <TableCell>{formatDate(item.seminar_date)}</TableCell>
                                        <TableCell>{seminarStatusLabel(item)}</TableCell>
                                        <TableCell className="text-right">{item.attendee_count ?? "-"}</TableCell>
                                        <TableCell className="max-w-72 truncate">{item.venue_address}</TableCell>
                                        <TableCell className="text-right">{item.product_count ?? item.products?.length ?? 0}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <SeminarDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        mode={dialogMode}
                        setMode={setDialogMode}
                        selected={selected}
                        form={form}
                        setForm={setForm}
                        errors={errors}
                        setErrors={setErrors}
                        selectedProducts={selectedProducts}
                        setSelectedProducts={setSelectedProducts}
                        productKeyword={productKeyword}
                        setProductKeyword={setProductKeyword}
                        productSearchOpen={productSearchOpen}
                        setProductSearchOpen={setProductSearchOpen}
                                productResults={productResults}
                        productsLoading={circulationProductsQuery.isFetching}
                        seminarDate={form.seminar_date}
                        canUpdate={canUpdateSeminars}
                        saving={saveSeminar.isPending}
                        onCustomerChange={onCustomerChange}
                        onReporterChange={onReporterChange}
                        onAddProduct={addProduct}
                        onSave={onSave}
                        onGenerate={onGenerate}
                        onDownloadDocument={onDownloadDocument}
                        onDownloadCirculationDecisionFiles={onDownloadCirculationDecisionFiles}
                    />
                </div>
            )}
        </PageSection>
    )
}

function SeminarDialog({
    open,
    onOpenChange,
    mode,
    setMode,
    selected,
    form,
    setForm,
    errors,
    setErrors,
    selectedProducts,
    setSelectedProducts,
    productKeyword,
    setProductKeyword,
    productSearchOpen,
    setProductSearchOpen,
    productResults,
    productsLoading,
    seminarDate,
    canUpdate,
    saving,
    onCustomerChange,
    onReporterChange,
    onAddProduct,
    onSave,
    onGenerate,
    onDownloadDocument,
    onDownloadCirculationDecisionFiles,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "view" | "edit"
    setMode: (mode: "view" | "edit") => void
    selected: Seminar | null
    form: Partial<Seminar>
    setForm: (form: Partial<Seminar>) => void
    errors: Record<string, string>
    setErrors: (errors: Record<string, string>) => void
    selectedProducts: CirculationProduct[]
    setSelectedProducts: (products: CirculationProduct[]) => void
    productKeyword: string
    setProductKeyword: (keyword: string) => void
    productSearchOpen: boolean
    setProductSearchOpen: (open: boolean) => void
    productResults: CirculationProduct[]
    productsLoading: boolean
    seminarDate?: string
    canUpdate: boolean
    saving: boolean
    onCustomerChange: (customerId: number | undefined, option?: any) => void
    onReporterChange: (employeeId: number | undefined, option?: any) => void
    onAddProduct: (product: CirculationProduct) => void
    onSave: () => void
    onGenerate: (type: "permit" | "invitation") => void
    onDownloadDocument: (id: number) => void
    onDownloadCirculationDecisionFiles: (seminar: Seminar) => void
}) {
    const isEditing = !selected?.id || mode === "edit"

    const customerInitialOption = useMemo(() => {
        if (!form.customer_id) return undefined
        return {
            value: form.customer_id,
            label: `${form.customer_code ? `${form.customer_code} - ` : ""}${form.dealer_name ?? ""}`,
            raw: null,
        }
    }, [form.customer_code, form.customer_id, form.dealer_name])

    const reporterInitialOption = useMemo(() => {
        if (!form.reporter_employee_id) return undefined
        return {
            value: form.reporter_employee_id,
            label: `${form.reporter_employee_code ? `${form.reporter_employee_code} - ` : ""}${form.reporter_employee_name ?? ""}`,
            raw: null,
        }
    }, [form.reporter_employee_code, form.reporter_employee_id, form.reporter_employee_name])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] !w-[95vw] flex-col overflow-hidden p-7 sm:!max-w-[1240px]">
                <DialogHeader>
                    <DialogTitle>{selected?.id ? "Chi tiết hội thảo" : "Tạo hội thảo"}</DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Field label="Tên hội thảo" placeholders="seminar_name">
                            {isEditing ? (
                                <>
                                    <Input
                                        aria-invalid={Boolean(errors.name)}
                                        className={cn(errors.name && "border-destructive focus-visible:ring-destructive/30")}
                                        value={form.name ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, name: e.target.value })
                                            setErrors(withoutError(errors, "name"))
                                        }}
                                    />
                                    <FieldError message={errors.name} />
                                </>
                            ) : <DisplayValue value={form.name} />}
                        </Field>
                        <Field label="Khách hàng/đại lý">
                            {isEditing ? (
                                <>
                                    <AsyncSelect
                                        value={form.customer_id}
                                        onChange={onCustomerChange}
                                        dataSource={customerDataSource()}
                                        mapOption={customerOption}
                                        initialOption={customerInitialOption}
                                        placeholder="Chọn khách hàng"
                                        searchPlaceholder="Tìm mã hoặc tên khách hàng..."
                                        popoverContentClassName="w-[min(760px,calc(100vw-3rem))]"
                                        optionWrapLabel
                                        required
                                    />
                                    <FieldError message={errors.customer_id} />
                                </>
                            ) : <DisplayValue value={form.dealer_name} />}
                        </Field>
                        <Field label="Trạng thái">
                            {isEditing ? (
                                <Select value={form.status ?? "PLANNED"} onValueChange={(value) => setForm({ ...form, status: value })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : <DisplayValue value={selected ? seminarStatusLabel(selected) : statusLabel(form.status)} />}
                        </Field>
                        <Field label="Báo cáo viên" placeholders="reporter_employee_name">
                            {isEditing ? (
                                <>
                                    <AsyncSelect
                                        value={form.reporter_employee_id}
                                        onChange={onReporterChange}
                                        dataSource={employeeDataSource()}
                                        mapOption={employeeOption}
                                        initialOption={reporterInitialOption}
                                        placeholder="Chọn nhân viên"
                                        searchPlaceholder="Tìm mã hoặc tên nhân viên..."
                                        popoverContentClassName="w-[min(640px,calc(100vw-3rem))]"
                                        optionWrapLabel
                                    />
                                    <FieldError message={errors.reporter_employee_id} />
                                </>
                            ) : <DisplayValue value={form.reporter_employee_name} />}
                        </Field>
                        <Field label="Tên đại lý trên hồ sơ" placeholders="dealer_name">
                            {isEditing ? (
                                <>
                                    <Input
                                        aria-invalid={Boolean(errors.dealer_name)}
                                        className={cn(errors.dealer_name && "border-destructive focus-visible:ring-destructive/30")}
                                        value={form.dealer_name ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, dealer_name: e.target.value })
                                            setErrors(withoutError(errors, "dealer_name"))
                                        }}
                                    />
                                    <FieldError message={errors.dealer_name} />
                                </>
                            ) : <DisplayValue value={form.dealer_name} />}
                        </Field>
                        <Field label="Người liên hệ đại lý" placeholders="dealer_contact_name">
                            {isEditing ? (
                                <Input
                                    value={form.dealer_contact_name ?? ""}
                                    onChange={(e) => setForm({ ...form, dealer_contact_name: e.target.value })}
                                />
                            ) : <DisplayValue value={form.dealer_contact_name} />}
                        </Field>
                        <Field label="SĐT liên hệ đại lý" placeholders="dealer_contact_phone">
                            {isEditing ? (
                                <Input
                                    value={form.dealer_contact_phone ?? ""}
                                    onChange={(e) => setForm({ ...form, dealer_contact_phone: e.target.value })}
                                />
                            ) : <DisplayValue value={form.dealer_contact_phone} />}
                        </Field>
                        <Field label="Nơi xin phép" placeholders="permission_authority">
                            {isEditing ? (
                                <Input value={form.permission_authority ?? ""} onChange={(e) => setForm({ ...form, permission_authority: e.target.value })} />
                            ) : <DisplayValue value={form.permission_authority} />}
                        </Field>
                        <Field label="Ngày đơn xin phép" placeholders={["permit_application_date", "permit_application_date_code"]}>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={form.permit_application_date ?? ""}
                                    onChange={(e) => setForm({ ...form, permit_application_date: e.target.value })}
                                />
                            ) : <DisplayValue value={formatDate(form.permit_application_date)} />}
                        </Field>
                        <Field label="Ngày hội thảo" placeholders={["seminar_date", "seminar_date_text"]}>
                            {isEditing ? (
                                <>
                                    <Input
                                        aria-invalid={Boolean(errors.seminar_date)}
                                        className={cn(errors.seminar_date && "border-destructive focus-visible:ring-destructive/30")}
                                        type="date"
                                        value={form.seminar_date ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, seminar_date: e.target.value })
                                            setErrors(withoutError(errors, "seminar_date"))
                                        }}
                                    />
                                    <FieldError message={errors.seminar_date} />
                                </>
                            ) : <DisplayValue value={formatDate(form.seminar_date)} />}
                        </Field>
                        <Field label="Giờ bắt đầu" placeholders="seminar_time">
                            {isEditing ? (
                                <Input type="time" value={(form.start_time ?? "").slice(0, 5)} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                            ) : <DisplayValue value={(form.start_time ?? "").slice(0, 5)} />}
                        </Field>
                        <Field label="Người liên hệ" placeholders="contact_name">
                            {isEditing ? (
                                <Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                            ) : <DisplayValue value={form.contact_name} />}
                        </Field>
                        <Field label="Điện thoại" placeholders="contact_phone">
                            {isEditing ? (
                                <Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                            ) : <DisplayValue value={form.contact_phone} />}
                        </Field>
                        <Field label="Số lượng tham dự" placeholders="attendee_count">
                            {isEditing ? (
                                <>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.attendee_count ?? ""}
                                        onChange={(e) => {
                                            setForm({ ...form, attendee_count: e.target.value === "" ? undefined : Number(e.target.value) })
                                            setErrors(withoutError(errors, "attendee_count"))
                                        }}
                                    />
                                    <FieldError message={errors.attendee_count} />
                                </>
                            ) : <DisplayValue value={form.attendee_count} />}
                        </Field>
                        <div className="lg:col-span-2">
                            <Field label="Địa chỉ tổ chức" placeholders="venue_address">
                                {isEditing ? (
                                    <Input value={form.venue_address ?? ""} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} />
                                ) : <DisplayValue value={form.venue_address} />}
                            </Field>
                        </div>
                        <div className="lg:col-span-3">
                            <Field label="Ghi chú">
                                {isEditing ? (
                                    <Textarea value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                                ) : <DisplayValue value={form.note} multiline />}
                            </Field>
                        </div>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold">Sản phẩm lưu hành dùng trong hội thảo</div>
                                <PlaceholderHint
                                    placeholders={["index", "product_type", "product_name", "circulation_code", "decision_no", "issued_date", "expired_date"]}
                                />
                            </div>
                            {canUpdate && isEditing ? (
                                <ProductSearchPicker
                                    open={productSearchOpen}
                                    onOpenChange={setProductSearchOpen}
                                    keyword={productKeyword}
                                    onKeywordChange={setProductKeyword}
                                    products={productResults}
                                    loading={productsLoading}
                                    seminarDate={seminarDate}
                                    onSelect={onAddProduct}
                                />
                            ) : null}
                        </div>

                        <div className="overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sản phẩm đã chọn</TableHead>
                                        <TableHead>Mã số sản phẩm</TableHead>
                                        <TableHead>QĐLH</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedProducts.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-muted-foreground">Chưa chọn sản phẩm</TableCell></TableRow>
                                    ) : selectedProducts.map((product) => {
                                        const warning = circulationExpiryWarning(product, seminarDate)
                                        return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-medium">
                                                    {warning ? (
                                                        <AlertTriangle
                                                            className="h-4 w-4 shrink-0 text-amber-600"
                                                            aria-label={warning}
                                                        />
                                                    ) : null}
                                                    <span>{product.product_name}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">{product.product_type}</div>
                                                {warning ? <div className="text-xs font-medium text-amber-700">{warning}</div> : null}
                                            </TableCell>
                                            <TableCell>{product.circulation_code}</TableCell>
                                            <TableCell>{product.decision?.decision_no}</TableCell>
                                            <TableCell>
                                                {canUpdate && isEditing ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedProducts(selectedProducts.filter((item) => item.id !== product.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {selected?.documents?.length ? (
                        <div className="space-y-2 border-t pt-4">
                            <div className="text-sm font-semibold">Tài liệu đã tạo</div>
                            {selected.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{doc.file_name}</div>
                                        <div className="text-xs text-muted-foreground">{doc.document_type} - {doc.generated_at}</div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => onDownloadDocument(doc.id)}>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Tải Word
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="border-t pt-4 sm:justify-between">
                    {canUpdate ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={!selected?.id || selectedProducts.length === 0}
                                    onClick={() => selected && onDownloadCirculationDecisionFiles(selected)}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Tải QĐLH
                                </Button>
                                <Button variant="outline" type="button" disabled={!selected?.id} onClick={() => onGenerate("permit")}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Tạo đơn xin phép
                                </Button>
                                <Button variant="outline" type="button" disabled={!selected?.id} onClick={() => onGenerate("invitation")}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Tạo thư mời
                                </Button>
                            </div>
                            {isEditing ? (
                                <Button type="button" onClick={onSave} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Lưu hội thảo
                                </Button>
                            ) : (
                                <Button type="button" onClick={() => setMode("edit")}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Sửa thông tin
                                </Button>
                            )}
                        </>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Field({ label, placeholders, children }: { label: string; placeholders?: string | string[]; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <Label>{label}</Label>
                <PlaceholderHint placeholders={placeholders} />
            </div>
            {children}
        </div>
    )
}

function PlaceholderHint({ placeholders }: { placeholders?: string | string[] }) {
    if (!placeholders) return null
    const items = Array.isArray(placeholders) ? placeholders : [placeholders]
    return (
        <div className="flex flex-wrap items-center gap-1">
            {items.map((item) => (
                <code key={item} className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {`{{${item}}}`}
                </code>
            ))}
        </div>
    )
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <div className="text-xs font-medium text-destructive">{message}</div>
}

function DisplayValue({ value, multiline }: { value?: ReactNode; multiline?: boolean }) {
    const isEmpty = value === undefined || value === null || value === ""
    return (
        <div className={cn(
            "min-h-10 rounded-md border bg-muted/20 px-3 py-2 text-sm",
            multiline && "min-h-20 whitespace-pre-wrap",
            isEmpty && "text-muted-foreground",
        )}>
            {isEmpty ? "-" : value}
        </div>
    )
}

function customerDataSource() {
    return {
        getList: (params: any) => listCustomers({ page: 1, size: 20, keyword_scope: "code_name", ...params }),
        getById: (id: number) => getCustomer(id),
    }
}

function customerOption(customer: any) {
    return {
        value: customer.id,
        label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
        raw: customer,
    }
}

function employeeDataSource() {
    return {
        getList: (params: any) => listEmployees({ page: 1, size: 20, status: "1", ...params }),
        getById: (id: number) => getEmployee(id),
    }
}

function employeeOption(employee: any) {
    return {
        value: employee.id,
        label: `${employee.code ? `${employee.code} - ` : ""}${employee.name}`,
        raw: employee,
    }
}

function ProductSearchPicker({
    open,
    onOpenChange,
    keyword,
    onKeywordChange,
    products,
    loading,
    seminarDate,
    onSelect,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    keyword: string
    onKeywordChange: (keyword: string) => void
    products: CirculationProduct[]
    loading: boolean
    seminarDate?: string
    onSelect: (product: CirculationProduct) => void
}) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start md:w-[460px]">
                    <Search className="mr-2 h-4 w-4" />
                    Tìm và thêm sản phẩm lưu hành
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(760px,calc(100vw-3rem))] p-0" align="end">
                <Command shouldFilter={false}>
                    <CommandInput
                        value={keyword}
                        onValueChange={onKeywordChange}
                        placeholder="Tìm tên sản phẩm, loại, mã số sản phẩm..."
                    />
                    <CommandList className="max-h-80">
                        <CommandEmpty>{loading ? "Đang tải sản phẩm..." : "Không có sản phẩm phù hợp"}</CommandEmpty>
                        {products.map((product) => {
                            const warning = circulationExpiryWarning(product, seminarDate)
                            return (
                                <CommandItem
                                    key={product.id}
                                    value={`${product.product_name} ${product.circulation_code}`}
                                    onSelect={() => onSelect(product)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            {warning ? (
                                                <AlertTriangle
                                                    className="h-4 w-4 shrink-0 text-amber-600"
                                                    aria-label={warning}
                                                />
                                            ) : null}
                                            <span className="truncate font-medium">{product.product_name}</span>
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {product.product_type} - {product.circulation_code} - {product.decision?.decision_no ?? ""}
                                        </div>
                                        {warning ? (
                                            <div className="text-xs font-medium text-amber-700">{warning}</div>
                                        ) : null}
                                    </div>
                                    <Plus className="h-4 w-4" />
                                </CommandItem>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function fromSeminarProducts(seminar: Seminar): CirculationProduct[] {
    return (seminar.products ?? []).map((product) => ({
        id: product.circulation_product_id,
        decision_id: 0,
        product_type: product.product_type,
        product_name: product.product_name,
        circulation_code: product.circulation_code,
        decision: {
            id: 0,
            decision_no: product.decision_no,
            issued_date: product.issued_date,
            expired_date: product.expired_date,
        },
    }))
}

function circulationExpiryWarning(product: CirculationProduct, seminarDate?: string) {
    const expiredDate = product.decision?.expired_date
    if (!expiredDate) return ""
    const checkDate = (seminarDate || new Date().toISOString().slice(0, 10)).slice(0, 10)
    const expiry = expiredDate.slice(0, 10)
    if (expiry >= checkDate) return ""
    return `QĐLH hết hiệu lực ngày ${formatDate(expiry)}`
}

function validateSeminar(form: Partial<Seminar>) {
    const errors: Record<string, string> = {}
    if (!form.name?.trim()) errors.name = "Vui lòng nhập tên hội thảo"
    if (!form.customer_id) errors.customer_id = "Vui lòng chọn khách hàng/đại lý"
    if (!form.dealer_name?.trim()) errors.dealer_name = "Vui lòng nhập tên đại lý trên hồ sơ"
    if (!form.seminar_date) errors.seminar_date = "Vui lòng chọn ngày hội thảo"
    if (form.attendee_count != null && form.attendee_count < 0) errors.attendee_count = "Số lượng tham dự không được âm"
    return errors
}

function withoutError(errors: Record<string, string>, ...keys: string[]) {
    const next = { ...errors }
    keys.forEach((key) => delete next[key])
    return next
}

function statusLabel(value?: string) {
    return statuses.find((status) => status.value === value)?.label ?? value ?? ""
}

function seminarStatusLabel(seminar: Seminar) {
    if (seminar.status === "CANCELLED") return "Hủy"
    const date = (seminar.seminar_date ?? "").slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    if (!date) return "Dự kiến"
    if (date > today) return "Dự kiến"
    if (date < today) return "Đã diễn ra"
    return "Đang diễn ra"
}

function formatDate(value?: string) {
    if (!value) return ""
    return value.slice(0, 10).split("-").reverse().join("/")
}

function normalizePayload(form: Partial<Seminar>) {
    return {
        code: form.code || nextCode(),
        name: form.name?.trim(),
        customer_id: form.customer_id,
        customer_code: form.customer_code,
        dealer_name: form.dealer_name?.trim(),
        dealer_address: form.dealer_address?.trim() || undefined,
        dealer_contact_name: form.dealer_contact_name?.trim() || undefined,
        dealer_contact_phone: form.dealer_contact_phone?.trim() || undefined,
        permission_authority: form.permission_authority?.trim() || undefined,
        permit_application_date: form.permit_application_date || todayDateString(),
        seminar_date: form.seminar_date || undefined,
        start_time: form.start_time || undefined,
        venue_address: form.venue_address?.trim() || undefined,
        contact_name: form.contact_name?.trim() || undefined,
        contact_phone: form.contact_phone?.trim() || undefined,
        reporter_employee_id: form.reporter_employee_id,
        reporter_employee_code: form.reporter_employee_code,
        reporter_employee_name: form.reporter_employee_name,
        attendee_count: form.attendee_count,
        status: form.status || "PLANNED",
        note: form.note?.trim() || undefined,
    }
}

function nextCode() {
    return `HT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-5)}`
}

function todayDateString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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
