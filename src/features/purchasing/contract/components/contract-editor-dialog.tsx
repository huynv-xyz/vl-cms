import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarDays, CreditCard, FileText, Percent, Save } from "lucide-react"

import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { getCurrency, listCurrencies } from "@/api/purchasing/currency"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
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
import { currencyOption, supplierOption } from "@/lib/option-mapper"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { PaymentMethod } from "../data/schema"
import type { ContractFormValues } from "./types"

type Props<TRequest, TResponse> = {
    title: string
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultValues: ContractFormValues
    submitText: string
    loadingText: string
    mutationFn: (body: TRequest) => Promise<TResponse>
    mapFormToRequest: (values: ContractFormValues) => TRequest
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
    { value: "TT", label: "TT" },
    { value: "LC_IMMEDIATE", label: "LC trả ngay" },
    { value: "LC_60_BL", label: "LC 60 ngày BL" },
    { value: "DA", label: "D/A" },
    { value: "DP", label: "D/P" },
]

export function ContractEditorDialog<TRequest, TResponse>({
    title,
    open,
    onOpenChange,
    defaultValues,
    submitText,
    loadingText,
    mutationFn,
    mapFormToRequest,
}: Props<TRequest, TResponse>) {
    const queryClient = useQueryClient()
    const initialValues = useMemo(() => defaultValues, [defaultValues])
    const [form, setForm] = useState<ContractFormValues>(initialValues)
    const [exchangeRateEdited, setExchangeRateEdited] = useState(false)

    useEffect(() => {
        if (open) {
            setForm(initialValues)
            setExchangeRateEdited(false)
        }
    }, [initialValues, open])

    useEffect(() => {
        if (!open || !form.currency_id || exchangeRateEdited || Number(form.exchange_rate || 0) > 1) {
            return
        }

        let cancelled = false

        getCurrency(Number(form.currency_id))
            .then((currency) => {
                const exchangeRate = Number(currency?.exchange_rate || 0)
                if (!cancelled && exchangeRate > 0) {
                    setForm((prev) => ({
                        ...prev,
                        exchange_rate: exchangeRate,
                    }))
                }
            })
            .catch(() => undefined)

        return () => {
            cancelled = true
        }
    }, [exchangeRateEdited, form.currency_id, form.exchange_rate, open])

    const { mutate, isPending } = useMutation({
        mutationFn: (values: ContractFormValues) => mutationFn(mapFormToRequest(values)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["contracts"] })
            toast.success("Thao tác thành công")
            onOpenChange(false)
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error && error.message ? error.message : "Thao tác thất bại")
        },
    })

    const setField = <K extends keyof ContractFormValues>(key: K, value: ContractFormValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const setCurrency = (value: number | undefined) => {
        setExchangeRateEdited(false)
        setForm((prev) => ({
            ...prev,
            currency_id: value,
            exchange_rate: value ? prev.exchange_rate : 1,
        }))
    }

    const totalRate = Number(form.vat_rate || 0) + Number(form.import_tax_rate || 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] max-h-[92vh] !w-[calc(100vw-24px)] !max-w-[1440px] flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">
                        {title}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Nhập thông tin hợp đồng mua hàng. Danh sách sản phẩm sẽ được thêm trong chi tiết hợp đồng sau khi tạo.
                    </p>
                </DialogHeader>

                <form
                    className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]"
                    onSubmit={(event) => {
                        event.preventDefault()
                        mutate(form)
                    }}
                >
                    <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
                        <section className="space-y-3">
                            <SectionTitle icon={FileText} title="Thông tin hợp đồng" />
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Số hợp đồng" required>
                                    <Input
                                        value={form.code}
                                        onChange={(e) => setField("code", e.target.value)}
                                        placeholder="VD: HD-2026-001"
                                        disabled={isPending}
                                    />
                                </Field>

                                <Field label="Nhà cung cấp" required>
                                    <AsyncSelect
                                        value={form.supplier_id}
                                        onChange={(v: any) => setField("supplier_id", v ? Number(v) : undefined)}
                                        placeholder="Chọn nhà cung cấp"
                                        required
                                        disabled={isPending}
                                        dataSource={{
                                            getList: listSuppliers,
                                            getById: getSupplier,
                                            params: { page: 1, size: 20 },
                                        }}
                                        mapOption={supplierOption}
                                    />
                                </Field>

                                <Field label="Ngày ký" required>
                                    <DatePicker
                                        value={form.signed_date}
                                        onChange={(v) => setField("signed_date", v || "")}
                                        placeholder="Chọn ngày ký"
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <SectionTitle icon={CreditCard} title="Thanh toán và điều kiện mua" />
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Loại tiền" required>
                                    <AsyncSelect
                                        value={form.currency_id}
                                        onChange={(v: any) => setCurrency(v ? Number(v) : undefined)}
                                        placeholder="Chọn loại tiền"
                                        required
                                        disabled={isPending}
                                        dataSource={{
                                            getList: listCurrencies,
                                            getById: getCurrency,
                                            params: { page: 1, size: 20 },
                                        }}
                                        mapOption={currencyOption}
                                    />
                                </Field>

                                <Field label="Tỷ giá">
                                    <NumberInput
                                        value={form.exchange_rate}
                                        onChange={(v) => {
                                            setExchangeRateEdited(true)
                                            setField("exchange_rate", v)
                                        }}
                                        disabled={isPending}
                                        placeholder="VD: 25000"
                                        step="0.000001"
                                    />
                                </Field>

                                <Field label="Hình thức thanh toán">
                                    <Select
                                        value={form.payment_method || "TT"}
                                        onValueChange={(v) => setField("payment_method", v as PaymentMethod)}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn hình thức TT" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Incoterm">
                                    <Input
                                        value={form.term || ""}
                                        onChange={(e) => setField("term", e.target.value)}
                                        placeholder="EXW, FOB, CIF..."
                                        disabled={isPending}
                                    />
                                </Field>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <SectionTitle icon={Percent} title="Cọc và thuế" />
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <Field label="Tỷ lệ cọc (%)">
                                    <NumberInput
                                        value={form.deposit_rate}
                                        onChange={(v) => setField("deposit_rate", v)}
                                        disabled={isPending}
                                        max={100}
                                    />
                                </Field>

                                <Field label="Ngày đặt cọc">
                                    <DatePicker
                                        value={form.deposit_date}
                                        onChange={(v) => setField("deposit_date", v || "")}
                                        placeholder="Chọn ngày cọc"
                                    />
                                </Field>

                                <Field label="Thuế nhập khẩu (%)">
                                    <NumberInput
                                        value={form.import_tax_rate}
                                        onChange={(v) => setField("import_tax_rate", v)}
                                        disabled={isPending}
                                        max={100}
                                    />
                                </Field>

                                <Field label="VAT (%)">
                                    <NumberInput
                                        value={form.vat_rate}
                                        onChange={(v) => setField("vat_rate", v)}
                                        disabled={isPending}
                                        max={100}
                                    />
                                </Field>

                                <Field label="Phí làm hàng">
                                    <NumberInput
                                        value={form.handling_fee}
                                        onChange={(v) => setField("handling_fee", v)}
                                        disabled={isPending}
                                        placeholder="TTHQ, nâng hạ..."
                                    />
                                </Field>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Giá đầu vào/ĐV = (giá mua + giá bao bì + giá vận chuyển) x tỷ giá tạm tính + phí làm hàng.
                            </p>
                        </section>
                    </div>

                    <aside className="border-t bg-muted/30 p-5 lg:border-l lg:border-t-0">
                        <div className="sticky top-0 space-y-4">
                            <div>
                                <h3 className="font-semibold">Tóm tắt</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kiểm tra nhanh trước khi lưu hợp đồng.
                                </p>
                            </div>

                            <div className="space-y-3 rounded-md border bg-background p-4 text-sm">
                                <SummaryRow label="Số HĐ" value={form.code || "-"} />
                                <SummaryRow label="Thanh toán" value={formatPayment(form.payment_method)} />
                                <SummaryRow label="Incoterm" value={form.term || "-"} />
                                <SummaryRow label="Tỷ giá" value={formatNumber(form.exchange_rate)} />
                                <SummaryRow label="Tỷ lệ cọc" value={`${Number(form.deposit_rate || 0)}%`} />
                                <SummaryRow label="Phí làm hàng" value={formatCurrency(form.handling_fee)} />
                                <SummaryRow label="Tổng thuế" value={`${totalRate}%`} />
                            </div>

                            <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                                    <CalendarDays className="h-4 w-4" />
                                    Lưu ý
                                </div>
                                Hàng hóa của hợp đồng được quản lý ở tab Hàng hóa trong trang chi tiết hợp đồng.
                            </div>
                        </div>
                    </aside>

                    <div className="col-span-full flex justify-end gap-3 border-t bg-background px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            <Save className="h-4 w-4" />
                            {isPending ? loadingText : submitText}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
    return (
        <div className="flex items-center gap-2 text-base font-semibold">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
        </div>
    )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                {label}
                {required ? <span className="ml-0.5 text-destructive">*</span> : null}
            </Label>
            {children}
        </div>
    )
}

function NumberInput({
    value,
    onChange,
    disabled,
    max,
    placeholder,
    step,
}: {
    value?: number
    onChange: (value: number) => void
    disabled?: boolean
    max?: number
    placeholder?: string
    step?: string
}) {
    return (
        <Input
            type="number"
            min={0}
            max={max}
            step={step}
            value={value ?? 0}
            onChange={(e) => onChange(Number(e.target.value || 0))}
            disabled={disabled}
            placeholder={placeholder}
        />
    )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    )
}

function formatPayment(method?: string) {
    return paymentOptions.find((x) => x.value === method)?.label ?? method ?? "TT"
}
