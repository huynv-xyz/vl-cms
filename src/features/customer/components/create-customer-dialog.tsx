import {
    createCustomer,
    type CreateCustomerRequest,
} from "@/api/customer"
import { CustomerEditorDialog } from "./customer-editor-dialog"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateCustomerDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CustomerEditorDialog<CreateCustomerRequest, unknown>
            title="Tạo khách hàng"
            open={open}
            onOpenChange={onOpenChange}
            defaultValues={{
                code: "",
                name: "",
                address: "",
                type: "B2B",
                region: "MB",
                employee_id: undefined,
                note: "",
                status: true,
                invoice_alias_code: "",
                invoice_alias_name: "",
                invoice_tax_code: "",
                invoice_address: "",
                bank_account: "",
                bank_account_name: "",
                bank_name: "",
            }}
            submitText="Tạo khách hàng"
            loadingText="Đang tạo..."
            mutationFn={createCustomer}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                address: values.address?.trim() ? values.address.trim() : "",
                type: values.type,
                region: values.region,
                employee_id: values.employee_id,
                note: values.note?.trim() ? values.note.trim() : "",
                status: values.status === false ? 0 : 1,
                invoice_alias_code: values.invoice_alias_code?.trim() || values.code.trim(),
                invoice_alias_name: values.invoice_alias_name?.trim() || values.name.trim(),
                invoice_tax_code: values.invoice_tax_code?.trim() || undefined,
                invoice_address: values.invoice_address?.trim() || undefined,
                bank_account: values.bank_account?.trim() || undefined,
                bank_account_name: values.bank_account_name?.trim() || undefined,
                bank_name: values.bank_name?.trim() || undefined,
            })}
        />
    )
}
