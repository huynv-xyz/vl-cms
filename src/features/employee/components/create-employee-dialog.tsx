import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createEmployee, type CreateEmployeeRequest } from "@/api/employee"
import { employeeSchema, employeeUiSchema } from "./employee-form-schema"
import type { EmployeeFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateEmployeeDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<EmployeeFormValues, CreateEmployeeRequest, unknown>
            title="Tạo nhân viên"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={employeeSchema}
            uiSchema={employeeUiSchema}
            defaultValues={{
                code: "",
                name: "",
                birth_date: "",
                permanent_address: "",
                identity_no: "",
                identity_issue_date: "",
                identity_issue_place: "",
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["employee"]}
            mutationFn={createEmployee}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                birth_date: values.birth_date || null,
                permanent_address: values.permanent_address?.trim()
                    ? values.permanent_address.trim()
                    : "",
                identity_no: values.identity_no?.trim()
                    ? values.identity_no.trim()
                    : "",
                identity_issue_date: values.identity_issue_date || null,
                identity_issue_place: values.identity_issue_place?.trim()
                    ? values.identity_issue_place.trim()
                    : "",
                status: values.status === 0 ? 0 : 1,
            })}
        />
    )
}
