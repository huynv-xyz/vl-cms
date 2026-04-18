import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createProvince, type CreateProvinceRequest } from "@/api/province"
import { provinceSchema, provinceUiSchema } from "./province-form-schema"
import type { ProvinceFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateProvinceDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<ProvinceFormValues, CreateProvinceRequest, unknown>
            title="Tạo mới"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={provinceSchema}
            uiSchema={provinceUiSchema}
            defaultValues={{
                code: "",
                name: "",
                region_id: undefined,
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["province"]}
            mutationFn={createProvince}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                regionId: values.region_id,
                status: values.status === 0 ? 0 : 1,
            })}
        />
    )
}