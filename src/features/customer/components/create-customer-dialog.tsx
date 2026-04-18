import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createCustomer,
    type CreateCustomerRequest,
} from "@/api/customer"
import { customerSchema, customerUiSchema } from "./customer-form-schema"
import type { CustomerFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateCustomerDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<CustomerFormValues, CreateCustomerRequest, unknown>
            title="Tạo Customer"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={customerSchema}
            uiSchema={customerUiSchema}
            defaultValues={{
                code: "",
                name: "",
                type: "B2B",
                region: "MB",
                note: "",
                status: true,
            }}
            submitText="Tạo Customer"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["customer"]}
            mutationFn={createCustomer}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                type: values.type,
                region: values.region,
                note: values.note?.trim() ? values.note.trim() : "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}