import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateEmployee,
    type UpdateEmployeeRequest,
} from "@/api/employee"
import type { Employee } from "../data/schema"
import { employeeSchema, employeeUiSchema } from "./employee-form-schema"
import type { EmployeeFormValues } from "./types"

type Props = {
    employee: Employee
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateEmployeeDialog({
    employee,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<EmployeeFormValues, UpdateEmployeeRequest, unknown>
            title="Cập nhật nhân viên"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={employeeSchema}
            uiSchema={employeeUiSchema}
            defaultValues={{
                code: employee.code,
                name: employee.name,
                birth_date: employee.birth_date,
                permanent_address: employee.permanent_address ?? "",
                identity_no: employee.identity_no ?? "",
                identity_issue_date: employee.identity_issue_date,
                identity_issue_place: employee.identity_issue_place ?? "",
                status: employee.status === 1 ? 1 : 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["employee"]}
            mutationFn={updateEmployee}
            mapFormToRequest={(values) => ({
                id: employee.id,
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
