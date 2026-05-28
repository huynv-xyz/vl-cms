import { getCustomer, listCustomers } from "@/api/customer"
import { getExport, listExports } from "@/api/sale/export"
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
    showStatus?: boolean
}

export function ReturnHeaderFields({
    value,
    onChange,
    lockedExport,
    showStatus = false,
}: Props) {
    const update = (patch: any) => onChange({ ...value, ...patch })

    return (
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            <Field label="Khách hàng">
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
                    disabled={lockedExport}
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

            <Field label="Phiếu xuất" required>
                <AsyncSelect
                    placeholder="Chọn phiếu xuất"
                    value={value.export_id}
                    onChange={(exportId: any) => update({ export_id: exportId })}
                    required
                    disabled={lockedExport}
                    dataSource={{
                        getList: listExports,
                        getById: getExport,
                        params: {
                            page: 1,
                            size: 20,
                            customer_id: value.customer_id || undefined,
                        },
                    }}
                    mapOption={exportOption}
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
