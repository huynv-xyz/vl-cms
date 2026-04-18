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
                gender: "Nam",
                birth_date: "",
                permanent_address: "",
                identity_no: "",
                identity_issue_date: "",
                identity_issue_place: "",
                dependent_count: 0,
                insurance_base: 0,
                basic_salary: 0,
                allowance_salary: 0,
                is_union_member: 0,
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["employee"]}
            mutationFn={createEmployee}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                gender: values.gender ?? "",
                birth_date: values.birth_date ?? "",
                permanent_address: values.permanent_address?.trim()
                    ? values.permanent_address.trim()
                    : "",
                identity_no: values.identity_no?.trim()
                    ? values.identity_no.trim()
                    : "",
                identity_issue_date: values.identity_issue_date ?? "",
                identity_issue_place: values.identity_issue_place?.trim()
                    ? values.identity_issue_place.trim()
                    : "",
                dependent_count: values.dependent_count ?? 0,
                insurance_base: values.insurance_base ?? 0,
                basic_salary: values.basic_salary ?? 0,
                allowance_salary: values.allowance_salary ?? 0,
                is_union_member: values.is_union_member === 1 ? 1 : 0,
                status: values.status === 0 ? 0 : 1,
            })}
        />
    )
}