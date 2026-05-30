import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateCompany, type UpdateCompanyRequest } from "@/api/company"
import type { Company } from "../data/schema"
import { companySchema, companyUiSchema } from "./company-form-schema"
import type { CompanyFormValues } from "./types"

type Props = {
    company: Company
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateCompanyDialog({
    company,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<CompanyFormValues, UpdateCompanyRequest, unknown>
            title="Cập nhật công ty"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={companySchema}
            uiSchema={companyUiSchema}
            defaultValues={{
                name: company.name ?? "",
                address: company.address ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["company"]}
            mutationFn={updateCompany}
            mapFormToRequest={(values) => ({
                id: company.id,
                name: values.name?.trim() ?? "",
                address: values.address?.trim() ?? "",
            })}
        />
    )
}
