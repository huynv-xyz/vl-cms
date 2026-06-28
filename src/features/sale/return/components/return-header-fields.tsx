import { getCustomer, listCustomers } from "@/api/customer"
import { getExport, listExports } from "@/api/sale/export"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { exportOption } from "@/lib/option-mapper"
import { RETURN_STATUSES } from "./return-status"

const customerOption = (customer: any) => ({
    value: customer.id,
    label: `${customer.code ? `${customer.code} - ` : ""}${customer.name ?? `#${customer.id}`}`,
    raw: customer,
})

type Props = {
    value: any
    onChange: (value: any) => void
    lockedExport?: boolean
    lockedCustomer?: boolean
    order?: any
    showStatus?: boolean
}

export function ReturnHeaderFields({
    value,
    onChange,
    lockedExport,
    lockedCustomer,
    order,
    showStatus = false,
}: Props) {
    const update = (patch: any) => onChange({ ...value, ...patch })
    const returnType = value.return_type || "FROM_EXPORT"
    const isManualReturn = returnType === "MANUAL"

    return (
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            <Field label="Loại trả hàng" required>
                <Select
                    value={returnType}
                    disabled={lockedExport}
                    onValueChange={(nextType) =>
                        update({
                            return_type: nextType,
                            export_id: nextType === "MANUAL" ? undefined : value.export_id,
                            order_id: nextType === "MANUAL" ? undefined : value.order_id,
                            export_date: nextType === "MANUAL" ? undefined : value.export_date,
                        })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn loại trả hàng" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FROM_EXPORT">Theo phiếu xuất</SelectItem>
                        <SelectItem value="MANUAL">Không có phiếu xuất</SelectItem>
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Khách hàng" required={isManualReturn}>
                <AsyncSelect
                    placeholder="Chọn khách hàng"
                    searchPlaceholder="Tìm khách hàng..."
                    value={value.customer_id}
                    onChange={(customerId: any) =>
                        update({
                            customer_id: customerId,
                            export_id:
                                customerId === value.customer_id
                                    ? value.export_id
                                    : undefined,
                        })
                    }
                    disabled={lockedExport || lockedCustomer}
                    required={isManualReturn}
                    dataSource={{
                        getList: listCustomers,
                        getById: getCustomer,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={customerOption}
                    popoverContentClassName="w-[520px] max-w-[calc(100vw-2rem)]"
                    optionWrapLabel
                />
            </Field>

            <Field label="Phiếu xuất" required={!isManualReturn}>
                <AsyncSelect
                    placeholder="Chọn phiếu xuất"
                    value={value.export_id}
                    onChange={(exportId: any) => update({ export_id: exportId })}
                    required={!isManualReturn}
                    disabled={lockedExport || isManualReturn}
                    dataSource={{
                        getList: listExports,
                        getById: getExport,
                        params: {
                            page: 1,
                            size: 20,
                            order_id: order?.id || undefined,
                            customer_id: value.customer_id || undefined,
                        },
                    }}
                    mapOption={exportOption}
                />
            </Field>

            <Field label="Ngày trả" required>
                <DatePicker
                    value={value.return_date}
                    onChange={(returnDate) => update({ return_date: returnDate })}
                    placeholder="Chọn ngày trả"
                    disabled={(date) => {
                        const minDate = dateOnly(value.export_date)
                        if (!minDate) return false
                        return dateToYmd(date) < minDate
                    }}
                />
            </Field>

            {showStatus && (
                <Field label="Trạng thái">
                    <Select
                        value={value.status || "NEW"}
                        onValueChange={(status) => update({ status })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {RETURN_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            )}

            <Field label="Lý do trả hàng" className="md:col-span-2">
                <Textarea
                    rows={3}
                    placeholder="Nhập lý do trả hàng"
                    value={value.reason || ""}
                    onChange={(event) => update({ reason: event.target.value })}
                />
            </Field>
        </div>
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
                {required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {children}
        </div>
    )
}

function dateOnly(value?: string | number[]) {
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return ""
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }

    if (!value) return ""

    const datePart = value.split("T")[0].split(" ")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart

    const match = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (!match) return datePart

    const [, day, month, year] = match
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
