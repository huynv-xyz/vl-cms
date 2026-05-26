import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipProductMapping,
    type CreateVipProductMappingRequest,
} from "@/api/vip-product-mapping"

import { vipProductMappingSchema, vipProductMappingUiSchema } from "./vip-product-mapping-form-schema"
import type { VipProductMappingFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipProductMappingDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipProductMappingFormValues, CreateVipProductMappingRequest, unknown>
            title="Tạo mới Mapping hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipProductMappingSchema}
            uiSchema={vipProductMappingUiSchema}
            defaultValues={{
                misa_code: "",
                product_sub_code: "",
                group_code: "",
                product_group: "",
                product_name: "",
                unit: "",
                conversion_factor: 1,
                calc_point: 1,
                calc_reward: 1,
                is_promotion: 0,
                note: "",
                status: true,
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo mapping hàng hóa thành công"
            errorMessage="Tạo mapping hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={createVipProductMapping}
            mapFormToRequest={(values) => ({
                misa_code: values.misa_code,
                product_sub_code: values.product_sub_code,
                group_code: values.group_code ?? "",
                product_group: values.product_group ?? "",
                product_name: values.product_name ?? "",
                unit: values.unit ?? "",
                conversion_factor: values.conversion_factor ?? 1,
                calc_point: values.calc_point ?? 1,
                calc_reward: values.calc_reward ?? 1,
                is_promotion: values.is_promotion ?? 0,
                note: values.note ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
