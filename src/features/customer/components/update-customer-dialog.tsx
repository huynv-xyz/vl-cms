import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateCustomer,
    type UpdateCustomerRequest,
} from "@/api/customer"
import type { Customer } from "../data/schema"
import { customerSchema, customerUiSchema } from "./customer-form-schema"
import type { CustomerFormValues } from "./types"

type Props = {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateCustomerDialog({
    customer,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<CustomerFormValues, UpdateCustomerRequest, unknown>
            title="Cập nhật Customer"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={customerSchema}
            uiSchema={customerUiSchema}
            defaultValues={{
                code: customer.code,
                name: customer.name,
                address: customer.address ?? "",
                type: customer.type,
                region: customer.region,
                employee_id: customer.employee_id,
                note: customer.note ?? "",
                status: customer.status === 1,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["customer"]}
            mutationFn={updateCustomer}
            mapFormToRequest={(values) => ({
                id: customer.id,
                code: values.code,
                name: values.name,
                address: values.address?.trim() ? values.address.trim() : "",
                type: values.type,
                region: values.region,
                employee_id: values.employee_id,
                note: values.note?.trim() ? values.note.trim() : "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
