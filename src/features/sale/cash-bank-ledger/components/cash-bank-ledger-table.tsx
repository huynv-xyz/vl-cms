import type React from "react"
import { useMemo, useRef, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, Plus, Upload, WalletCards } from "lucide-react"
import { toast } from "sonner"

import {
    createArLedger,
    deleteArLedger,
    importBankArLedgers,
    importOpeningArLedgers,
    listArLedgers,
    updateArLedger,
    type ArLedgerListParams,
} from "@/api/sale/ar-ledger"
import { getCustomer, listCustomers } from "@/api/customer"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
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
}

type FormState = {
    id?: number
    posting_date: string
    doc_date: string
    doc_no: string
    customer_id?: number
    customer_name?: string
    direction: "IN" | "OUT"
    amount: string
    account_code: string
    description: string
}

const emptyForm = (): FormState => ({
    posting_date: new Date().toISOString().slice(0, 10),
    doc_date: new Date().toISOString().slice(0, 10),
    doc_no: "",
    customer_id: undefined,
    customer_name: "",
    direction: "IN",
    amount: "",
    account_code: "131",
    description: "",
})

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

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
}: Props) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [exporting, setExporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const incomingLabel = sourceType === "OPENING"
        ? "Có đầu kỳ"
        : sourceType === "ADJUST" ? "Giảm nợ" : "Tiền vào"
    const outgoingLabel = sourceType === "OPENING"
        ? "Nợ đầu kỳ"
        : sourceType === "ADJUST" ? "Tăng nợ" : "Tiền ra"
    const today = todayYmd()
    const shouldConstrainDateFilters = sourceType === "ADJUST"

    const totals = useMemo(() => {
        const incoming = data.reduce((sum, row) => sum + Number(row.credit_amount || 0), 0)
        const outgoing = data.reduce((sum, row) => sum + Number(row.debit_amount || 0), 0)
        return { incoming, outgoing, net: incoming - outgoing }
    }, [data])

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
            toast.success(
                sourceType === "OPENING"
                    ? `Đã import ${count} số dư đầu kỳ`
                    : `Đã import ${count} giao dịch ngân hàng`,
            )
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        },
        onError: (error: any) => toast.error(error?.message || "Import Excel thất bại"),
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

            exportAdjustmentXlsx(rows, {
                incomingLabel,
                outgoingLabel,
                period: periodLabel(filters.from_date, filters.to_date),
            })
            toast.success(`Đã xuất ${rows.length} dòng điều chỉnh công nợ`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất báo cáo thất bại")
        } finally {
            setExporting(false)
        }
    }

    const openEdit = (row: ArLedger) => {
        const debit = Number(row.debit_amount || 0)
        const credit = Number(row.credit_amount || 0)
        setForm({
            id: row.id,
            posting_date: dateOnly(row.posting_date) || new Date().toISOString().slice(0, 10),
            doc_date: dateOnly(row.doc_date) || dateOnly(row.posting_date) || new Date().toISOString().slice(0, 10),
            doc_no: row.doc_no || "",
            customer_id: row.customer_id,
            customer_name: row.customer?.name || row.customer_name || "",
            direction: debit > 0 ? "OUT" : "IN",
            amount: String(debit > 0 ? debit : credit),
            account_code: row.account_code || "131",
            description: row.description || "",
        })
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

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-white shadow-sm">
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
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {importMutation.isPending ? "Đang import..." : "Import Excel"}
                                </Button>
                            </>
                        ) : null}
                        {sourceType === "ADJUST" ? (
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

                <div className="space-y-2 p-4">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm chứng từ, khách hàng, nội dung..."
                            wrapperClassName="relative h-10 min-w-[300px] flex-[1.3_1_0]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[260px] flex-[1.6_1_0] py-0")}
                            value={filters.customer_id}
                            onChange={(value: number | undefined) =>
                                setFilter("customer_id", value || undefined)
                            }
                            placeholder="Khách hàng"
                            dataSource={{
                                getList: listCustomers,
                                getById: getCustomer,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={customerOption}
                            wrapLabel
                        />
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2">
                        <DatePicker
                            className={cn(
                                "h-10 min-w-[170px] flex-1",
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
                                "h-10 min-w-[170px] flex-1",
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

            <div className="grid gap-3 md:grid-cols-3">
                <Summary label={incomingLabel} value={formatMoney(totals.incoming)} tone="success" />
                <Summary label={sourceType === "BANK" ? "Tiền ra / hoàn" : outgoingLabel} value={formatMoney(totals.outgoing)} tone="danger" />
                <Summary label="Chênh lệch" value={formatMoney(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} />
            </div>

            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] text-sm">
                        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="w-12 px-3 py-3 text-center">#</th>
                                <th className="px-3 py-3 text-left">Ngày</th>
                                <th className="px-3 py-3 text-left">Chứng từ</th>
                                <th className="min-w-[170px] px-3 py-3 text-left">Mã KH</th>
                                <th className="px-3 py-3 text-left">Khách hàng</th>
                                <th className="px-3 py-3 text-left">Diễn giải</th>
                                <th className="px-3 py-3 text-left">TK đối ứng</th>
                                <th className="px-3 py-3 text-right">{incomingLabel}</th>
                                <th className="px-3 py-3 text-right">{outgoingLabel}</th>
                                <th className="w-12 px-2 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">
                                        {emptyText}
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                        <td className="px-3 py-3 text-center text-xs text-slate-500">
                                            {pagination.pageIndex * pagination.pageSize + index + 1}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                                            {formatDate(row.posting_date)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-mono text-xs font-semibold text-sky-700">
                                                {row.doc_no || `#${row.id}`}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="inline-flex max-w-[220px] whitespace-normal break-words rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold leading-snug text-slate-700">
                                                {row.customer?.code || `#${row.customer_id}`}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-slate-950">
                                                {row.customer?.name || row.customer_name || "-"}
                                            </div>
                                        </td>
                                        <td className="max-w-[360px] px-3 py-3">
                                            <div className="line-clamp-2 text-slate-700">
                                                {row.description || "-"}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-slate-700">
                                            {row.account_code || "-"}
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">
                                            {formatMoney(row.credit_amount)}
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-rose-700">
                                            {formatMoney(row.debit_amount)}
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <CrudRowActions
                                                row={row}
                                                onEdit={openEdit}
                                                onDelete={async (item) => {
                                                    await deleteMutation.mutateAsync(item.id)
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
                        <Input
                            type="date"
                            value={form.posting_date}
                            onChange={(event) => update({ posting_date: event.target.value })}
                        />
                    </Field>
                    <Field label="Ngày chứng từ">
                        <Input
                            type="date"
                            value={form.doc_date}
                            onChange={(event) => update({ doc_date: event.target.value })}
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
                    <Field label="Khách hàng" className="md:col-span-2">
                        <AsyncSelect
                            value={form.customer_id}
                            onChange={(value: number | undefined, option: any) =>
                                update({
                                    customer_id: value,
                                    customer_name: option?.raw?.name,
                                })
                            }
                            placeholder="Chọn khách hàng"
                            dataSource={{
                                getList: listCustomers,
                                getById: getCustomer,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={customerOption}
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

function Summary({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: "success" | "danger"
}) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
            <div className={cn(
                "mt-1 text-xl font-semibold tabular-nums",
                tone === "success" ? "text-emerald-700" : "text-rose-700",
            )}>
                {value}
            </div>
        </div>
    )
}

function customerOption(customer: { id: number; code?: string; name: string }) {
    return {
        value: customer.id,
        label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
        raw: customer,
    }
}

function dateOnly(value?: string) {
    return value ? value.split("T")[0] : ""
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
    const parts = dateOnly(value).split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateOnly(value)
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
    return amount.toLocaleString("vi-VN")
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

function exportAdjustmentXlsx(
    rows: ArLedger[],
    options: {
        incomingLabel: string
        outgoingLabel: string
        period: string
    },
) {
    const exportRows: (string | number)[][] = []
    const push = (cells: (string | number)[]) => exportRows.push(cells)

    push(["ĐIỀU CHỈNH CÔNG NỢ"])
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

    exportXlsx(`dieu-chinh-cong-no-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        { name: "Điều chỉnh công nợ", rows: exportRows },
    ])
}
