import { useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
    createCustomerAlias,
    deleteCustomerAlias,
    listCustomerAliases,
    updateCustomerAlias,
    type CustomerAlias,
} from "@/api/customer-alias"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { Customer } from "../data/schema"

type FormState = {
    id?: number
    alias_code: string
    alias_name: string
    tax_code: string
    bank_account: string
    bank_account_name: string
    bank_name: string
    type: string
    is_default: string
    note: string
}

const emptyForm = (customer?: Customer, isDefault = false): FormState => ({
    alias_code: customer?.code ?? "",
    alias_name: customer?.name ?? "",
    tax_code: customer?.tax_code ?? "",
    bank_account: "",
    bank_account_name: "",
    bank_name: "",
    type: "TAX",
    is_default: isDefault ? "1" : "0",
    note: customer?.address ?? "",
})

const normalizeAliasType = (type?: string | null) =>
    type === "BANK" || type === "TAX" || type === "OTHER" ? type : "OTHER"

export function CustomerAliasDialog({
    customer,
    open,
    onOpenChange,
}: {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const queryClient = useQueryClient()
    const [editorOpen, setEditorOpen] = useState(false)
    const [form, setForm] = useState<FormState>(emptyForm(customer))

    const queryKey = useMemo(
        () => ["customer-aliases", customer.id],
        [customer.id],
    )

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () =>
            listCustomerAliases({
                page: 1,
                size: 100,
                customer_id: customer.id,
            }),
        enabled: open && !!customer.id,
    })

    const aliases = data?.items ?? []

    const invalidate = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey }),
            queryClient.invalidateQueries({ queryKey: ["customer"] }),
        ])
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteCustomerAlias(id),
        onSuccess: async () => {
            await invalidate()
            toast.success("Đã xóa thông tin xuất HĐ")
        },
        onError: (error: any) => toast.error(error?.message || "Xóa thông tin xuất HĐ thất bại"),
    })

    const openCreate = () => {
        setForm(emptyForm(customer, aliases.length === 0))
        setEditorOpen(true)
    }

    const openEdit = (alias: CustomerAlias) => {
        setForm({
            id: alias.id,
            alias_code: alias.alias_code || "",
            alias_name: alias.alias_name || "",
            tax_code: alias.tax_code || "",
            bank_account: alias.bank_account || "",
            bank_account_name: alias.bank_account_name || "",
            bank_name: alias.bank_name || "",
            type: normalizeAliasType(alias.type),
            is_default: String(alias.is_default ?? 0),
            note: alias.note || "",
        })
        setEditorOpen(true)
    }

    const handleDelete = (alias: CustomerAlias) => {
        if (aliases.length <= 1) {
            toast.error("Khách hàng phải có ít nhất 1 thông tin xuất HĐ")
            return
        }
        deleteMutation.mutate(alias.id)
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!next) setEditorOpen(false)
                    onOpenChange(next)
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Thông tin xuất HĐ - {customer.code} - {customer.name}</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-end">
                        <Button type="button" size="sm" onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm thông tin xuất HĐ
                        </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[980px] table-fixed text-sm">
                            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="w-32 px-3 py-2 text-left">Loại</th>
                                    <th className="w-44 px-3 py-2 text-left">Mã xuất HĐ</th>
                                    <th className="w-64 px-3 py-2 text-left">Tên xuất HĐ</th>
                                    <th className="w-36 px-3 py-2 text-left">MST / TK NH</th>
                                    <th className="px-3 py-2 text-left">Địa chỉ</th>
                                    <th className="w-28 px-2 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : aliases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                                            Chưa có thông tin xuất HĐ cho khách hàng này.
                                        </td>
                                    </tr>
                                ) : (
                                    aliases.map((alias) => (
                                        <tr key={alias.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                            <td className="px-3 py-2 align-top">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="rounded border bg-white px-2 py-1 text-xs font-semibold leading-none">
                                                        {alias.type || "-"}
                                                    </span>
                                                {Number(alias.is_default) === 1 ? (
                                                    <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold leading-none text-emerald-700">
                                                        Mặc định
                                                    </span>
                                                ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs font-semibold text-sky-700">
                                                {alias.alias_code || "-"}
                                            </td>
                                            <td className="px-3 py-2 font-medium">{alias.alias_name}</td>
                                            <td className="px-3 py-2 text-xs text-slate-600">
                                                <div>{alias.tax_code || "-"}</div>
                                                <div>{alias.bank_account || "-"}</div>
                                            </td>
                                            <td className="max-w-[280px] px-3 py-2 text-xs text-slate-600">
                                                <div className="line-clamp-2">{alias.note || "-"}</div>
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(alias)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 disabled:text-slate-300"
                                                    disabled={aliases.length <= 1 || deleteMutation.isPending}
                                                    onClick={() => handleDelete(alias)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AliasEditorDialog
                customer={customer}
                form={form}
                setForm={setForm}
                open={editorOpen}
                onOpenChange={setEditorOpen}
                onSaved={invalidate}
            />
        </>
    )
}

function AliasEditorDialog({
    customer,
    form,
    setForm,
    open,
    onOpenChange,
    onSaved,
}: {
    customer: Customer
    form: FormState
    setForm: Dispatch<SetStateAction<FormState>>
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => Promise<void>
}) {
    const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!form.alias_code.trim()) {
                throw new Error("Vui lòng nhập mã xuất HĐ")
            }
            if (!form.alias_name.trim()) {
                throw new Error("Vui lòng nhập tên xuất HĐ")
            }

            const payload: CustomerAlias = {
                id: form.id ?? 0,
                customer_id: customer.id,
                alias_code: form.alias_code.trim(),
                alias_name: form.alias_name.trim(),
                tax_code: form.tax_code.trim() || undefined,
                bank_account: form.bank_account.trim() || undefined,
                bank_account_name: form.bank_account_name.trim() || undefined,
                bank_name: form.bank_name.trim() || undefined,
                type: form.type === "OTHER" ? undefined : form.type,
                is_default: Number(form.is_default),
                status: 1,
                note: form.note.trim() || undefined,
            }

            return form.id
                ? updateCustomerAlias(payload)
                : createCustomerAlias(payload)
        },
        onSuccess: async () => {
            await onSaved()
            toast.success(form.id ? "Đã cập nhật thông tin xuất HĐ" : "Đã thêm thông tin xuất HĐ")
            onOpenChange(false)
        },
        onError: (error: any) => toast.error(error?.message || "Lưu thông tin xuất HĐ thất bại"),
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{form.id ? "Sửa thông tin xuất HĐ" : "Thêm thông tin xuất HĐ"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Loại">
                        <Select value={form.type} onValueChange={(value) => update({ type: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK">Ngân hàng</SelectItem>
                                <SelectItem value="TAX">Thuế</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Mặc định">
                        <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                            <Checkbox
                                checked={form.is_default === "1"}
                                onCheckedChange={(checked) =>
                                    update({ is_default: checked === true ? "1" : "0" })
                                }
                            />
                            <span>Dùng làm thông tin xuất HĐ mặc định</span>
                        </label>
                    </Field>
                    <Field label="Mã xuất HĐ" required>
                        <Input
                            value={form.alias_code}
                            onChange={(event) => update({ alias_code: event.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Tên xuất HĐ" required>
                        <Input
                            value={form.alias_name}
                            onChange={(event) => update({ alias_name: event.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Mã số thuế">
                        <Input value={form.tax_code} onChange={(event) => update({ tax_code: event.target.value })} />
                    </Field>
                    <Field label="Số tài khoản">
                        <Input value={form.bank_account} onChange={(event) => update({ bank_account: event.target.value })} />
                    </Field>
                    <Field label="Tên tài khoản">
                        <Input value={form.bank_account_name} onChange={(event) => update({ bank_account_name: event.target.value })} />
                    </Field>
                    <Field label="Ngân hàng">
                        <Input value={form.bank_name} onChange={(event) => update({ bank_name: event.target.value })} />
                    </Field>
                    <Field label="Địa chỉ / ghi chú" className="md:col-span-2">
                        <Textarea rows={3} value={form.note} onChange={(event) => update({ note: event.target.value })} />
                    </Field>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Field({
    label,
    required,
    className,
    children,
}: {
    label: string
    required?: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <Label className="mb-1.5 block text-sm font-medium">
                {label}
                {required ? <span className="ml-0.5 text-destructive">*</span> : null}
            </Label>
            {children}
        </div>
    )
}
