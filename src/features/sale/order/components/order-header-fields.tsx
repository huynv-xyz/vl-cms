import { CalendarDays, FileSignature, User, UserCog } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { getOrderStatusMeta, ORDER_STATUSES } from "./order-status"

type Props = {
    value: any
    onChange: (value: any) => void
    showStatus?: boolean
}

export function OrderHeaderFields({ value, onChange, showStatus = true }: Props) {
    const update = (patch: any) => onChange({ ...value, ...patch })

    return (
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <Field icon={User} label="Khách hàng" required>
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

            <Field icon={UserCog} label="Nhân viên bán" required>
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

            <Field icon={CalendarDays} label="Ngày đặt hàng" required>
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
                            {ORDER_STATUSES.map((status) => {
                                const sm = getOrderStatusMeta(status.value)
                                const SIcon = sm.icon
                                return (
                                    <SelectItem key={status.value} value={status.value}>
                                        <div className="flex items-center gap-2">
                                            <SIcon className={cn("h-3.5 w-3.5", sm.tone)} />
                                            {status.label}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </Field>
            )}

            <Field icon={FileSignature} label="Ghi chú" className="md:col-span-2 xl:col-span-3">
                <Textarea
                    rows={3}
                    placeholder="VD: Giao trước 5h chiều, gọi điện trước khi tới..."
                    value={value.note || ""}
                    onChange={(event) => update({ note: event.target.value })}
                />
            </Field>
        </div>
    )
}

function Field({
    icon: Icon,
    label,
    required,
    className,
    children,
}: {
    icon?: React.ComponentType<{ className?: string }>
    label: string
    required?: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <Label className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {children}
        </div>
    )
}
