import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createCompany, type CreateCompanyRequest } from "@/api/company"
import { companySchema, companyUiSchema } from "./company-form-schema"
import type { CompanyFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateCompanyDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<CompanyFormValues, CreateCompanyRequest, unknown>
            title="Tạo công ty"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={companySchema}
            uiSchema={companyUiSchema}
            defaultValues={{
                name: "",
                address: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["company"]}
            mutationFn={createCompany}
            mapFormToRequest={(values) => ({
                name: values.name?.trim() ?? "",
                address: values.address?.trim() ?? "",
            })}
        />
    )
}
