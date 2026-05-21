import { getCompany, listCompanies } from "@/api/company"
import { getOrder, listOrders } from "@/api/sale/order"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { companyOption, orderOption } from "@/lib/option-mapper"

type Props = {
    value: any
    onChange: (value: any) => void
    lockedOrder?: boolean
}

export function DeliveryHeaderFields({
    value,
    onChange,
    lockedOrder,
}: Props) {
    const update = (patch: any) => onChange({ ...value, ...patch })

    return (
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Đơn hàng" required>
                <AsyncSelect
                    placeholder="Chọn đơn hàng"
                    value={value.order_id}
                    onChange={(orderId: any) => update({ order_id: orderId })}
                    required
                    disabled={lockedOrder}
                    dataSource={{ getList: listOrders, getById: getOrder }}
                    mapOption={orderOption}
                />
            </Field>

            <Field label="Ngày giao" required>
                <Input
                    type="date"
                    value={value.delivery_date || ""}
                    onChange={(event) => update({ delivery_date: event.target.value })}
                />
            </Field>

            <Field label="Công ty xuất">
                <AsyncSelect
                    placeholder="Chọn công ty xuất"
                    value={value.company_id}
                    onChange={(companyId: any) => update({ company_id: companyId })}
                    dataSource={{ getList: listCompanies, getById: getCompany }}
                    mapOption={companyOption}
                />
            </Field>

            <Field label="Địa chỉ giao" className="md:col-span-2">
                <Textarea
                    rows={3}
                    placeholder="Nhập địa chỉ giao hàng"
                    value={value.delivery_address || ""}
                    onChange={(event) => update({ delivery_address: event.target.value })}
                />
            </Field>

            <Field label="Ghi chú" className="md:col-span-2 xl:col-span-1">
                <Textarea
                    rows={3}
                    placeholder="Ghi chú cho phiếu giao"
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
