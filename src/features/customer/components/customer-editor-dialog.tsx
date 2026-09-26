import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MapPin } from "lucide-react"
import { toast } from "sonner"

import { getEmployee, listEmployees } from "@/api/employee"
import { getMyPermissions, hasPermission } from "@/api/auth/permission"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Textarea } from "@/components/ui/textarea"
import type { Customer } from "../data/schema"
import { CustomerLocationsDialog, DraftCustomerLocationsDialog } from "./customer-locations-dialog"
import type { CustomerFormValues, LocationFormState } from "./types"

type Props<TRequest, TResponse> = {
    title: string
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultValues: CustomerFormValues
    submitText: string
    loadingText: string
    mutationFn: (body: TRequest) => Promise<TResponse>
    mapFormToRequest: (values: CustomerFormValues, syncHistoricalData?: boolean, primaryLocation?: LocationFormState | null) => TRequest
    confirmHistoricalSync?: boolean
    invoiceSectionOverride?: React.ReactNode
    customer?: Customer
}

const employeeDataSource = {
    getList: listEmployees,
    getById: getEmployee,
}

export function CustomerEditorDialog<TRequest, TResponse>({
    title,
    open,
    onOpenChange,
    defaultValues,
    submitText,
    loadingText,
    mutationFn,
    mapFormToRequest,
    confirmHistoricalSync,
    invoiceSectionOverride,
    customer,
}: Props<TRequest, TResponse>) {
    const queryClient = useQueryClient()
    const initialData = useRef(defaultValues)
    useEffect(() => { initialData.current = defaultValues }, [defaultValues])
    const [form, setForm] = useState<CustomerFormValues>(defaultValues)
    const [syncChoiceOpen, setSyncChoiceOpen] = useState(false)
    const [locationsOpen, setLocationsOpen] = useState(false)
    const [primaryLocation, setPrimaryLocation] = useState<LocationFormState | null>(null)
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const permissions = permissionsQuery.data ?? []
    const canViewLocations = !customer || hasPermission(permissions, "customer-locations", "view")
    const canUpdateLocations = !customer || hasPermission(permissions, "customer-locations", "update")

    useEffect(() => {
        if (open) {
            setForm(initialData.current)
            setSyncChoiceOpen(false)
            setLocationsOpen(false)
            setPrimaryLocation(null)
        }
    }, [open, customer?.id])

    const mutation = useMutation({
        mutationFn: (syncHistoricalData?: boolean) =>
            mutationFn(mapFormToRequest(form, syncHistoricalData, primaryLocation)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["customer"] })
            toast.success("Đã lưu khách hàng")
            setSyncChoiceOpen(false)
            onOpenChange(false)
        },
        onError: (error: unknown) => {
            const message = error instanceof Error && error.message ? error.message : "Lưu khách hàng thất bại"
            toast.error(message)
        },
    })

    const update = (patch: Partial<CustomerFormValues>) =>
        setForm((prev) => ({ ...prev, ...patch }))

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-6xl">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <form
                        className="min-h-0 flex-1 overflow-y-auto pr-1"
                        onSubmit={(event) => {
                            event.preventDefault()
                            if (confirmHistoricalSync) {
                                setSyncChoiceOpen(true)
                                return
                            }
                            mutation.mutate(false)
                        }}
                    >
                        <div className="space-y-6">
                            <Section title="Thông tin khách hàng">
                                <Field label="Mã KH" required>
                                    <Input
                                        value={form.code}
                                        onChange={(event) => update({ code: event.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Tên khách hàng" required>
                                    <Input
                                        value={form.name}
                                        onChange={(event) => update({ name: event.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Điện thoại">
                                    <Input
                                        value={form.phone ?? ""}
                                        onChange={(event) => update({ phone: event.target.value })}
                                    />
                                </Field>
                                <Field label="Nhân viên phụ trách">
                                    <AsyncSelect
                                        value={form.employee_id}
                                        onChange={(value: number | undefined) => update({ employee_id: value })}
                                        dataSource={employeeDataSource}
                                        mapOption={(x: { id: number; code?: string; name: string }) => ({
                                            value: x.id,
                                            label: x.code ? `${x.code} - ${x.name}` : x.name,
                                            raw: x,
                                        })}
                                        placeholder="Chọn nhân viên"
                                        popoverContentClassName="w-[420px]"
                                        optionWrapLabel
                                        wrapLabel
                                    />
                                </Field>
                                <Field label="Loại" required>
                                    <Select value={form.type} onValueChange={(value) => update({ type: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="B2B">B2B</SelectItem>
                                            <SelectItem value="B2C">B2C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Khu vực" required>
                                    <Select value={form.region} onValueChange={(value) => update({ region: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MB">MB</SelectItem>
                                            <SelectItem value="MN">MN</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Trạng thái">
                                    <Select
                                        value={form.status === false ? "0" : "1"}
                                        onValueChange={(value) => update({ status: value !== "0" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Hoạt động</SelectItem>
                                            <SelectItem value="0">Tắt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Địa chỉ giao dịch" className="md:col-span-2">
                                    <div className="flex items-start gap-3">
                                        <div className="min-h-16 min-w-0 flex-1 whitespace-pre-wrap rounded-md border px-3 py-2 text-sm">
                                            {form.address || <span className="text-muted-foreground">Chưa có địa chỉ giao dịch</span>}
                                        </div>
                                        {canViewLocations && <Button type="button" variant="outline" onClick={() => {
                                            if (customer) {
                                                setLocationsOpen(true)
                                            } else {
                                                setLocationsOpen(true)
                                            }
                                        }}><MapPin className="mr-2 h-4 w-4" />Địa điểm</Button>}
                                    </div>
                                </Field>
                                <Field label="Ghi chú">
                                    <Textarea
                                        rows={2}
                                        value={form.note ?? ""}
                                        onChange={(event) => update({ note: event.target.value })}
                                    />
                                </Field>
                            </Section>

                        {invoiceSectionOverride ? (
                            <Section title="Thông tin xuất HĐ">
                                <div className="md:col-span-2 xl:col-span-3">
                                    {invoiceSectionOverride}
                                </div>
                            </Section>
                        ) : (
                            <Section
                                title="Thông tin xuất HĐ"
                                action={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            update({
                                                invoice_alias_code: form.code,
                                                invoice_alias_name: form.name,
                                                invoice_address: form.address ?? "",
                                            })
                                        }
                                    >
                                        Lấy thông tin khách hàng như trên
                                    </Button>
                                }
                            >
                                <Field label="Mã xuất HĐ" required>
                                    <Input
                                        value={form.invoice_alias_code ?? ""}
                                        onChange={(event) => update({ invoice_alias_code: event.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Tên xuất HĐ" required>
                                    <Input
                                        value={form.invoice_alias_name ?? ""}
                                        onChange={(event) => update({ invoice_alias_name: event.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Mã số thuế">
                                    <Input
                                        value={form.invoice_tax_code ?? ""}
                                        onChange={(event) => update({ invoice_tax_code: event.target.value })}
                                    />
                                </Field>
                                <Field label="Số tài khoản">
                                    <Input
                                        value={form.bank_account ?? ""}
                                        onChange={(event) => update({ bank_account: event.target.value })}
                                    />
                                </Field>
                                <Field label="Tên tài khoản">
                                    <Input
                                        value={form.bank_account_name ?? ""}
                                        onChange={(event) => update({ bank_account_name: event.target.value })}
                                    />
                                </Field>
                                <Field label="Ngân hàng">
                                    <Input
                                        value={form.bank_name ?? ""}
                                        onChange={(event) => update({ bank_name: event.target.value })}
                                    />
                                </Field>
                                <Field label="Địa chỉ xuất HĐ" className="md:col-span-2 xl:col-span-3">
                                    <Textarea
                                        rows={2}
                                        value={form.invoice_address ?? ""}
                                        onChange={(event) => update({ invoice_address: event.target.value })}
                                    />
                                </Field>
                            </Section>
                        )}
                    </div>

                        <div className="sticky bottom-0 mt-6 bg-background pt-4">
                            <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                {mutation.isPending ? loadingText : submitText}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {customer && canViewLocations && <CustomerLocationsDialog customer={customer} open={locationsOpen}
                onOpenChange={setLocationsOpen} canUpdate={canUpdateLocations}
                onAddressChange={(address) => update({ address })} />}
            {!customer && <DraftCustomerLocationsDialog name={form.name} open={locationsOpen}
                onOpenChange={setLocationsOpen} value={primaryLocation} address={form.address ?? ""}
                onChange={(location, address) => {
                    setPrimaryLocation(location)
                    update({ address })
                }} />}

            <AlertDialog open={syncChoiceOpen} onOpenChange={setSyncChoiceOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Áp dụng thay đổi khách hàng?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Chọn cách áp dụng thông tin vừa sửa cho khách hàng này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mutation.isPending}>Quay lại</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate(false)}
                        >
                            Thay đổi từ bây giờ
                        </AlertDialogAction>
                        <AlertDialogAction
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate(true)}
                        >
                            Đồng bộ dữ liệu cũ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function Section({
    title,
    action,
    children,
}: {
    title: string
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{title}</h3>
                {action}
            </div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </section>
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
