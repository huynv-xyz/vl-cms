import { useMemo, useState } from "react"
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

const emptyForm = (): FormState => ({
    alias_code: "",
    alias_name: "",
    tax_code: "",
    bank_account: "",
    bank_account_name: "",
    bank_name: "",
    type: "BANK",
    is_default: "0",
    note: "",
})

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
    const [form, setForm] = useState<FormState>(emptyForm)

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

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!form.alias_name.trim()) {
                throw new Error("Vui lòng nhập tên ID_B")
            }

            const payload: CustomerAlias = {
                id: form.id ?? 0,
                customer_id: customer.id,
                alias_code: form.alias_code.trim() || undefined,
                alias_name: form.alias_name.trim(),
                tax_code: form.tax_code.trim() || undefined,
                bank_account: form.bank_account.trim() || undefined,
                bank_account_name: form.bank_account_name.trim() || undefined,
                bank_name: form.bank_name.trim() || undefined,
                type: form.type,
                is_default: Number(form.is_default),
                status: 1,
                note: form.note.trim() || undefined,
            }

            return form.id
                ? updateCustomerAlias(payload)
                : createCustomerAlias(payload)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey })
            toast.success(form.id ? "Đã cập nhật ID_B" : "Đã thêm ID_B")
            setForm(emptyForm())
        },
        onError: (error: any) => toast.error(error?.message || "Lưu ID_B thất bại"),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteCustomerAlias(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey })
            toast.success("Đã xóa ID_B")
        },
        onError: (error: any) => toast.error(error?.message || "Xóa ID_B thất bại"),
    })

    const editAlias = (alias: CustomerAlias) => {
        setForm({
            id: alias.id,
            alias_code: alias.alias_code || "",
            alias_name: alias.alias_name || "",
            tax_code: alias.tax_code || "",
            bank_account: alias.bank_account || "",
            bank_account_name: alias.bank_account_name || "",
            bank_name: alias.bank_name || "",
            type: alias.type || "BANK",
            is_default: String(alias.is_default ?? 0),
            note: alias.note || "",
        })
    }

    const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) setForm(emptyForm())
                onOpenChange(next)
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>ID_B / Alias - {customer.code} - {customer.name}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 text-left">Loại</th>
                                    <th className="px-3 py-2 text-left">Mã ID_B</th>
                                    <th className="px-3 py-2 text-left">Tên</th>
                                    <th className="px-3 py-2 text-left">MST / TK NH</th>
                                    <th className="w-20 px-2 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : aliases.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                                            Chưa có ID_B cho khách hàng này.
                                        </td>
                                    </tr>
                                ) : (
                                    aliases.map((alias) => (
                                        <tr key={alias.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                            <td className="px-3 py-2">
                                                <span className="rounded border bg-white px-2 py-1 text-xs font-semibold">
                                                    {alias.type || "-"}
                                                </span>
                                                {Number(alias.is_default) === 1 ? (
                                                    <span className="ml-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                                        Mặc định
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs font-semibold text-sky-700">
                                                {alias.alias_code || "-"}
                                            </td>
                                            <td className="px-3 py-2 font-medium">{alias.alias_name}</td>
                                            <td className="px-3 py-2 text-xs text-slate-600">
                                                <div>{alias.tax_code || "-"}</div>
                                                <div>{alias.bank_account || "-"}</div>
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => editAlias(alias)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                                    onClick={() => deleteMutation.mutate(alias.id)}
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

                    <div className="rounded-lg border bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                                {form.id ? "Sửa ID_B" : "Thêm ID_B"}
                            </div>
                            {form.id ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setForm(emptyForm())}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm mới
                                </Button>
                            ) : null}
                        </div>

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
                                <Select value={form.is_default} onValueChange={(value) => update({ is_default: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Không</SelectItem>
                                        <SelectItem value="1">Có</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Mã ID_B">
                                <Input value={form.alias_code} onChange={(event) => update({ alias_code: event.target.value })} />
                            </Field>
                            <Field label="Tên ID_B">
                                <Input value={form.alias_name} onChange={(event) => update({ alias_name: event.target.value })} />
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
                            <Field label="Ghi chú" className="md:col-span-2">
                                <Textarea rows={3} value={form.note} onChange={(event) => update({ note: event.target.value })} />
                            </Field>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Đang lưu..." : "Lưu ID_B"}
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
