import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { AsyncSelect } from "@/components/rjsf/async-select"
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
import { ORDER_STATUSES } from "./order-status"

type Props = {
    value: any
    onChange: (value: any) => void
    showStatus?: boolean
}

export function OrderHeaderFields({ value, onChange, showStatus = true }: Props) {
    const update = (patch: any) => onChange({ ...value, ...patch })

    return (
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Khách hàng" required>
                <AsyncSelect
                    placeholder="Chọn khách hàng"
                    value={value.customer_id}
                    onChange={(customerId: any) => update({ customer_id: customerId })}
                    required
                    dataSource={{ getList: listCustomers, getById: getCustomer }}
                    mapOption={(x: any) => ({
                        value: x.id,
                        label: x.name || x.code || `#${x.id}`,
                        raw: x,
                    })}
                />
            </Field>

            <Field label="Nhân viên bán" required>
                <AsyncSelect
                    placeholder="Chọn nhân viên"
                    value={value.employee_id}
                    onChange={(employeeId: any) => update({ employee_id: employeeId })}
                    dataSource={{ getList: listEmployees, getById: getEmployee }}
                    mapOption={(x: any) => ({
                        value: x.id,
                        label: x.name || x.code || `#${x.id}`,
                        raw: x,
                    })}
                />
            </Field>

            <Field label="Ngày đặt hàng" required>
                <Input
                    type="date"
                    value={value.order_date || ""}
                    onChange={(event) => update({ order_date: event.target.value })}
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
                            {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            )}

            <Field label="Ghi chú" className="md:col-span-3">
                <Textarea
                    rows={3}
                    placeholder="Ghi chú đơn hàng"
                    value={value.note || ""}
                    onChange={(event) => update({ note: event.target.value })}
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
