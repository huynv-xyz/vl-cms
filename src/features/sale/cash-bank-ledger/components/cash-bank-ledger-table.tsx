import type React from "react"
import { useRef, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, Plus, Upload, WalletCards } from "lucide-react"
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
    alias_id?: number
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
    alias_id: undefined,
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
    const [filterAliasId, setFilterAliasId] = useState<number | undefined>(undefined)
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

    const openEdit = (row: ArLedger) => {
        const debit = Number(row.debit_amount || 0)
        const credit = Number(row.credit_amount || 0)
        setForm({
            id: row.id,
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
