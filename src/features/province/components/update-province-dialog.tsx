import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateProvince,
    type UpdateProvinceRequest,
} from "@/api/province"
import type { Province } from "../data/schema"
import { provinceSchema, provinceUiSchema } from "./province-form-schema"
import type { ProvinceFormValues } from "./types"

type Props = {
    province: Province
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateProvinceDialog({
    province,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<ProvinceFormValues, UpdateProvinceRequest, unknown>
            title="Cập nhật"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={provinceSchema}
            uiSchema={provinceUiSchema}
            defaultValues={{
                code: province.code,
                name: province.name,
                region_id: province.region_id ?? undefined,
                status: province.status === 1 ? 1 : 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["province"]}
            mutationFn={updateProvince}
            mapFormToRequest={(values) => ({
                id: province.id,
                code: values.code,
                name: values.name,
                regionId: values.region_id,
                status: values.status === 0 ? 0 : 1,
            })}
        />
    )
}